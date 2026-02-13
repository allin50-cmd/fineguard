#!/usr/bin/env node
/**
 * Complete FineGuard System Test Suite
 * Tests all components before deployment
 */

require('dotenv').config(); // Load environment variables from .env file

const { Pool } = require('pg');
const http = require('http');
const https = require('https');

// Test configuration
const config = {
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8080',
    timeout: 5000
  },
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://fineguardadmin:FineGuard2025!Prod@pgfineguardprod.postgres.database.azure.com:5432/fineguard?sslmode=require',
    ssl: { rejectUnauthorized: false }
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function recordTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    log(`✅ PASS: ${name}`, 'success');
  } else {
    results.failed++;
    log(`❌ FAIL: ${name}${details ? ' - ' + details : ''}`, 'error');
  }
  results.tests.push({ name, passed, details });
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: config.backend.timeout, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: JSON.parse(data)
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
  });
}

// ===================================================================
// DATABASE TESTS
// ===================================================================

async function testDatabase() {
  log('\n📊 TESTING DATABASE...', 'info');

  const pool = new Pool(config.database);

  try {
    // Test 1: Connection
    try {
      await pool.query('SELECT 1');
      recordTest('Database connection', true);
    } catch (err) {
      recordTest('Database connection', false, err.message);
      return;
    }

    // Test 2: Tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(r => r.table_name);
    const requiredTables = ['companies', 'accountants', 'users', 'leads', 'alerts', 'subscriptions'];
    const missingTables = requiredTables.filter(t => !tables.includes(t));

    recordTest('All required tables exist', missingTables.length === 0,
      missingTables.length > 0 ? `Missing: ${missingTables.join(', ')}` : '');

    // Test 3: Companies table
    const companiesResult = await pool.query('SELECT COUNT(*) FROM companies');
    const companiesCount = parseInt(companiesResult.rows[0].count);
    recordTest('Companies table populated', companiesCount > 0,
      `Found ${companiesCount.toLocaleString()} companies`);

    // Test 4: Accountants table
    const accountantsResult = await pool.query('SELECT COUNT(*) FROM accountants');
    const accountantsCount = parseInt(accountantsResult.rows[0].count);
    recordTest('Accountants table populated', accountantsCount >= 390,
      `Found ${accountantsCount} accountants (expected 390+)`);

    // Test 5: Indexes exist
    const indexesResult = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('companies', 'accountants')
    `);
    recordTest('Database indexes created', indexesResult.rows.length > 0,
      `Found ${indexesResult.rows.length} indexes`);

    // Test 6: Query performance
    const start = Date.now();
    await pool.query("SELECT * FROM companies WHERE company_status = 'Active' LIMIT 10");
    const queryTime = Date.now() - start;
    recordTest('Query performance acceptable', queryTime < 500,
      `Query took ${queryTime}ms`);

  } catch (err) {
    recordTest('Database tests', false, err.message);
  } finally {
    await pool.end();
  }
}

// ===================================================================
// BACKEND API TESTS
// ===================================================================

async function testBackendAPI() {
  log('\n🔌 TESTING BACKEND API...', 'info');

  try {
    // Test 1: Health endpoint
    try {
      const health = await makeRequest(`${config.backend.url}/health`);
      recordTest('Health endpoint responds', health.statusCode === 200);
      recordTest('Health status is healthy', health.json?.status === 'healthy');
    } catch (err) {
      recordTest('Health endpoint responds', false, err.message);
      return; // Can't continue without backend
    }

    // Test 2: Companies API
    try {
      const companies = await makeRequest(`${config.backend.url}/api/companies?limit=10`);
      recordTest('Companies API responds', companies.statusCode === 200);
      recordTest('Companies API returns data',
        Array.isArray(companies.json?.companies) && companies.json.companies.length > 0);
    } catch (err) {
      recordTest('Companies API', false, err.message);
    }

    // Test 3: Accountants API
    try {
      const accountants = await makeRequest(`${config.backend.url}/api/accountants`);
      recordTest('Accountants API responds', accountants.statusCode === 200);
      recordTest('Accountants API returns 390+ records',
        accountants.json?.accountants?.length >= 390,
        `Found ${accountants.json?.accountants?.length} accountants`);
    } catch (err) {
      recordTest('Accountants API', false, err.message);
    }

    // Test 4: Borough stats API
    try {
      const boroughs = await makeRequest(`${config.backend.url}/api/accountants/borough-stats`);
      recordTest('Borough stats API responds', boroughs.statusCode === 200);
      recordTest('Borough stats returns 34 boroughs',
        boroughs.json?.stats?.length === 34,
        `Found ${boroughs.json?.stats?.length} boroughs`);
    } catch (err) {
      recordTest('Borough stats API', false, err.message);
    }

    // Test 5: Portal dashboard API
    try {
      const portal = await makeRequest(`${config.backend.url}/api/portal/dashboard`);
      recordTest('Portal dashboard API responds', portal.statusCode === 200);
    } catch (err) {
      recordTest('Portal dashboard API', false, err.message);
    }

    // Test 6: Enrichment API
    try {
      const enrichment = await makeRequest(`${config.backend.url}/api/enrichment/companies`);
      recordTest('Enrichment API responds', enrichment.statusCode === 200);
    } catch (err) {
      recordTest('Enrichment API', false, err.message);
    }

    // Test 7: Response time
    const start = Date.now();
    await makeRequest(`${config.backend.url}/health`);
    const responseTime = Date.now() - start;
    recordTest('API response time < 200ms', responseTime < 200,
      `Response time: ${responseTime}ms`);

  } catch (err) {
    recordTest('Backend API tests', false, err.message);
  }
}

// ===================================================================
// FRONTEND STRUCTURE TESTS
// ===================================================================

async function testFrontend() {
  log('\n🎨 TESTING FRONTEND STRUCTURE...', 'info');

  const fs = require('fs');
  const path = require('path');

  const clientPath = path.join(__dirname, 'client');

  // Test 1: Client directory exists
  recordTest('Client directory exists', fs.existsSync(clientPath));

  if (!fs.existsSync(clientPath)) return;

  // Test 2: package.json exists
  const packagePath = path.join(clientPath, 'package.json');
  recordTest('package.json exists', fs.existsSync(packagePath));

  // Test 3: Navigation components exist
  const navComponents = [
    'src/components/navigation/Breadcrumbs.jsx',
    'src/components/navigation/NavigationButtons.jsx',
    'src/components/navigation/QuickAccessMenu.jsx',
    'src/components/navigation/SiteMap.jsx'
  ];

  navComponents.forEach(component => {
    const componentPath = path.join(clientPath, component);
    recordTest(`Component exists: ${component}`, fs.existsSync(componentPath));
  });

  // Test 4: Layout components exist
  const layoutComponents = [
    'src/components/layout/AdminLayout.jsx',
    'src/components/layout/ClientLayout.jsx'
  ];

  layoutComponents.forEach(component => {
    const componentPath = path.join(clientPath, component);
    recordTest(`Component exists: ${component}`, fs.existsSync(componentPath));
  });
}

// ===================================================================
// DEPLOYMENT READINESS TESTS
// ===================================================================

async function testDeploymentReadiness() {
  log('\n🚀 TESTING DEPLOYMENT READINESS...', 'info');

  const fs = require('fs');
  const path = require('path');

  // Test 1: Dockerfile exists
  recordTest('Dockerfile exists', fs.existsSync(path.join(__dirname, 'Dockerfile')));

  // Test 2: Pipeline files exist
  recordTest('Standard pipeline exists',
    fs.existsSync(path.join(__dirname, '.azuredevops/azure-pipelines.yml')));
  recordTest('Advanced pipeline exists',
    fs.existsSync(path.join(__dirname, '.azuredevops/azure-pipelines-advanced.yml')));

  // Test 3: Import scripts exist
  recordTest('Bulk import script exists',
    fs.existsSync(path.join(__dirname, 'scripts/import-companies-bulk.js')));
  recordTest('Azure import script exists',
    fs.existsSync(path.join(__dirname, 'scripts/import-companies-azure.js')));

  // Test 4: Environment variables
  recordTest('DATABASE_URL is set', !!process.env.DATABASE_URL);
  recordTest('COMPANIES_HOUSE_API_KEY is set', !!process.env.COMPANIES_HOUSE_API_KEY);

  // Test 5: Dependencies installed
  recordTest('node_modules exists', fs.existsSync(path.join(__dirname, 'node_modules')));

  // Test 6: 5.8M companies CSV exists
  const csvPath = '/Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv';
  const csvExists = fs.existsSync(csvPath);
  recordTest('5.8M companies CSV file exists', csvExists);

  if (csvExists) {
    const stats = fs.statSync(csvPath);
    const sizeGB = (stats.size / 1024 / 1024 / 1024).toFixed(2);
    log(`   CSV file size: ${sizeGB} GB`, 'info');
  }
}

// ===================================================================
// MAIN TEST EXECUTION
// ===================================================================

async function runAllTests() {
  log('═'.repeat(70), 'info');
  log('🧪 FINEGUARD COMPLETE SYSTEM TEST SUITE', 'info');
  log('═'.repeat(70), 'info');

  const startTime = Date.now();

  // Run all test suites
  await testDatabase();
  await testBackendAPI();
  await testFrontend();
  await testDeploymentReadiness();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  log('\n' + '═'.repeat(70), 'info');
  log('📊 TEST SUMMARY', 'info');
  log('═'.repeat(70), 'info');
  log(`Total tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed}`, results.passed === results.total ? 'success' : 'info');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`Duration: ${duration}s`, 'info');
  log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
    results.passed === results.total ? 'success' : 'warning');

  // Show failed tests
  if (results.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => log(`   - ${t.name}${t.details ? ': ' + t.details : ''}`, 'error'));
  }

  // Deployment recommendation
  log('\n' + '═'.repeat(70), 'info');
  if (results.failed === 0) {
    log('✅ ALL TESTS PASSED - READY FOR DEPLOYMENT!', 'success');
    log('\nRecommended next steps:', 'info');
    log('1. Import 5.8M companies: node scripts/import-companies-azure.js', 'info');
    log('2. Build frontend: cd client && npm run build', 'info');
    log('3. Deploy to Azure: git push origin main (triggers pipeline)', 'info');
  } else if (results.failed < 5) {
    log('⚠️  SOME TESTS FAILED - REVIEW BEFORE DEPLOYMENT', 'warning');
    log('\nFix failed tests, then run: node test-full-system.js', 'info');
  } else {
    log('❌ MANY TESTS FAILED - NOT READY FOR DEPLOYMENT', 'error');
    log('\nReview system configuration and fix critical issues', 'error');
  }
  log('═'.repeat(70) + '\n', 'info');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  log(`\n💥 Test suite crashed: ${err.message}`, 'error');
  console.error(err.stack);
  process.exit(1);
});
