const axios = require('axios');
const pino = require('pino');
const cache = require('../config/cache');

const logger = pino({ name: 'perplexity-service' });

class PerplexityEnrichmentService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = 'https://api.perplexity.ai';
    this.model = 'llama-3.1-sonar-large-128k-online';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Enrich company data with email and contact information
   */
  async enrichCompanyContacts(company) {
    const cacheKey = `perplexity:contacts:${company.company_number}`;
    
    try {
      // Check cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info({ companyNumber: company.company_number }, 'Using cached Perplexity data');
        return JSON.parse(cached);
      }

      // Build search query
      const query = this.buildContactQuery(company);
      
      // Call Perplexity API
      const result = await this.searchWithRetry(query);
      
      // Parse and validate results
      const enrichedData = this.parseContactResults(result, company);
      
      // Cache for 7 days
      await cache.setex(cacheKey, 604800, JSON.stringify(enrichedData));
      
      logger.info({
        companyNumber: company.company_number,
        emailsFound: enrichedData.emails.length,
        phonesFound: enrichedData.phones.length
      }, 'Company enriched via Perplexity');
      
      return enrichedData;
      
    } catch (error) {
      logger.error({
        error,
        companyNumber: company.company_number
      }, 'Perplexity enrichment failed');
      
      return {
        emails: [],
        phones: [],
        website: null,
        socialMedia: {},
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Verify email address validity using Perplexity
   */
  async verifyEmail(email, companyName) {
    try {
      const query = `Verify if the email address "${email}" is associated with the company "${companyName}". Check if:
1. The domain matches the company website
2. The email format is valid for business use
3. Any public records show this email for this company
Respond with: VALID, INVALID, or UNCERTAIN and explain why.`;

      const result = await this.searchWithRetry(query);
      
      return this.parseEmailVerification(result, email);
      
    } catch (error) {
      logger.error({ error, email }, 'Email verification failed');
      return { valid: false, confidence: 0, reason: 'verification_failed' };
    }
  }

  /**
   * Find company website using Perplexity
   */
  async findWebsite(company) {
    const cacheKey = `perplexity:website:${company.company_number}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const query = `What is the official website URL for "${company.company_name}" (UK company number: ${company.company_number})? Return only the URL.`;
      
      const result = await this.searchWithRetry(query);
      const website = this.extractWebsite(result);
      
      await cache.setex(cacheKey, 2592000, JSON.stringify(website)); // 30 days
      
      return website;
      
    } catch (error) {
      logger.error({ error, companyNumber: company.company_number }, 'Website search failed');
      return null;
    }
  }

  /**
   * Build optimized search query for contact information
   */
  buildContactQuery(company) {
    const companyName = company.company_name;
    const companyNumber = company.company_number;
    const address = company.registered_address || '';

    return `Find verified contact information for the UK company:
Company Name: ${companyName}
Company Number: ${companyNumber}
Address: ${address}

Please provide:
1. Official email addresses (general inquiries, info@, contact@, etc.)
2. Phone numbers (UK format)
3. Official website URL
4. LinkedIn company page
5. Twitter/X handle

Only include information that you can verify from reliable sources. Mark confidence level for each item.`;
  }

  /**
   * Parse contact results from Perplexity response
   */
  parseContactResults(response, company) {
    const content = response.choices[0]?.message?.content || '';
    
    return {
      emails: this.extractEmails(content),
      phones: this.extractPhones(content),
      website: this.extractWebsite(content),
      socialMedia: this.extractSocialMedia(content),
      linkedin: this.extractLinkedIn(content),
      confidence: this.calculateConfidence(content),
      rawResponse: content,
      citations: response.citations || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract email addresses from text
   */
  extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex) || [];
    
    // Filter out common false positives
    return matches
      .filter(email => !email.includes('example.com'))
      .filter(email => !email.includes('test.com'))
      .filter((email, index, self) => self.indexOf(email) === index) // Unique
      .slice(0, 5); // Max 5 emails
  }

  /**
   * Extract UK phone numbers
   */
  extractPhones(text) {
    const phoneRegex = /(?:(?:\+44\s?|0)(?:\d\s?){10})/g;
    const matches = text.match(phoneRegex) || [];
    
    return matches
      .map(phone => phone.replace(/\s/g, ''))
      .filter((phone, index, self) => self.indexOf(phone) === index)
      .slice(0, 3);
  }

  /**
   * Extract website URL
   */
  extractWebsite(text) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const matches = text.match(urlRegex) || [];
    
    // Prefer .co.uk or .com domains
    const website = matches.find(url => url.includes('.co.uk')) || 
                    matches.find(url => url.includes('.com')) ||
                    matches[0];
    
    return website ? website.replace(/[,;.]$/, '') : null;
  }

  /**
   * Extract social media handles
   */
  extractSocialMedia(text) {
    return {
      twitter: this.extractPattern(text, /twitter\.com\/([a-zA-Z0-9_]+)/),
      linkedin: this.extractPattern(text, /linkedin\.com\/company\/([a-zA-Z0-9-]+)/),
      facebook: this.extractPattern(text, /facebook\.com\/([a-zA-Z0-9.]+)/)
    };
  }

  /**
   * Extract LinkedIn company page
   */
  extractLinkedIn(text) {
    const match = text.match(/linkedin\.com\/company\/([a-zA-Z0-9-]+)/);
    return match ? `https://linkedin.com/company/${match[1]}` : null;
  }

  /**
   * Extract pattern from text
   */
  extractPattern(text, regex) {
    const match = text.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Calculate confidence score based on response
   */
  calculateConfidence(text) {
    let score = 0;
    
    if (text.includes('verified') || text.includes('confirmed')) score += 30;
    if (text.includes('official')) score += 20;
    if (text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) score += 25;
    if (text.match(/https?:\/\//)) score += 25;
    
    return Math.min(score, 100);
  }

  /**
   * Parse email verification response
   */
  parseEmailVerification(response, email) {
    const content = response.choices[0]?.message?.content || '';
    const lower = content.toLowerCase();
    
    let valid = false;
    let confidence = 0;
    let reason = '';
    
    if (lower.includes('valid') && !lower.includes('invalid')) {
      valid = true;
      confidence = 70;
      reason = 'appears_valid';
    } else if (lower.includes('invalid')) {
      valid = false;
      confidence = 80;
      reason = 'appears_invalid';
    } else {
      valid = false;
      confidence = 30;
      reason = 'uncertain';
    }
    
    return { valid, confidence, reason, analysis: content };
  }

  /**
   * Call Perplexity API with retry logic
   */
  async searchWithRetry(query, attempt = 1) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a business intelligence assistant that finds and verifies company contact information from reliable public sources. Always cite your sources.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          return_citations: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data;
      
    } catch (error) {
      if (attempt < this.maxRetries) {
        logger.warn({ attempt, error: error.message }, 'Perplexity API call failed, retrying...');
        await this.sleep(this.retryDelay * attempt);
        return this.searchWithRetry(query, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Batch enrich multiple companies
   */
  async batchEnrich(companies, options = {}) {
    const { concurrency = 5, delayMs = 1000 } = options;
    const results = [];
    
    for (let i = 0; i < companies.length; i += concurrency) {
      const batch = companies.slice(i, i + concurrency);
      
      const batchResults = await Promise.all(
        batch.map(company => this.enrichCompanyContacts(company))
      );
      
      results.push(...batchResults);
      
      // Rate limiting delay
      if (i + concurrency < companies.length) {
        await this.sleep(delayMs);
      }
    }
    
    return results;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PerplexityEnrichmentService();
