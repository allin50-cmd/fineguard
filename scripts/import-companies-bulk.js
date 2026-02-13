const fs = require('fs');
const { Pool } = require('pg');
const csv = require('csv-parser');
const { Transform } = require('stream');

// Database connection with optimized settings for bulk import
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fineguardadmin:FineGuard2025!Prod@pgfineguardprod.postgres.database.azure.com:5432/fineguard?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 20, // Increase connection pool for parallel inserts
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const CSV_FILE = '/Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv';
const BATCH_SIZE = 2000; // Insert 2000 rows at a time (max ~48k params, under PostgreSQL limit)
const PROGRESS_INTERVAL = 50000; // Show progress every 50k records

let totalProcessed = 0;
let totalInserted = 0;
let batch = [];
let startTime = Date.now();

// Prepare the database table
async function prepareDatabase() {
  console.log('📋 Preparing database...');

  const client = await pool.connect();
  try {
    // Create optimized table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(500),
        company_number VARCHAR(8) UNIQUE NOT NULL,
        reg_address_care_of VARCHAR(255),
        reg_address_po_box VARCHAR(50),
        reg_address_line1 VARCHAR(255),
        reg_address_line2 VARCHAR(255),
        reg_address_post_town VARCHAR(100),
        reg_address_county VARCHAR(100),
        reg_address_country VARCHAR(100),
        reg_address_postcode VARCHAR(20),
        company_category VARCHAR(100),
        company_status VARCHAR(50),
        country_of_origin VARCHAR(100),
        dissolution_date DATE,
        incorporation_date DATE,
        accounts_ref_day INTEGER,
        accounts_ref_month INTEGER,
        accounts_next_due_date DATE,
        accounts_last_made_up_date DATE,
        accounts_category VARCHAR(100),
        sic_code_1 VARCHAR(255),
        sic_code_2 VARCHAR(255),
        sic_code_3 VARCHAR(255),
        sic_code_4 VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Drop indexes temporarily for faster inserts
    console.log('🔧 Dropping indexes for faster import...');
    await client.query('DROP INDEX IF EXISTS idx_companies_number');
    await client.query('DROP INDEX IF EXISTS idx_companies_name');
    await client.query('DROP INDEX IF EXISTS idx_companies_status');
    await client.query('DROP INDEX IF EXISTS idx_companies_postcode');

    // Clear existing data
    const countResult = await client.query('SELECT COUNT(*) FROM companies');
    const existingCount = parseInt(countResult.rows[0].count);

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing records. Truncating table...`);
      await client.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
      console.log('✅ Table truncated');
    }

    console.log('✅ Database prepared');
  } finally {
    client.release();
  }
}

// Build indexes after import
async function buildIndexes() {
  console.log('\n🔧 Building indexes (this may take 5-10 minutes)...');
  const client = await pool.connect();
  try {
    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_number ON companies(company_number)');
    console.log('✅ Index on company_number created');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON companies(company_name)');
    console.log('✅ Index on company_name created');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_status ON companies(company_status)');
    console.log('✅ Index on company_status created');

    await client.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_postcode ON companies(reg_address_postcode)');
    console.log('✅ Index on postcode created');

    console.log('✅ All indexes built');
  } finally {
    client.release();
  }
}

// Parse date safely
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // Format: DD/MM/YYYY
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

// Parse integer safely
function parseInt(val) {
  if (!val || val.trim() === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

// Insert batch to database
async function insertBatch(records) {
  if (records.length === 0) return;

  const client = await pool.connect();
  try {
    // Build VALUES string for bulk insert
    const values = [];
    const params = [];
    let paramIndex = 1;

    records.forEach(record => {
      const rowValues = [];

      // Add all 24 fields (excluding id, created_at, updated_at)
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

      const placeholders = [];
      for (let i = 0; i < 24; i++) {
        placeholders.push(`$${paramIndex++}`);
      }
      values.push(`(${placeholders.join(', ')})`);
    });

    const query = `
      INSERT INTO companies (
        company_name, company_number, reg_address_care_of, reg_address_po_box,
        reg_address_line1, reg_address_line2, reg_address_post_town, reg_address_county,
        reg_address_country, reg_address_postcode, company_category, company_status,
        country_of_origin, dissolution_date, incorporation_date, accounts_ref_day,
        accounts_ref_month, accounts_next_due_date, accounts_last_made_up_date,
        accounts_category, sic_code_1, sic_code_2, sic_code_3, sic_code_4
      )
      VALUES ${values.join(', ')}
      ON CONFLICT (company_number) DO NOTHING
    `;

    await client.query(query, params);
    totalInserted += records.length;
  } catch (err) {
    console.error(`\n❌ Error inserting batch: ${err.message}`);
    console.error('First record in batch:', records[0]);
  } finally {
    client.release();
  }
}

// Show progress
function showProgress() {
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = Math.round(totalProcessed / elapsed);
  const estimated = totalProcessed > 0 ? Math.round((5685826 - totalProcessed) / rate) : 0;

  console.log(`📊 Processed: ${totalProcessed.toLocaleString()} | Inserted: ${totalInserted.toLocaleString()} | Rate: ${rate.toLocaleString()}/sec | ETA: ${Math.round(estimated / 60)}min`);
}

// Main import function
async function importCompanies() {
  console.log('🚀 Starting import of 5.8M companies...\n');
  console.log(`📁 Reading from: ${CSV_FILE}`);
  console.log(`📦 Batch size: ${BATCH_SIZE.toLocaleString()}`);
  console.log(`⚡ Progress updates every: ${PROGRESS_INTERVAL.toLocaleString()} records\n`);

  await prepareDatabase();

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', async (row) => {
        totalProcessed++;

        // Parse the CSV row
        const record = {
          company_name: row.CompanyName || row[' CompanyName'],
          company_number: row.CompanyNumber || row[' CompanyNumber'],
          reg_address_care_of: row['RegAddress.CareOf'],
          reg_address_po_box: row['RegAddress.POBox'],
          reg_address_line1: row['RegAddress.AddressLine1'],
          reg_address_line2: row['RegAddress.AddressLine2'],
          reg_address_post_town: row['RegAddress.PostTown'],
          reg_address_county: row['RegAddress.County'],
          reg_address_country: row['RegAddress.Country'],
          reg_address_postcode: row['RegAddress.PostCode'],
          company_category: row.CompanyCategory,
          company_status: row.CompanyStatus,
          country_of_origin: row.CountryOfOrigin,
          dissolution_date: parseDate(row.DissolutionDate),
          incorporation_date: parseDate(row.IncorporationDate),
          accounts_ref_day: parseInt(row['Accounts.AccountRefDay']),
          accounts_ref_month: parseInt(row['Accounts.AccountRefMonth']),
          accounts_next_due_date: parseDate(row['Accounts.NextDueDate']),
          accounts_last_made_up_date: parseDate(row['Accounts.LastMadeUpDate']),
          accounts_category: row['Accounts.AccountCategory'],
          sic_code_1: row['SICCode.SicText_1'],
          sic_code_2: row['SICCode.SicText_2'],
          sic_code_3: row['SICCode.SicText_3'],
          sic_code_4: row['SICCode.SicText_4']
        };

        batch.push(record);

        // Insert when batch is full
        if (batch.length >= BATCH_SIZE) {
          const batchToInsert = [...batch];
          batch = [];
          await insertBatch(batchToInsert);
        }

        // Show progress
        if (totalProcessed % PROGRESS_INTERVAL === 0) {
          showProgress();
        }
      })
      .on('end', async () => {
        // Insert remaining records
        if (batch.length > 0) {
          await insertBatch(batch);
        }

        showProgress();
        console.log('\n✅ CSV reading complete');

        // Build indexes
        await buildIndexes();

        // Final stats
        const elapsed = (Date.now() - startTime) / 1000;
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT COMPLETE');
        console.log('='.repeat(60));
        console.log(`✅ Total processed: ${totalProcessed.toLocaleString()}`);
        console.log(`✅ Total inserted: ${totalInserted.toLocaleString()}`);
        console.log(`⏱️  Total time: ${Math.round(elapsed / 60)} minutes ${Math.round(elapsed % 60)} seconds`);
        console.log(`⚡ Average rate: ${Math.round(totalProcessed / elapsed).toLocaleString()} records/second`);
        console.log('='.repeat(60) + '\n');

        await pool.end();
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Error reading CSV:', err);
        reject(err);
      });
  });
}

// Run the import
importCompanies()
  .then(() => {
    console.log('🎉 Import successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Import failed:', err);
    process.exit(1);
  });
