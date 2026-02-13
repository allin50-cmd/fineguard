#!/usr/bin/env node
/**
 * Simple Reliable Import - Transaction Batching
 * Uses BEGIN/COMMIT transactions for speed without complex parameter binding
 */

const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
});

const CSV_FILE = '/Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv';
const TRANSACTION_SIZE = 1000; //  Commit every 1000 inserts

let totalInserted = 0;
let transactionCount = 0;
const startTime = Date.now();

// Parse date
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

// Parse integer
function parseInteger(val) {
  if (!val || val.trim() === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

// Escape string for SQL
function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function importCompanies() {
  console.log('🚀 Starting simple reliable import...\n');
  console.log('📁 Source:', CSV_FILE);
  console.log('📦 Transaction size:', TRANSACTION_SIZE.toLocaleString());
  console.log('⚡ Progress updates every 50k records\n');

  const client = await pool.connect();

  try {
    // Prepare database
    console.log('📋 Preparing database...');
    await client.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('✅ Table truncated');

    await client.query('DROP INDEX IF EXISTS idx_companies_number CASCADE');
    await client.query('DROP INDEX IF EXISTS idx_companies_name CASCADE');
    await client.query('DROP INDEX IF EXISTS idx_companies_status CASCADE');
    await client.query('DROP INDEX IF EXISTS idx_companies_postcode CASCADE');
    console.log('✅ Indexes dropped\n');

    console.log('📥 Starting import...\n');

    // Begin first transaction
    await client.query('BEGIN');

    const stream = fs.createReadStream(CSV_FILE)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }));

    for await (const row of stream) {
      const query = `
        INSERT INTO companies (
          company_name, company_number, reg_address_care_of, reg_address_po_box,
          reg_address_line1, reg_address_line2, reg_address_post_town, reg_address_county,
          reg_address_country, reg_address_postcode, company_category, company_status,
          country_of_origin, dissolution_date, incorporation_date, accounts_ref_day,
          accounts_ref_month, accounts_next_due_date, accounts_last_made_up_date,
          accounts_category, sic_code_1, sic_code_2, sic_code_3, sic_code_4
        ) VALUES (
          ${escapeString(row.CompanyName)},
          ${escapeString(row.CompanyNumber)},
          ${escapeString(row['RegAddress.CareOf'])},
          ${escapeString(row['RegAddress.POBox'])},
          ${escapeString(row['RegAddress.AddressLine1'])},
          ${escapeString(row['RegAddress.AddressLine2'])},
          ${escapeString(row['RegAddress.PostTown'])},
          ${escapeString(row['RegAddress.County'])},
          ${escapeString(row['RegAddress.Country'])},
          ${escapeString(row['RegAddress.PostCode'])},
          ${escapeString(row.CompanyCategory)},
          ${escapeString(row.CompanyStatus)},
          ${escapeString(row.CountryOfOrigin)},
          ${parseDate(row.DissolutionDate) ? escapeString(parseDate(row.DissolutionDate)) : 'NULL'},
          ${parseDate(row.IncorporationDate) ? escapeString(parseDate(row.IncorporationDate)) : 'NULL'},
          ${parseInteger(row['Accounts.AccountRefDay']) ?? 'NULL'},
          ${parseInteger(row['Accounts.AccountRefMonth']) ?? 'NULL'},
          ${parseDate(row['Accounts.NextDueDate']) ? escapeString(parseDate(row['Accounts.NextDueDate'])) : 'NULL'},
          ${parseDate(row['Accounts.LastMadeUpDate']) ? escapeString(parseDate(row['Accounts.LastMadeUpDate'])) : 'NULL'},
          ${escapeString(row['Accounts.AccountCategory'])},
          ${escapeString(row['SICCode.SicText_1'])},
          ${escapeString(row['SICCode.SicText_2'])},
          ${escapeString(row['SICCode.SicText_3'])},
          ${escapeString(row['SICCode.SicText_4'])}
        )
        ON CONFLICT (company_number) DO NOTHING
      `;

      await client.query(query);
      totalInserted++;
      transactionCount++;

      // Commit transaction every TRANSACTION_SIZE records
      if (transactionCount >= TRANSACTION_SIZE) {
        await client.query('COMMIT');
        await client.query('BEGIN');
        transactionCount = 0;
      }

      // Progress
      if (totalInserted % 50000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = Math.round(totalInserted / elapsed);
        const remaining = Math.round((5685826 - totalInserted) / rate / 60);
        console.log(`   📊 ${totalInserted.toLocaleString()} records (${rate}/sec, ~${remaining}min remaining)`);
      }
    }

    // Commit final transaction
    await client.query('COMMIT');

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Import complete!`);
    console.log(`   Total records: ${totalInserted.toLocaleString()}`);
    console.log(`   Time: ${Math.round(totalTime / 60)} minutes\n`);

    // Rebuild indexes
    console.log('🔧 Rebuilding indexes (5-10 minutes)...');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_number ON companies(company_number)');
    console.log('   ✅ company_number');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON companies(company_name)');
    console.log('   ✅ company_name');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_status ON companies(company_status)');
    console.log('   ✅ company_status');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_postcode ON companies(reg_address_postcode)');
    console.log('   ✅ postcode');

    console.log('\n✅ All indexes rebuilt');

    // Stats
    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE company_status = 'Active') as active
      FROM companies
    `);

    console.log('\n📊 Final Statistics:');
    console.log(`   Total: ${parseInt(stats.rows[0].total).toLocaleString()}`);
    console.log(`   Active: ${parseInt(stats.rows[0].active).toLocaleString()}`);

    const finalTime = (Date.now() - startTime) / 1000;
    console.log(`\n⏱️  Total time: ${Math.round(finalTime / 60)} minutes\n`);
    console.log('🎉 Import successful!\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importCompanies().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
