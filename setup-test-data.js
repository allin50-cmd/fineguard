#!/usr/bin/env node
/**
 * Setup Test Data for APIs
 * Creates missing tables and adds dummy data for testing
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  const client = await pool.connect();
  try {
    // Create clients table if not exists
    console.log('1. Creating clients table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        company_number VARCHAR(8),
        company_name VARCHAR(500),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        account_status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ clients table ready\n');

    // Create enriched_companies table if not exists
    console.log('2. Creating enriched_companies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS enriched_companies (
        id SERIAL PRIMARY KEY,
        company_number VARCHAR(8),
        company_name VARCHAR(500),
        email VARCHAR(255),
        phone VARCHAR(50),
        website VARCHAR(500),
        source VARCHAR(50),
        confidence INTEGER DEFAULT 0,
        enriched_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ enriched_companies table ready\n');

    // Add test client
    console.log('3. Adding test client...');
    const clientInsert = await client.query(`
      INSERT INTO clients (
        user_id, company_number, company_name, contact_email, contact_phone
      ) VALUES (
        1, '00000006', 'MARKS AND SPENCER GROUP PLC', 'test@example.com', '020 1234 5678'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    if (clientInsert.rows.length > 0) {
      console.log('✅ Test client added (ID:', clientInsert.rows[0].id, ')\n');
    } else {
      console.log('ℹ️  Test client already exists\n');
    }

    // Add test enriched companies
    console.log('4. Adding test enriched companies...');
    await client.query(`
      INSERT INTO enriched_companies (
        company_number, company_name, email, website, source, confidence
      ) VALUES
        ('00000006', 'MARKS AND SPENCER GROUP PLC', 'info@marksandspencer.com', 'www.marksandspencer.com', 'perplexity', 95),
        ('00000001', 'BRITISH AIRWAYS PLC', 'info@ba.com', 'www.britishairways.com', 'generated', 75),
        ('00000002', 'TEST COMPANY LTD', 'test@test.com', 'www.test.com', 'perplexity', 85)
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Test enriched companies added\n');

    // Verify counts
    const clientCount = await client.query('SELECT COUNT(*) FROM clients');
    const enrichedCount = await client.query('SELECT COUNT(*) FROM enriched_companies');

    console.log('📊 Current counts:');
    console.log(`   Clients: ${clientCount.rows[0].count}`);
    console.log(`   Enriched companies: ${enrichedCount.rows[0].count}`);

    console.log('\n✅ Test data setup complete!');
    console.log('\nYou can now test:');
    console.log('   curl http://localhost:8080/api/portal/dashboard');
    console.log('   curl http://localhost:8080/api/enrichment/companies');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestData().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
