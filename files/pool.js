const { Pool } = require('pg');
const pino = require('pino');

const logger = pino({ name: 'database' });

// ============================================================
// OPTIMIZED CONNECTION POOL FOR 5.8M RECORDS
// ============================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Connection pool optimization for high-volume queries
  max: 20, // Maximum pool size
  min: 5, // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  
  // Query optimization
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 30000,
  
  // Performance tuning
  application_name: 'fineguard-enterprise'
});

// Connection error handling
pool.on('error', (err, client) => {
  logger.error({ error: err }, 'Unexpected database error');
});

pool.on('connect', (client) => {
  logger.debug('New database connection established');
  
  // Set session-level optimizations
  client.query(`
    SET work_mem = '256MB';
    SET random_page_cost = 1.1;
    SET effective_cache_size = '4GB';
  `).catch(err => logger.warn({ error: err }, 'Failed to set session parameters'));
});

// ============================================================
// OPTIMIZED QUERY UTILITIES
// ============================================================

/**
 * Execute query with automatic retry and connection pool management
 */
async function query(text, params, options = {}) {
  const { retries = 3, timeout = 30000 } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const client = await pool.connect();
    
    try {
      const start = Date.now();
      
      // Set statement timeout for this query
      await client.query(`SET statement_timeout = ${timeout}`);
      
      const result = await client.query(text, params);
      
      const duration = Date.now() - start;
      
      logger.debug({
        query: text.substring(0, 100),
        duration,
        rows: result.rowCount
      }, 'Query executed');
      
      return result;
      
    } catch (error) {
      logger.error({
        error,
        attempt,
        query: text.substring(0, 100)
      }, 'Query failed');
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 100);
      
    } finally {
      client.release();
    }
  }
}

/**
 * Optimized pagination for large datasets (5.8M records)
 * Uses cursor-based pagination instead of OFFSET for better performance
 */
async function paginateCompanies(options = {}) {
  const {
    cursor = null,
    limit = 100,
    filters = {},
    sortField = 'company_number',
    sortOrder = 'ASC'
  } = options;
  
  const params = [];
  let paramCount = 1;
  
  // Build WHERE clause
  const whereClauses = [];
  
  if (cursor) {
    whereClauses.push(`${sortField} ${sortOrder === 'ASC' ? '>' : '<'} $${paramCount}`);
    params.push(cursor);
    paramCount++;
  }
  
  if (filters.status) {
    whereClauses.push(`status = $${paramCount}`);
    params.push(filters.status);
    paramCount++;
  }
  
  if (filters.sic_code) {
    whereClauses.push(`sic_codes @> $${paramCount}::jsonb`);
    params.push(JSON.stringify([filters.sic_code]));
    paramCount++;
  }
  
  if (filters.search) {
    whereClauses.push(`company_name ILIKE $${paramCount}`);
    params.push(`%${filters.search}%`);
    paramCount++;
  }
  
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  params.push(limit + 1); // Fetch one extra to determine if there are more results
  
  const queryText = `
    SELECT 
      company_number,
      company_name,
      status,
      incorporation_date,
      sic_codes,
      registered_address,
      email,
      phone,
      website,
      enrichment_status,
      risk_score,
      updated_at
    FROM companies
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${paramCount}
  `;
  
  const result = await query(queryText, params);
  
  const hasMore = result.rows.length > limit;
  const companies = hasMore ? result.rows.slice(0, limit) : result.rows;
  const nextCursor = hasMore ? companies[companies.length - 1][sortField] : null;
  
  return {
    data: companies,
    pagination: {
      hasMore,
      nextCursor,
      count: companies.length
    }
  };
}

/**
 * Bulk insert with optimized batch processing
 */
async function bulkInsertCompanies(companies, batchSize = 1000) {
  const totalBatches = Math.ceil(companies.length / batchSize);
  const results = [];
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    logger.info({ batchNumber, totalBatches }, 'Processing batch');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Use COPY for maximum performance on large datasets
      const values = batch.map(company => [
        company.company_number,
        company.company_name,
        company.status,
        company.incorporation_date,
        JSON.stringify(company.sic_codes || []),
        company.registered_address,
        company.company_type
      ]);
      
      const queryText = `
        INSERT INTO companies (
          company_number,
          company_name,
          status,
          incorporation_date,
          sic_codes,
          registered_address,
          company_type
        )
        VALUES ${values.map((_, idx) => 
          `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}::jsonb, $${idx * 7 + 6}, $${idx * 7 + 7})`
        ).join(',')}
        ON CONFLICT (company_number) 
        DO UPDATE SET
          company_name = EXCLUDED.company_name,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;
      
      const flatValues = values.flat();
      const result = await client.query(queryText, flatValues);
      
      await client.query('COMMIT');
      
      results.push({
        batch: batchNumber,
        inserted: result.rowCount
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error, batchNumber }, 'Batch insert failed');
      throw error;
    } finally {
      client.release();
    }
  }
  
  return results;
}

/**
 * Optimized search with full-text search and GIN index
 */
async function searchCompanies(searchTerm, options = {}) {
  const { limit = 50, offset = 0 } = options;
  
  const queryText = `
    SELECT 
      company_number,
      company_name,
      status,
      registered_address,
      email,
      website,
      ts_rank(search_vector, plainto_tsquery('english', $1)) AS rank
    FROM companies
    WHERE search_vector @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC, company_name
    LIMIT $2 OFFSET $3
  `;
  
  return query(queryText, [searchTerm, limit, offset]);
}

/**
 * Get enrichment candidates - companies that need email discovery
 */
async function getEnrichmentCandidates(limit = 100) {
  const queryText = `
    SELECT 
      company_number,
      company_name,
      status,
      registered_address,
      sic_codes,
      website
    FROM companies
    WHERE (
      (email IS NULL OR email = '')
      AND status = 'active'
      AND (enrichment_status = 'pending' OR enrichment_status IS NULL)
      AND (last_checked_at IS NULL OR last_checked_at < NOW() - INTERVAL '30 days')
    )
    ORDER BY 
      CASE 
        WHEN website IS NOT NULL THEN 1
        ELSE 2
      END,
      incorporation_date DESC
    LIMIT $1
    FOR UPDATE SKIP LOCKED
  `;
  
  return query(queryText, [limit]);
}

/**
 * Update company enrichment data
 */
async function updateEnrichment(companyNumber, enrichmentData) {
  const queryText = `
    UPDATE companies
    SET
      email = COALESCE($2, email),
      phone = COALESCE($3, phone),
      website = COALESCE($4, website),
      enrichment_status = $5,
      enriched_at = NOW(),
      last_checked_at = NOW(),
      updated_at = NOW()
    WHERE company_number = $1
    RETURNING *
  `;
  
  return query(queryText, [
    companyNumber,
    enrichmentData.email,
    enrichmentData.phone,
    enrichmentData.website,
    enrichmentData.status || 'complete'
  ]);
}

/**
 * Get aggregated statistics
 */
async function getStatistics() {
  const queryText = `
    SELECT
      COUNT(*) as total_companies,
      COUNT(*) FILTER (WHERE status = 'active') as active_companies,
      COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as companies_with_email,
      COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') as companies_with_website,
      COUNT(*) FILTER (WHERE enrichment_status = 'complete') as enriched_companies,
      COUNT(*) FILTER (WHERE enrichment_status = 'pending') as pending_enrichment,
      ROUND(AVG(risk_score), 2) as avg_risk_score
    FROM companies
  `;
  
  const result = await query(queryText);
  return result.rows[0];
}

/**
 * Create optimized indexes for 5.8M records
 */
async function createOptimizedIndexes() {
  const client = await pool.connect();
  
  try {
    logger.info('Creating optimized indexes...');
    
    await client.query('BEGIN');
    
    // Core indexes
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_status 
      ON companies(status) WHERE status = 'active'
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_enrichment 
      ON companies(enrichment_status, last_checked_at)
      WHERE enrichment_status IN ('pending', 'failed')
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_email 
      ON companies(company_number) WHERE email IS NULL OR email = ''
    `);
    
    // GIN index for full-text search
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search_vector 
      ON companies USING gin(search_vector)
    `);
    
    // GIN index for JSONB SIC codes
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_sic_codes 
      ON companies USING gin(sic_codes)
    `);
    
    await client.query('COMMIT');
    
    logger.info('Indexes created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Failed to create indexes');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Utility: Sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Graceful shutdown
async function closePool() {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
}

module.exports = {
  pool,
  query,
  paginateCompanies,
  bulkInsertCompanies,
  searchCompanies,
  getEnrichmentCandidates,
  updateEnrichment,
  getStatistics,
  createOptimizedIndexes,
  closePool
};
