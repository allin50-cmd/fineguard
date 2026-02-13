#!/usr/bin/env node
/**
 * Fix Companies Table Schema
 * Adds missing columns to match the import script expectations
 */

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
  console.log('🔧 Fixing companies table schema...\n');

  const client = await pool.connect();
  try {
    // Create table if not exists
    console.log('1. Ensuring companies table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(500),
        company_number VARCHAR(8) UNIQUE NOT NULL,
        company_category VARCHAR(100),
        company_status VARCHAR(50),
        country_of_origin VARCHAR(100),
        dissolution_date DATE,
        incorporation_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table exists\n');

    // Add missing columns
    console.log('2. Adding missing columns...');

    const columns = [
      'reg_address_care_of VARCHAR(255)',
      'reg_address_po_box VARCHAR(50)',
      'reg_address_line1 VARCHAR(255)',
      'reg_address_line2 VARCHAR(255)',
      'reg_address_post_town VARCHAR(100)',
      'reg_address_county VARCHAR(100)',
      'reg_address_country VARCHAR(100)',
      'reg_address_postcode VARCHAR(20)',
      'accounts_ref_day INTEGER',
      'accounts_ref_month INTEGER',
      'accounts_next_due_date DATE',
      'accounts_last_made_up_date DATE',
      'accounts_category VARCHAR(100)',
      'sic_code_1 VARCHAR(255)',
      'sic_code_2 VARCHAR(255)',
      'sic_code_3 VARCHAR(255)',
      'sic_code_4 VARCHAR(255)',
      'company_status VARCHAR(50)',
      'company_category VARCHAR(100)',
      'country_of_origin VARCHAR(100)',
      'dissolution_date DATE'
    ];

    for (const column of columns) {
      const columnName = column.split(' ')[0];
      try {
        await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`   ✅ ${columnName}`);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.log(`   ⚠️  ${columnName}: ${err.message}`);
        }
      }
    }
    console.log('✅ All columns added\n');

    // Create indexes
    console.log('3. Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_number ON companies(company_number)');
    console.log('   ✅ idx_companies_number');

    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name)');
    console.log('   ✅ idx_companies_name');

    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(company_status)');
    console.log('   ✅ idx_companies_status');

    await client.query('CREATE INDEX IF NOT EXISTS idx_companies_postcode ON companies(reg_address_postcode)');
    console.log('   ✅ idx_companies_postcode');
    console.log('✅ Indexes created\n');

    // Show table structure
    console.log('4. Current table structure:');
    const columns_query = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position
    `);

    console.log('\nColumn Name                     | Type              | Max Length');
    console.log('--------------------------------|-------------------|------------');
    columns_query.rows.forEach(col => {
      const name = col.column_name.padEnd(30);
      const type = col.data_type.padEnd(17);
      const length = col.character_maximum_length || '';
      console.log(`${name} | ${type} | ${length}`);
    });

    // Show row count
    const count = await client.query('SELECT COUNT(*) FROM companies');
    console.log(`\n📊 Total records: ${parseInt(count.rows[0].count).toLocaleString()}`);

    // Test insert
    console.log('\n5. Testing insert with all columns...');
    try {
      await client.query(`
        INSERT INTO companies (
          company_name, company_number, company_status,
          reg_address_line1, reg_address_post_town, reg_address_postcode,
          company_category, incorporation_date
        ) VALUES (
          'TEST COMPANY LTD', 'TEST0001', 'Active',
          '123 Test Street', 'London', 'SW1A 1AA',
          'Private Limited Company', '2025-01-01'
        )
        ON CONFLICT (company_number) DO NOTHING
      `);
      console.log('✅ Test insert successful');

      // Clean up test record
      await client.query("DELETE FROM companies WHERE company_number = 'TEST0001'");
    } catch (err) {
      console.log('❌ Test insert failed:', err.message);
    }

    console.log('\n✅ Schema fix complete!');
    console.log('\nNext step: Run import script');
    console.log('   node scripts/import-companies-azure.js');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
