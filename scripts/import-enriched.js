#!/usr/bin/env node
/**
 * Import Enriched Companies with Email, Phone, Website
 */

const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CSV_FILE = '/Users/admin/Downloads/enriched_companies.csv';

async function importEnrichedCompanies() {
  console.log('🎯 Importing enriched companies with contact details...\n');
  console.log('📁 Source:', CSV_FILE);

  const client = await pool.connect();
  let imported = 0;

  try {
    // Ensure table exists with enrichment columns
    console.log('📋 Preparing enriched_companies table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS enriched_companies (
        id SERIAL PRIMARY KEY,
        company_number VARCHAR(8),
        company_name VARCHAR(500),
        email VARCHAR(255),
        phone VARCHAR(50),
        website VARCHAR(500),
        contact_person VARCHAR(255),
        notes TEXT,
        full_address TEXT,
        risk_level VARCHAR(20),
        risk_score INTEGER,
        source VARCHAR(50) DEFAULT 'csv_import',
        confidence INTEGER DEFAULT 100,
        enriched_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(company_number)
      )
    `);

    // Add missing columns if they don't exist
    await client.query('ALTER TABLE enriched_companies ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)');
    await client.query('ALTER TABLE enriched_companies ADD COLUMN IF NOT EXISTS notes TEXT');
    await client.query('ALTER TABLE enriched_companies ADD COLUMN IF NOT EXISTS full_address TEXT');
    await client.query('ALTER TABLE enriched_companies ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20)');
    await client.query('ALTER TABLE enriched_companies ADD COLUMN IF NOT EXISTS risk_score INTEGER');

    // Truncate existing data
    await client.query('TRUNCATE TABLE enriched_companies RESTART IDENTITY CASCADE');

    // Add unique constraint if it doesn't exist
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_enriched_companies_number ON enriched_companies(company_number)');

    console.log('✅ Table ready (with enrichment columns)\n');

    console.log('📥 Processing enriched data...\n');

    const stream = fs.createReadStream(CSV_FILE).pipe(csv({
      mapHeaders: ({ header }) => header.trim()
    }));

    for await (const row of stream) {
      const query = `
        INSERT INTO enriched_companies (
          company_number, company_name, email, phone, website,
          contact_person, notes, full_address, risk_level, risk_score,
          source, confidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (company_number) DO UPDATE SET
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          contact_person = EXCLUDED.contact_person,
          notes = EXCLUDED.notes,
          full_address = EXCLUDED.full_address,
          risk_level = EXCLUDED.risk_level,
          risk_score = EXCLUDED.risk_score,
          enriched_at = NOW()
      `;

      const params = [
        row.CompanyNumber || row[' CompanyNumber'],
        row.CompanyName || row[' CompanyName'],
        row.Email?.trim() || null,
        row.Phone?.trim() || null,
        row.Website?.trim() || null,
        row.ContactPerson?.trim() || null,
        row.Notes?.trim() || null,
        row.FullAddress?.trim() || null,
        row.RiskLevel?.trim() || null,
        row.RiskScore ? parseInt(row.RiskScore) : null,
        'enriched_csv',
        95 // High confidence from enriched CSV
      ];

      await client.query(query, params);
      imported++;

      if (imported % 500 === 0) {
        console.log(`   ✅ Imported ${imported.toLocaleString()} enriched records...`);
      }
    }

    console.log(`\n✅ Import complete! Total: ${imported.toLocaleString()} enriched companies\n`);

    // Show stats
    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(email) FILTER (WHERE email IS NOT NULL) as with_email,
        COUNT(phone) FILTER (WHERE phone IS NOT NULL) as with_phone,
        COUNT(website) FILTER (WHERE website IS NOT NULL) as with_website,
        COUNT(risk_level) FILTER (WHERE risk_level = 'HIGH') as high_risk,
        COUNT(risk_level) FILTER (WHERE risk_level = 'MEDIUM') as medium_risk,
        COUNT(risk_level) FILTER (WHERE risk_level = 'LOW') as low_risk
      FROM enriched_companies
    `);

    const s = stats.rows[0];
    console.log('📊 Enrichment Statistics:');
    console.log(`   Total enriched: ${parseInt(s.total).toLocaleString()}`);
    console.log(`   With email: ${parseInt(s.with_email).toLocaleString()}`);
    console.log(`   With phone: ${parseInt(s.with_phone).toLocaleString()}`);
    console.log(`   With website: ${parseInt(s.with_website).toLocaleString()}`);
    console.log(`\n   Risk Assessment:`);
    console.log(`   High risk: ${parseInt(s.high_risk).toLocaleString()}`);
    console.log(`   Medium risk: ${parseInt(s.medium_risk).toLocaleString()}`);
    console.log(`   Low risk: ${parseInt(s.low_risk).toLocaleString()}`);

    console.log('\n🎉 Enriched companies import successful!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importEnrichedCompanies().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
