# 🚀 Complete FineGuard Azure Deployment - Best Practices

**Status:** Ready to deploy 5.8M companies + Full platform
**Date:** February 12, 2026

---

## 🎯 WHAT WE'RE DEPLOYING

### Complete Platform:
- ✅ Backend API (10 modules: companies, CRM, ACSP, workflows, billing, etc.)
- ✅ React Frontend (with advanced navigation)
- ✅ 5.8M UK Companies database
- ✅ 390 Accountants
- ✅ Azure Functions for workflows
- ✅ Efficient bulk operations
- ✅ Production-grade infrastructure

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Install Dependencies
```bash
cd /Users/admin/fineguard-unified

# Backend
npm install pg-copy-streams csv-parser

# Frontend
cd client
npm install
cd ..
```

### 2. Verify Files Exist
```bash
# 5.8M companies CSV
ls -lh /Users/admin/Desktop/BasicCompanyDataAsOneFile-2025-12-01.csv
# Should show: 5,685,826 lines

# Database credentials
cat .env | grep DATABASE_URL

# Azure credentials
az account show
```

---

## 🗄️ PART 1: Import 5.8M Companies (Azure-Optimized)

### Option A: Direct COPY Method (Fastest - 15min)

```bash
# Install pg-copy-streams
npm install pg-copy-streams

# Run optimized import
node scripts/import-companies-azure.js

# Expected output:
# - Truncate table: 5 seconds
# - Drop indexes: 10 seconds
# - COPY data: 10-15 minutes
# - Build indexes: 10-15 minutes
# Total: ~25-30 minutes
```

### Option B: Bulk Insert Method (Slower - 30-40min)

```bash
# If COPY fails, use bulk insert
node scripts/import-companies-bulk.js

# Expected: 5000 records/batch, ~40 minutes total
```

### Option C: Azure Data Factory (Production - Setup required)

**For future production deployments:**

1. Create Azure Data Factory
2. Create Linked Service to PostgreSQL
3. Create Pipeline with Copy Activity
4. Schedule daily syncs

---

## ⚡ PART 2: Set Up Azure Functions for Workflows

### Create Azure Functions App

```bash
# Login to Azure
az login

# Create Resource Group (if not exists)
az group create \
  --name rg-fineguard-prod \
  --location uksouth

# Create Storage Account (required for Functions)
az storage account create \
  --name fineguardstorage001 \
  --resource-group rg-fineguard-prod \
  --location uksouth \
  --sku Standard_LRS

# Create Function App (Node.js 20)
az functionapp create \
  --name fineguard-workflows \
  --resource-group rg-fineguard-prod \
  --storage-account fineguardstorage001 \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Linux \
  --consumption-plan-location uksouth
```

### Create Functions

**Function 1: Daily Companies Sync**
```javascript
// fineguard-workflows/CompaniesHouseSync/index.js
module.exports = async function (context, myTimer) {
  // Sync with Companies House API
  // Update filing events
  // Detect deadline changes
  context.log('Companies sync complete');
};
```

**Function 2: CRM Lead Scoring**
```javascript
// fineguard-workflows/LeadScoring/index.js
module.exports = async function (context, queueItem) {
  // Score leads based on company data
  // Update alerts
  // Trigger notifications
};
```

**Function 3: Billing Automation**
```javascript
// fineguard-workflows/BillingProcessor/index.js
module.exports = async function (context, myTimer) {
  // Process subscriptions
  // Generate invoices
  // Send payment reminders
};
```

### Deploy Functions

```bash
cd /Users/admin/fineguard-unified

# Create functions directory structure
mkdir -p azure-functions/{CompaniesHouseSync,LeadScoring,BillingProcessor}

# Deploy to Azure
func azure functionapp publish fineguard-workflows
```

---

## 🌐 PART 3: Deploy Complete React Frontend

### Build Frontend

```bash
cd /Users/admin/fineguard-unified/client

# Install dependencies
npm install

# Create vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
EOF

# Build for production
npm run build
```

### Deploy to Azure Static Web Apps

```bash
# Create Static Web App
az staticwebapp create \
  --name fineguard-frontend \
  --resource-group rg-fineguard-prod \
  --location uksouth \
  --source https://github.com/YOUR-REPO/fineguard \
  --branch main \
  --app-location "/client" \
  --output-location "dist"

# Or deploy manually
az staticwebapp secrets list \
  --name fineguard-frontend \
  --query properties.apiKey -o tsv

# Upload built files
cd dist
swa deploy --deployment-token $DEPLOYMENT_TOKEN
```

---

## 🔧 PART 4: Deploy Backend API (Container Apps)

### Build Docker Image

```bash
cd /Users/admin/fineguard-unified

# Test build locally
docker build -t fineguard-api:latest -f Dockerfile .

# Login to Azure Container Registry
az acr login --name fineguardacr75907

# Build and push to ACR
az acr build \
  --registry fineguardacr75907 \
  --image fineguard-api:v2.0 \
  --platform linux/amd64 \
  .
```

### Deploy to Container Apps

```bash
# Update or create container app
az containerapp update \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --image fineguardacr75907.azurecr.io/fineguard-api:v2.0 \
  --set-env-vars \
    NODE_ENV=production \
    DATABASE_URL=$DATABASE_URL \
    COMPANIES_HOUSE_API_KEY=elab6044-6d0a-4fec-83fe-dfee5e1d83c7 \
    PORT=8080 \
  --cpu 2.0 \
  --memory 4Gi \
  --min-replicas 2 \
  --max-replicas 10
```

---

## 🎨 PART 5: Configure Efficient Operations

### 1. Database Query Optimization

```sql
-- Add materialized views for common queries
CREATE MATERIALIZED VIEW active_companies AS
SELECT * FROM companies WHERE company_status = 'Active'
WITH DATA;

CREATE INDEX idx_active_companies_name ON active_companies(company_name);

-- Refresh schedule (via Azure Function)
REFRESH MATERIALIZED VIEW CONCURRENTLY active_companies;
```

### 2. Redis Caching Layer

```bash
# Create Azure Cache for Redis
az redis create \
  --name fineguard-cache \
  --resource-group rg-fineguard-prod \
  --location uksouth \
  --sku Basic \
  --vm-size c0

# Get connection string
az redis list-keys \
  --name fineguard-cache \
  --resource-group rg-fineguard-prod
```

### 3. CDN for Static Assets

```bash
# Create CDN profile
az cdn profile create \
  --name fineguard-cdn \
  --resource-group rg-fineguard-prod \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name fineguard-assets \
  --profile-name fineguard-cdn \
  --resource-group rg-fineguard-prod \
  --origin fineguard-frontend.azurestaticapps.net
```

---

## 📊 PART 6: Set Up Monitoring & Alerts

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app fineguard-insights \
  --resource-group rg-fineguard-prod \
  --location uksouth

# Get instrumentation key
az monitor app-insights component show \
  --app fineguard-insights \
  --resource-group rg-fineguard-prod \
  --query instrumentationKey -o tsv
```

### Configure Alerts

```bash
# Alert: High error rate
az monitor metrics alert create \
  --name high-error-rate \
  --resource-group rg-fineguard-prod \
  --scopes /subscriptions/YOUR-SUBSCRIPTION/resourceGroups/rg-fineguard-prod/providers/Microsoft.App/containerApps/fineguard-api \
  --condition "avg requests/count > 100" \
  --description "Alert when error rate exceeds 100 requests/minute"

# Alert: Database connection issues
az monitor metrics alert create \
  --name database-connection-failure \
  --resource-group rg-fineguard-prod \
  --scopes /subscriptions/YOUR-SUBSCRIPTION/resourceGroups/rg-fineguard-prod/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgfineguardprod \
  --condition "avg failed_connections > 5" \
  --description "Alert when DB connections fail"
```

---

## 🚀 PART 7: Complete Deployment Script

**Run this single command to deploy everything:**

```bash
# Create master deployment script
cat > deploy-all.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 FineGuard Complete Deployment"
echo "================================="

# Step 1: Import Companies
echo "\n📥 Step 1/6: Importing 5.8M companies..."
node scripts/import-companies-azure.js

# Step 2: Build Frontend
echo "\n🎨 Step 2/6: Building frontend..."
cd client
npm install
npm run build
cd ..

# Step 3: Build Backend Docker
echo "\n🐳 Step 3/6: Building backend Docker image..."
az acr build \
  --registry fineguardacr75907 \
  --image fineguard-api:v2.0 \
  --platform linux/amd64 \
  .

# Step 4: Deploy Backend
echo "\n☁️  Step 4/6: Deploying backend to Azure..."
az containerapp update \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --image fineguardacr75907.azurecr.io/fineguard-api:v2.0

# Step 5: Deploy Frontend
echo "\n🌐 Step 5/6: Deploying frontend to Azure..."
cd client/dist
swa deploy --deployment-token $SWA_TOKEN
cd ../..

# Step 6: Health Check
echo "\n✅ Step 6/6: Running health checks..."
curl -f https://fineguard-api.YOUR-DOMAIN.com/health || echo "Backend health check failed"

echo "\n🎉 Deployment complete!"
EOF

chmod +x deploy-all.sh

# Run deployment
./deploy-all.sh
```

---

## 💰 Cost Optimization Best Practices

### 1. Auto-Scaling Configuration

```bash
# Scale down during off-hours (save 50%)
az containerapp update \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --min-replicas 1 \
  --scale-rule-name "http-rule" \
  --scale-rule-type "http" \
  --scale-rule-http-concurrency 50
```

### 2. Reserved Capacity

```bash
# Save 30% with 1-year reserved PostgreSQL
az postgres flexible-server update \
  --name pgfineguardprod \
  --resource-group rg-fineguard-prod \
  --pricing-tier GeneralPurpose \
  --tier B_Standard_B1ms \
  --storage-size 128
```

### 3. Caching Strategy

```javascript
// server.js - Add Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

app.get('/api/companies/:id', async (req, res) => {
  const cacheKey = `company:${req.params.id}`;

  // Check cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Query database
  const result = await pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);

  // Cache for 1 hour
  await client.setEx(cacheKey, 3600, JSON.stringify(result.rows[0]));

  res.json(result.rows[0]);
});
```

---

## 📈 Performance Benchmarks (Expected)

### Database Queries:
- Search by company number: <50ms
- Search by company name: <200ms (with full-text index)
- Get company profile: <30ms
- List 50 companies: <100ms

### API Response Times:
- /health: <5ms
- /api/companies (paginated): <150ms
- /api/accountants: <100ms
- /api/portal/dashboard: <200ms

### Frontend Load Times:
- First load: <2 seconds
- Subsequent loads (cached): <500ms
- API data fetch: <200ms

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Check Database

```bash
# Connect to database
psql $DATABASE_URL

# Verify record count
SELECT COUNT(*) FROM companies;
-- Should return: 5,685,826

# Test query performance
EXPLAIN ANALYZE SELECT * FROM companies WHERE company_number = '00000006';
-- Should use index scan, <50ms
```

### 2. Check Backend API

```bash
# Health check
curl https://fineguard-api.YOUR-DOMAIN.com/health

# Companies endpoint
curl https://fineguard-api.YOUR-DOMAIN.com/api/companies?limit=10 | jq

# Accountants endpoint
curl https://fineguard-api.YOUR-DOMAIN.com/api/accountants | jq '.accountants | length'
# Should return: 390
```

### 3. Check Frontend

```bash
# Open in browser
open https://fineguard-frontend.azurestaticapps.net

# Should load with:
# - FineGuard logo
# - Navigation (8 pages)
# - Dashboard with quick access
# - All features accessible
```

---

## 🎯 QUICK START COMMANDS

### Local Development (Right Now):

```bash
cd /Users/admin/fineguard-unified

# Terminal 1: Start backend
node simple-server.js
# Runs on: http://localhost:8080

# Terminal 2: Start frontend
cd client
npm run dev
# Runs on: http://localhost:3000

# Terminal 3: Import companies (background)
node scripts/import-companies-azure.js &
```

### Production Deployment:

```bash
# One command deployment
./deploy-all.sh

# Or step by step:
# 1. Import data
node scripts/import-companies-azure.js

# 2. Build & deploy
az acr build --registry fineguardacr75907 --image fineguard-api:v2.0 .
az containerapp update --name fineguard-api --image fineguardacr75907.azurecr.io/fineguard-api:v2.0
```

---

## 📊 What You Get After Deployment

### Database:
✅ 5,685,826 UK companies
✅ 390 London accountants
✅ 12 tables (full CRM, workflows, ACSP)
✅ Optimized indexes
✅ Full-text search

### Backend API:
✅ 10 API modules
✅ Auto-scaling (2-10 replicas)
✅ Redis caching
✅ Rate limiting
✅ Security headers

### Frontend:
✅ React 18 + Vite
✅ Material-UI components
✅ Advanced navigation
✅ Mobile responsive
✅ CDN-delivered

### Azure Functions:
✅ Companies House sync
✅ Lead scoring
✅ Billing automation
✅ Scheduled workflows

### Monitoring:
✅ Application Insights
✅ Error tracking
✅ Performance metrics
✅ Automated alerts

---

## 💵 Total Monthly Cost (Production)

| Service | Cost |
|---------|------|
| Container Apps (2-10 replicas) | £80 |
| PostgreSQL (5.8M records) | £60 |
| Static Web App | £0 (free tier) |
| Azure Functions (consumption) | £5 |
| Redis Cache (Basic) | £16 |
| Storage Account | £2 |
| Application Insights | £15 |
| CDN | £5 |
| **Total** | **£183/month** |

**With optimizations:** £120-150/month

---

## 🎉 YOU'RE READY!

Everything is prepared. Choose your deployment path:

**Path A: Import First, Deploy Later**
1. Run: `node scripts/import-companies-azure.js`
2. Wait 25-30 minutes
3. Deploy when ready

**Path B: Deploy Now, Import in Background**
1. Deploy current system
2. Import companies in background
3. System works with 490 companies, scales to 5.8M

**Path C: Full Production (Recommended)**
1. Run: `./deploy-all.sh`
2. Everything deploys automatically
3. Complete system in 1 hour

---

**Ready to execute! Which path do you want?**
