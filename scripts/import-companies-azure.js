const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');

// Azure PostgreSQL optimized connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fineguardadmin:FineGuard2025!Prod@pgfineguardprod.postgres.database.azure.com:5432/fineguard?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 5, // Lower pool for stability
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
});

const CSV_FILE = '/Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv';

async function importCompaniesOptimized() {
  console.log('🚀 Starting OPTIMIZED Azure import of 5.8M companies...\n');

  const client = await pool.connect();

  try {
    console.log('📋 Step 1: Preparing database...');

    // Truncate table
    await client.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
    console.log('✅ Table truncated');

    // Drop indexes for faster import
    await client.query('DROP INDEX IF EXISTS idx_companies_number CASCADE');
    await client.query('DROP INDEX IF EXISTS idx_companies_name CASCADE');
    await client.query('DROP INDEX IF EXISTS idx_companies_status CASCADE');
    await client.query('DROP INDEX IF EXISTS idx_companies_postcode CASCADE');
    console.log('✅ Indexes dropped');

    console.log('\n📥 Step 2: Creating temporary CSV file for Azure...');

    // Create cleaned CSV for PostgreSQL COPY
    const tempFile = '/tmp/companies_clean.csv';
    const writeStream = fs.createWriteStream(tempFile);
    const readStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({ input: readStream });

    let lineCount = 0;
    let headerProcessed = false;

    for await (const line of rl) {
      if (!headerProcessed) {
        // Skip header
        headerProcessed = true;
        continue;
      }

      lineCount++;
      if (lineCount % 100000 === 0) {
        console.log(`   Processed ${lineCount.toLocaleString()} lines...`);
      }

      // Write cleaned line
      writeStream.write(line + '\n');
    }

    writeStream.end();
    await new Promise(resolve => writeStream.on('finish', resolve));

    console.log(`✅ Processed ${lineCount.toLocaleString()} records into temp file`);

    console.log('\n💾 Step 3: Using PostgreSQL COPY (fastest method)...');
    console.log('⏱️  This will take 10-20 minutes. Please wait...\n');

    const startTime = Date.now();

    // Use COPY FROM STDIN for maximum speed
    const copyQuery = `
      COPY companies (
        company_name, company_number, reg_address_care_of, reg_address_po_box,
        reg_address_line1, reg_address_line2, reg_address_post_town, reg_address_county,
        reg_address_country, reg_address_postcode, company_category, company_status,
        country_of_origin, dissolution_date, incorporation_date, accounts_ref_day,
        accounts_ref_month, accounts_next_due_date, accounts_last_made_up_date,
        accounts_category, sic_code_1, sic_code_2, sic_code_3, sic_code_4
      )
      FROM STDIN WITH (FORMAT csv, DELIMITER ',', NULL '', HEADER false)
    `;

    const fileStream = fs.createReadStream(tempFile);
    const copyStream = client.query(require('pg-copy-streams').from(copyQuery));

    fileStream.pipe(copyStream);

    await new Promise((resolve, reject) => {
      copyStream.on('finish', resolve);
      copyStream.on('error', reject);
      fileStream.on('error', reject);
    });

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`✅ COPY complete in ${Math.round(elapsed / 60)} minutes`);

    // Clean up temp file
    fs.unlinkSync(tempFile);

    console.log('\n🔧 Step 4: Building indexes (this may take 10-15 minutes)...');

    await client.query('CREATE INDEX idx_companies_number ON companies(company_number)');
    console.log('✅ Index on company_number created');

    await client.query('CREATE INDEX idx_companies_name ON companies USING gin(to_tsvector(\'english\', company_name))');
    console.log('✅ Full-text index on company_name created');

    await client.query('CREATE INDEX idx_companies_status ON companies(company_status)');
    console.log('✅ Index on company_status created');

    await client.query('CREATE INDEX idx_companies_postcode ON companies(reg_address_postcode)');
    console.log('✅ Index on postcode created');

    // Analyze table for query optimization
    await client.query('ANALYZE companies');
    console.log('✅ Table analyzed');

    // Final count
    const countResult = await client.query('SELECT COUNT(*) FROM companies');
    const totalRecords = parseInt(countResult.rows[0].count);

    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n' + '='.repeat(60));
    console.log('🎉 IMPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Total records imported: ${totalRecords.toLocaleString()}`);
    console.log(`⏱️  Total time: ${Math.round(totalTime / 60)} minutes`);
    console.log(`⚡ Average rate: ${Math.round(totalRecords / totalTime).toLocaleString()} records/second`);
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Check if pg-copy-streams is installed
try {
  require('pg-copy-streams');
  importCompaniesOptimized()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Import failed:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('❌ Missing dependency: pg-copy-streams');
  console.error('   Run: npm install pg-copy-streams');
  process.exit(1);
}
