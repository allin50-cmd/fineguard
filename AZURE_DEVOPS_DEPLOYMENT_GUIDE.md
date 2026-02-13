# 🚀 FineGuard Azure DevOps Deployment Strategy

## Current Infrastructure Analysis

### ✅ Already Deployed
- **Backend API**: Azure Container Apps (West Europe)
  - URL: `https://fineguard-api.whitepebble-687b5e28.westeurope.azurecontainerapps.io`
- **Frontend**: Azure Static Web Apps
  - URL: `https://wonderful-sea-02c6a4203.1.azurestaticapps.net`
- **Database**: PostgreSQL Flexible Server (UK South)
  - Server: `pgfineguardprod` (Standard_B1ms)
  - Status: ✅ Ready
- **Resource Groups**:
  - Primary: `rg-fineguard-prod` (UK South)
  - Secondary: `fineguard-rg` (West Europe)

---

## 🎯 Recommended Production Architecture

### Option 1: Azure Container Apps (Recommended) ⭐
**Best for**: Scalable microservices, auto-scaling, zero-config HTTPS

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Front Door                      │
│              (CDN + WAF + Global Load Balancer)         │
└─────────────────────────────────────────────────────────┘
                          │
        ├─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend    │  │   Backend    │  │   Workers    │
│  Static Web   │  │  Container   │  │  Container   │
│     Apps      │  │     Apps     │  │     Apps     │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
        ├─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL   │  │  Azure Blob  │  │  Redis Cache │
│   Flexible    │  │   Storage    │  │   Premium    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Cost**: ~£150-300/month
**Scalability**: Auto-scales 0-30 instances
**Best For**: Production workloads with traffic spikes

---

### Option 2: Azure App Service (Cost-Effective)
**Best for**: Predictable traffic, lower costs, simpler management

```
┌─────────────────────────────────────────────────────────┐
│                 Azure Application Gateway                │
│                    (WAF + SSL Offload)                   │
└─────────────────────────────────────────────────────────┘
                          │
        ├─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend    │  │   Backend    │  │  Background  │
│  App Service  │  │  App Service │  │     Jobs     │
│   (Static)    │  │   (Node.js)  │  │  (WebJobs)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Cost**: ~£50-120/month
**Scalability**: Manual scaling (1-10 instances)
**Best For**: MVP, controlled costs, B2B SaaS

---

### Option 3: Azure Kubernetes Service (Enterprise)
**Best for**: Multi-tenant, complex microservices, full control

**Cost**: ~£300-800/month
**Scalability**: Unlimited
**Best For**: Enterprise, multi-region, complex workflows

---

## 💡 Recommended Solution for FineGuard

### **Go with Option 1: Azure Container Apps** ✅

**Why?**
1. ✅ Already using Container Apps for backend
2. ✅ Auto-scaling perfect for compliance deadlines (traffic spikes on filing dates)
3. ✅ Built-in HTTPS, secrets management, monitoring
4. ✅ Supports background jobs (BullMQ workers)
5. ✅ Pay-per-use pricing (scales to zero)
6. ✅ Fast deployment (GitHub Actions CI/CD)

---

## 📋 Complete Deployment Plan

### Phase 1: Infrastructure Setup (1-2 days)

#### 1.1 Resource Group Organization
```bash
# Primary Production (UK South - closer to Companies House API)
rg-fineguard-prod
  ├── Container App Environment
  ├── PostgreSQL Flexible Server ✅ (already exists)
  ├── Redis Cache Premium
  ├── Storage Account (documents)
  ├── Application Insights
  └── Key Vault

# Supporting Services (West Europe - redundancy)
rg-fineguard-dr
  ├── PostgreSQL Read Replica
  └── Blob Storage (geo-redundant)
```

#### 1.2 Database Configuration
```bash
# Current: Standard_B1ms (1 vCore, 2GB RAM, 32GB storage)
# Recommended: Standard_D2ds_v4 (2 vCores, 8GB RAM, 128GB storage)

# Upgrade command:
az postgres flexible-server update \
  --resource-group rg-fineguard-prod \
  --name pgfineguardprod \
  --sku-name Standard_D2ds_v4 \
  --tier GeneralPurpose \
  --storage-size 128

# Enable high availability (99.99% SLA)
az postgres flexible-server update \
  --resource-group rg-fineguard-prod \
  --name pgfineguardprod \
  --high-availability Enabled \
  --standby-availability-zone 2
```

#### 1.3 Caching Layer
```bash
# Create Redis Cache for session storage + API caching
az redis create \
  --resource-group rg-fineguard-prod \
  --name fineguard-cache-prod \
  --location uksouth \
  --sku Premium \
  --vm-size P1 \
  --enable-non-ssl-port false
```

#### 1.4 Blob Storage for Documents
```bash
# Create storage account
az storage account create \
  --name fineguardstorageprod \
  --resource-group rg-fineguard-prod \
  --location uksouth \
  --sku Standard_ZRS \
  --kind StorageV2 \
  --https-only true

# Create containers
az storage container create \
  --name compliance-documents \
  --account-name fineguardstorageprod

az storage container create \
  --name client-uploads \
  --account-name fineguardstorageprod
```

---

### Phase 2: Application Deployment (2-3 days)

#### 2.1 Container Apps Environment
```bash
# Create Container Apps Environment (manages networking, logs)
az containerapp env create \
  --name fineguard-env-prod \
  --resource-group rg-fineguard-prod \
  --location uksouth \
  --logs-destination azure-monitor \
  --internal-only false
```

#### 2.2 Backend API Container
```bash
# Deploy backend to Container Apps
az containerapp create \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --environment fineguard-env-prod \
  --image fineguardregistry.azurecr.io/backend:latest \
  --target-port 8080 \
  --ingress external \
  --min-replicas 2 \
  --max-replicas 10 \
  --cpu 1.0 \
  --memory 2Gi \
  --env-vars \
    DATABASE_URL=secretref:db-connection-string \
    REDIS_URL=secretref:redis-connection-string \
    PERPLEXITY_API_KEY=secretref:perplexity-key \
    COMPANIES_HOUSE_API_KEY=secretref:companies-house-key \
    NODE_ENV=production
```

#### 2.3 Background Workers Container
```bash
# Deploy BullMQ workers for email enrichment, deadline checking
az containerapp create \
  --name fineguard-workers \
  --resource-group rg-fineguard-prod \
  --environment fineguard-env-prod \
  --image fineguardregistry.azurecr.io/workers:latest \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    DATABASE_URL=secretref:db-connection-string \
    REDIS_URL=secretref:redis-connection-string
```

#### 2.4 Frontend Static Web App
```bash
# Already deployed, just update build config
# Update staticwebapp.config.json with API routes

az staticwebapp update \
  --name wonderful-sea-02c6a4203 \
  --resource-group rg-fineguard-prod \
  --api-location none
```

---

### Phase 3: CI/CD Pipeline (GitHub Actions)

#### 3.1 Backend Pipeline
```yaml
# .github/workflows/backend-deploy.yml
name: Deploy Backend API

on:
  push:
    branches: [main]
    paths:
      - 'server.js'
      - 'routes/**'
      - 'services/**'
      - 'package.json'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker Image
        run: |
          docker build -t fineguardregistry.azurecr.io/backend:${{ github.sha }} .
          docker tag fineguardregistry.azurecr.io/backend:${{ github.sha }} \
                     fineguardregistry.azurecr.io/backend:latest

      - name: Push to Azure Container Registry
        run: |
          echo ${{ secrets.ACR_PASSWORD }} | docker login fineguardregistry.azurecr.io \
            -u fineguardregistry --password-stdin
          docker push fineguardregistry.azurecr.io/backend:${{ github.sha }}
          docker push fineguardregistry.azurecr.io/backend:latest

      - name: Deploy to Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          containerAppName: fineguard-api
          resourceGroup: rg-fineguard-prod
          imageToDeploy: fineguardregistry.azurecr.io/backend:${{ github.sha }}

      - name: Run Database Migrations
        run: |
          az containerapp exec \
            --name fineguard-api \
            --resource-group rg-fineguard-prod \
            --command "npm run migrate"

      - name: Health Check
        run: |
          HEALTH_URL=$(az containerapp show \
            --name fineguard-api \
            --resource-group rg-fineguard-prod \
            --query properties.configuration.ingress.fqdn -o tsv)
          curl -f https://$HEALTH_URL/health || exit 1
```

#### 3.2 Frontend Pipeline
```yaml
# .github/workflows/frontend-deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'client/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Dependencies
        working-directory: ./client
        run: npm ci

      - name: Build
        working-directory: ./client
        env:
          VITE_API_URL: https://fineguard-api.{{ CONTAINER_APP_FQDN }}
        run: npm run build

      - name: Deploy to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "./client"
          output_location: "dist"
```

---

### Phase 4: Monitoring & Observability

#### 4.1 Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app fineguard-insights \
  --location uksouth \
  --resource-group rg-fineguard-prod \
  --application-type web

# Link to Container Apps
az containerapp update \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --set properties.configuration.dapr.appId=fineguard-api
```

#### 4.2 Alerts Configuration
```bash
# Alert: High error rate
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group rg-fineguard-prod \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-fineguard-prod/providers/Microsoft.App/containerApps/fineguard-api \
  --condition "avg Percentage CPU > 80" \
  --description "API error rate above 5%" \
  --evaluation-frequency 1m \
  --window-size 5m \
  --action email admin@fineguard.com

# Alert: Database connections exhausted
az monitor metrics alert create \
  --name "Database Connection Pool Full" \
  --resource-group rg-fineguard-prod \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-fineguard-prod/providers/Microsoft.DBforPostgreSQL/flexibleServers/pgfineguardprod \
  --condition "avg active_connections > 90" \
  --action email admin@fineguard.com
```

---

### Phase 5: Security Hardening

#### 5.1 Azure Key Vault
```bash
# Create Key Vault
az keyvault create \
  --name fineguard-vault-prod \
  --resource-group rg-fineguard-prod \
  --location uksouth \
  --enable-rbac-authorization true

# Store secrets
az keyvault secret set \
  --vault-name fineguard-vault-prod \
  --name db-connection-string \
  --value "postgresql://..."

az keyvault secret set \
  --vault-name fineguard-vault-prod \
  --name perplexity-api-key \
  --value "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"
```

#### 5.2 Managed Identity
```bash
# Enable managed identity for Container App
az containerapp identity assign \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --system-assigned

# Grant Key Vault access
az keyvault set-policy \
  --name fineguard-vault-prod \
  --object-id {managed-identity-principal-id} \
  --secret-permissions get list
```

#### 5.3 Network Security
```bash
# Create Virtual Network
az network vnet create \
  --name fineguard-vnet \
  --resource-group rg-fineguard-prod \
  --address-prefix 10.0.0.0/16 \
  --subnet-name container-apps-subnet \
  --subnet-prefix 10.0.1.0/24

# Restrict PostgreSQL to VNet only
az postgres flexible-server update \
  --resource-group rg-fineguard-prod \
  --name pgfineguardprod \
  --public-network-access Disabled

# Create private endpoint
az network private-endpoint create \
  --name pg-private-endpoint \
  --resource-group rg-fineguard-prod \
  --vnet-name fineguard-vnet \
  --subnet container-apps-subnet \
  --private-connection-resource-id {postgres-resource-id} \
  --group-id postgresqlServer \
  --connection-name pg-connection
```

---

## 📊 Cost Breakdown (Production)

### Monthly Costs (UK South Region)

| Service | SKU | Monthly Cost |
|---------|-----|--------------|
| **Container Apps Environment** | - | £0 (consumption-based) |
| **Backend API** (2-10 replicas) | 1 vCPU, 2GB | £30-150 |
| **Workers** (1-5 replicas) | 0.5 vCPU, 1GB | £15-75 |
| **PostgreSQL Flexible Server** | Standard_D2ds_v4 + HA | £120 |
| **Redis Cache** | Premium P1 (6GB) | £100 |
| **Blob Storage** | 100GB ZRS | £5 |
| **Application Insights** | 10GB data/month | £20 |
| **Key Vault** | Standard | £3 |
| **Bandwidth** | 500GB/month | £40 |
| **Total** | | **£333-513/month** |

### Cost Optimization Tips
1. **Auto-scale to zero** during off-peak hours (Container Apps)
2. **Reserved instances** for PostgreSQL (save 30-40%)
3. **Blob Storage lifecycle policies** (move old documents to Cool/Archive tier)
4. **Application Insights sampling** (90% sampling = 90% cost reduction)

---

## 🚀 Quick Start Deployment

### Prerequisites
```bash
# Install Azure CLI
brew install azure-cli

# Login
az login

# Set subscription
az account set --subscription "Azure subscription 1"

# Install GitHub CLI (for secrets)
brew install gh
gh auth login
```

### 1-Command Deployment
```bash
# Run the complete deployment script
cd /Users/admin/fineguard-unified
chmod +x scripts/deploy-azure.sh
./scripts/deploy-azure.sh --environment production --region uksouth
```

---

## 📈 Performance Targets

### SLA Targets
- **Uptime**: 99.95% (Container Apps SLA)
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Page Load Time**: < 2s (p95)

### Scalability Targets
- **Concurrent Users**: 10,000+
- **API Requests**: 1M+ requests/day
- **Database Connections**: 100 concurrent
- **Storage**: 1TB+ documents

---

## 🔄 Disaster Recovery

### Backup Strategy
```bash
# Automated PostgreSQL backups (7 days retention)
az postgres flexible-server backup create \
  --resource-group rg-fineguard-prod \
  --name pgfineguardprod \
  --backup-name manual-backup-$(date +%Y%m%d)

# Geo-redundant Blob Storage
az storage account update \
  --name fineguardstorageprod \
  --resource-group rg-fineguard-prod \
  --sku Standard_GZRS
```

### Recovery Time Objectives
- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 15 minutes

---

## ✅ Pre-Deployment Checklist

- [ ] Database migrated to UK South region (closer to Companies House)
- [ ] All API keys stored in Azure Key Vault
- [ ] Container images built and pushed to ACR
- [ ] GitHub Actions secrets configured
- [ ] DNS records updated (fineguard.com → Azure Front Door)
- [ ] SSL certificates configured (Let's Encrypt or Azure Managed)
- [ ] Application Insights dashboards created
- [ ] Alert rules configured (email/SMS)
- [ ] Backup schedule verified
- [ ] Load testing completed (Artillery or k6)
- [ ] Security scan passed (Azure Defender)

---

## 🎯 Next Steps

1. **Review this plan** and approve architecture
2. **Run infrastructure setup** (Phase 1)
3. **Deploy applications** (Phase 2)
4. **Configure CI/CD** (Phase 3)
5. **Set up monitoring** (Phase 4)
6. **Security hardening** (Phase 5)
7. **Performance testing** and optimization
8. **Go live** 🚀

---

## 📞 Support Resources

- **Azure Support**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- **Container Apps Docs**: https://learn.microsoft.com/en-us/azure/container-apps/
- **PostgreSQL Flexible Server**: https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/
- **Static Web Apps**: https://learn.microsoft.com/en-us/azure/static-web-apps/

---

**Ready to deploy? Let's go! 🚀**
