#!/usr/bin/env node
/**
 * Optimized Companies Import with CSV Parsing
 * Properly handles quoted fields and extracts only needed columns
 */

const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
});

const CSV_FILE = '/Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv';
const BATCH_SIZE = 10000;

let totalInserted = 0;
let batch = [];

// Parse date from DD/MM/YYYY to YYYY-MM-DD
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

// Parse integer safely
function parseInteger(val) {
  if (!val || val.trim() === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

// Build values for batch insert
function buildBatchInsert(records) {
  const values = [];
  const params = [];
  let paramIndex = 1;

  records.forEach(record => {
    const rowParams = [];
    for (let i = 0; i < 24; i++) {
      rowParams.push(`$${paramIndex++}`);
    }
    values.push(`(${rowParams.join(', ')})`);

    // Add all 24 field values
    params.push(
      record.company_name || null,
      record.company_number,
      record.reg_address_care_of || null,
      record.reg_address_po_box || null,
      record.reg_address_line1 || null,
      record.reg_address_line2 || null,
      record.reg_address_post_town || null,
      record.reg_address_county || null,
      record.reg_address_country || null,
      record.reg_address_postcode || null,
      record.company_category || null,
      record.company_status || null,
      record.country_of_origin || null,
      record.dissolution_date,
      record.incorporation_date,
      record.accounts_ref_day,
      record.accounts_ref_month,
      record.accounts_next_due_date,
      record.accounts_last_made_up_date,
      record.accounts_category || null,
      record.sic_code_1 || null,
      record.sic_code_2 || null,
      record.sic_code_3 || null,
      record.sic_code_4 || null
    );
  });

  return { values: values.join(', '), params };
}

// Insert batch
async function insertBatch(client, records) {
  if (records.length === 0) return;

  const { values, params } = buildBatchInsert(records);

  const query = `
    INSERT INTO companies (
      company_name, company_number, reg_address_care_of, reg_address_po_box,
      reg_address_line1, reg_address_line2, reg_address_post_town, reg_address_county,
      reg_address_country, reg_address_postcode, company_category, company_status,
      country_of_origin, dissolution_date, incorporation_date, accounts_ref_day,
      accounts_ref_month, accounts_next_due_date, accounts_last_made_up_date,
      accounts_category, sic_code_1, sic_code_2, sic_code_3, sic_code_4
    ) VALUES ${values}
    ON CONFLICT (company_number) DO NOTHING
  `;

  await client.query(query, params);
  totalInserted += records.length;
}

async function importCompanies() {
  console.log('🚀 Starting optimized import of 5.8M companies...\n');
  console.log('📁 Source:', CSV_FILE);
  console.log('📦 Batch size:', BATCH_SIZE.toLocaleString());
  console.log('⚡ Progress updates every 100k records\n');

  const client = await pool.connect();
  const startTime = Date.now();

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

    console.log('📥 Starting CSV processing and import...\n');

    // Process CSV with proper parsing
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim(),
          skipLines: 0
        }))
        .on('data', async (row) => {
          // Map CSV columns to our schema
          const record = {
            company_name: row.CompanyName || row[' CompanyName'],
            company_number: row.CompanyNumber || row[' CompanyNumber'],
            reg_address_care_of: row['RegAddress.CareOf'] || row[' RegAddress.CareOf'] || '',
            reg_address_po_box: row['RegAddress.POBox'] || row[' RegAddress.POBox'] || '',
            reg_address_line1: row['RegAddress.AddressLine1'] || row[' RegAddress.AddressLine1'] || '',
            reg_address_line2: row['RegAddress.AddressLine2'] || row[' RegAddress.AddressLine2'] || '',
            reg_address_post_town: row['RegAddress.PostTown'] || row[' RegAddress.PostTown'] || '',
            reg_address_county: row['RegAddress.County'] || row[' RegAddress.County'] || '',
            reg_address_country: row['RegAddress.Country'] || row[' RegAddress.Country'] || '',
            reg_address_postcode: row['RegAddress.PostCode'] || row[' RegAddress.PostCode'] || '',
            company_category: row.CompanyCategory || row[' CompanyCategory'] || '',
            company_status: row.CompanyStatus || row[' CompanyStatus'] || '',
            country_of_origin: row.CountryOfOrigin || row[' CountryOfOrigin'] || '',
            dissolution_date: parseDate(row.DissolutionDate || row[' DissolutionDate']),
            incorporation_date: parseDate(row.IncorporationDate || row[' IncorporationDate']),
            accounts_ref_day: parseInteger(row['Accounts.AccountRefDay'] || row[' Accounts.AccountRefDay']),
            accounts_ref_month: parseInteger(row['Accounts.AccountRefMonth'] || row[' Accounts.AccountRefMonth']),
            accounts_next_due_date: parseDate(row['Accounts.NextDueDate'] || row[' Accounts.NextDueDate']),
            accounts_last_made_up_date: parseDate(row['Accounts.LastMadeUpDate'] || row[' Accounts.LastMadeUpDate']),
            accounts_category: row['Accounts.AccountCategory'] || row[' Accounts.AccountCategory'] || '',
            sic_code_1: row['SICCode.SicText_1'] || row[' SICCode.SicText_1'] || '',
            sic_code_2: row['SICCode.SicText_2'] || row[' SICCode.SicText_2'] || '',
            sic_code_3: row['SICCode.SicText_3'] || row[' SICCode.SicText_3'] || '',
            sic_code_4: row['SICCode.SicText_4'] || row[' SICCode.SicText_4'] || ''
          };

          batch.push(record);

          if (batch.length >= BATCH_SIZE) {
            const currentBatch = [...batch];
            batch = [];

            try {
              await insertBatch(client, currentBatch);

              if (totalInserted % 100000 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = Math.round(totalInserted / elapsed);
                const remaining = Math.round((5685825 - totalInserted) / rate);
                console.log(`   📊 Imported ${totalInserted.toLocaleString()} records (${rate}/sec, ~${Math.round(remaining / 60)}min remaining)`);
              }
            } catch (err) {
              console.error('❌ Batch insert error:', err.message);
              reject(err);
            }
          }
        })
        .on('end', async () => {
          // Insert remaining batch
          if (batch.length > 0) {
            try {
              await insertBatch(client, batch);
            } catch (err) {
              console.error('❌ Final batch error:', err.message);
              reject(err);
              return;
            }
          }
          resolve();
        })
        .on('error', reject);
    });

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Import complete!`);
    console.log(`   Total records: ${totalInserted.toLocaleString()}`);
    console.log(`   Time: ${Math.round(totalTime / 60)} minutes ${Math.round(totalTime % 60)} seconds`);
    console.log(`   Rate: ${Math.round(totalInserted / totalTime)}/sec\n`);

    // Rebuild indexes
    console.log('🔧 Rebuilding indexes (5-10 minutes)...');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_number ON companies(company_number)');
    console.log('   ✅ Index on company_number');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON companies(company_name)');
    console.log('   ✅ Index on company_name');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_status ON companies(company_status)');
    console.log('   ✅ Index on company_status');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_postcode ON companies(reg_address_postcode)');
    console.log('   ✅ Index on postcode');

    console.log('\n✅ All indexes rebuilt');

    // Final stats
    const statsResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE company_status = 'Active') as active,
        COUNT(*) FILTER (WHERE company_status = 'Dissolved') as dissolved
      FROM companies
    `);

    const stats = statsResult.rows[0];
    console.log('\n📊 Final Statistics:');
    console.log(`   Total companies: ${parseInt(stats.total).toLocaleString()}`);
    console.log(`   Active: ${parseInt(stats.active).toLocaleString()}`);
    console.log(`   Dissolved: ${parseInt(stats.dissolved).toLocaleString()}`);

    const finalTime = (Date.now() - startTime) / 1000;
    console.log(`\n⏱️  Total time: ${Math.round(finalTime / 60)} minutes\n`);
    console.log('🎉 Import successful! Database is ready.\n');

  } catch (err) {
    console.error('\n❌ Import failed:', err.message);
    console.error(err.stack);
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
