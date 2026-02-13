#!/usr/bin/env node
/**
 * Resume Import - Continues from existing records using ON CONFLICT
 */

const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

const CSV_FILE = '/Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv';
const BATCH_SIZE = 1000;

let totalProcessed = 0;
let totalInserted = 0;
let batch = [];
const startTime = Date.now();

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

function parseInteger(val) {
  if (!val || val.trim() === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

async function insertBatch(client, records) {
  if (records.length === 0) return;

  const values = [];
  const params = [];
  let paramIndex = 1;

  for (const record of records) {
    const placeholders = [];
    for (let i = 0; i < 24; i++) {
      placeholders.push(`$${paramIndex++}`);
    }
    values.push(`(${placeholders.join(',')})`);

    params.push(
      record.company_name, record.company_number, record.reg_address_care_of,
      record.reg_address_po_box, record.reg_address_line1, record.reg_address_line2,
      record.reg_address_post_town, record.reg_address_county, record.reg_address_country,
      record.reg_address_postcode, record.company_category, record.company_status,
      record.country_of_origin, record.dissolution_date, record.incorporation_date,
      record.accounts_ref_day, record.accounts_ref_month, record.accounts_next_due_date,
      record.accounts_last_made_up_date, record.accounts_category, record.sic_code_1,
      record.sic_code_2, record.sic_code_3, record.sic_code_4
    );
  }

  const query = `
    INSERT INTO companies (
      company_name, company_number, reg_address_care_of, reg_address_po_box,
      reg_address_line1, reg_address_line2, reg_address_post_town, reg_address_county,
      reg_address_country, reg_address_postcode, company_category, company_status,
      country_of_origin, dissolution_date, incorporation_date, accounts_ref_day,
      accounts_ref_month, accounts_next_due_date, accounts_last_made_up_date,
      accounts_category, sic_code_1, sic_code_2, sic_code_3, sic_code_4
    ) VALUES ${values.join(',')}
    ON CONFLICT (company_number) DO NOTHING
  `;

  const result = await client.query(query, params);
  totalInserted += (result.rowCount || 0);
}

async function resumeImport() {
  console.log('🔄 Resuming import from existing data...\n');

  const client = await pool.connect();

  try {
    const countCheck = await client.query('SELECT COUNT(*) FROM companies');
    const existing = parseInt(countCheck.rows[0].count);
    console.log(`📊 Current database: ${existing.toLocaleString()} companies`);
    console.log(`📁 Source: ${CSV_FILE}`);
    console.log(`⚡ Will skip duplicates using ON CONFLICT\n`);

    console.log('📥 Processing CSV...\n');

    const stream = fs.createReadStream(CSV_FILE).pipe(csv({
      mapHeaders: ({ header }) => header.trim()
    }));

    stream.pause();

    for await (const row of stream) {
      const record = {
        company_name: row.CompanyName || null,
        company_number: row.CompanyNumber,
        reg_address_care_of: row['RegAddress.CareOf'] || null,
        reg_address_po_box: row['RegAddress.POBox'] || null,
        reg_address_line1: row['RegAddress.AddressLine1'] || null,
        reg_address_line2: row['RegAddress.AddressLine2'] || null,
        reg_address_post_town: row['RegAddress.PostTown'] || null,
        reg_address_county: row['RegAddress.County'] || null,
        reg_address_country: row['RegAddress.Country'] || null,
        reg_address_postcode: row['RegAddress.PostCode'] || null,
        company_category: row.CompanyCategory || null,
        company_status: row.CompanyStatus || null,
        country_of_origin: row.CountryOfOrigin || null,
        dissolution_date: parseDate(row.DissolutionDate),
        incorporation_date: parseDate(row.IncorporationDate),
        accounts_ref_day: parseInteger(row['Accounts.AccountRefDay']),
        accounts_ref_month: parseInteger(row['Accounts.AccountRefMonth']),
        accounts_next_due_date: parseDate(row['Accounts.NextDueDate']),
        accounts_last_made_up_date: parseDate(row['Accounts.LastMadeUpDate']),
        accounts_category: row['Accounts.AccountCategory'] || null,
        sic_code_1: row['SICCode.SicText_1'] || null,
        sic_code_2: row['SICCode.SicText_2'] || null,
        sic_code_3: row['SICCode.SicText_3'] || null,
        sic_code_4: row['SICCode.SicText_4'] || null
      };

      batch.push(record);
      totalProcessed++;

      if (batch.length >= BATCH_SIZE) {
        stream.pause();
        await insertBatch(client, batch);
        batch = [];
        stream.resume();

        if (totalProcessed % 100000 === 0) {
          const current = existing + totalInserted;
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = Math.round(totalProcessed / elapsed);
          const remaining = Math.round((5685826 - current) / rate / 60);
          console.log(`   📊 Total: ${current.toLocaleString()} | New: ${totalInserted.toLocaleString()} (${rate}/sec, ~${remaining}min left)`);
        }
      }
    }

    if (batch.length > 0) {
      await insertBatch(client, batch);
    }

    const final = await client.query('SELECT COUNT(*) FROM companies');
    const totalCount = parseInt(final.rows[0].count);

    console.log(`\n✅ Resume complete!`);
    console.log(`   Total in database: ${totalCount.toLocaleString()}`);
    console.log(`   New records added: ${totalInserted.toLocaleString()}`);
    console.log(`   Duplicates skipped: ${(totalProcessed - totalInserted).toLocaleString()}\n`);

    if (totalCount >= 5600000) {
      console.log('🔧 Rebuilding indexes...');
      await client.query('CREATE INDEX IF NOT EXISTS idx_companies_number ON companies(company_number)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(company_status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_companies_postcode ON companies(reg_address_postcode)');
      console.log('✅ Indexes complete\n');
    }

    console.log('🎉 Import successful!\n');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

resumeImport().catch(err => {
  console.error('💥 Fatal:', err.message);
  process.exit(1);
});
