# 🚀 FineGuard - Quick Deploy Commands

## Choose Your Deployment Method

### Method 1: Fastest Deploy (Use Existing Infrastructure)
```bash
cd /Users/admin/fineguard-unified
./scripts/deploy-azure.sh --environment production --region uksouth
```
⏱️ **Time**: 10 minutes  
💰 **Cost**: ~£70/month  
✅ **Best for**: Quick start, development, MVP

---

### Method 2: Full Production Infrastructure
```bash
cd /Users/admin/fineguard-unified

# Step 1: Deploy all infrastructure (PostgreSQL, Redis, etc.)
./scripts/deploy-infrastructure.sh

# Step 2: Configure GitHub Actions secrets
./scripts/setup-secrets.sh

# Step 3: Deploy application
git add .
git commit -m "Deploy to production"
git push origin main
```
⏱️ **Time**: 20 minutes  
💰 **Cost**: ~£435/month  
✅ **Best for**: Production, high availability, scalability

---

### Method 3: CI/CD Only (Existing Infrastructure)
```bash
cd /Users/admin/fineguard-unified

# Setup GitHub secrets
./scripts/setup-secrets.sh

# Push to deploy
git push origin main
```
⏱️ **Time**: 5 minutes  
💰 **Cost**: Uses existing resources  
✅ **Best for**: Updates, continuous deployment

---

## Verify Deployment

```bash
# Get your backend URL
APP_URL=$(az containerapp show \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --query properties.configuration.ingress.fqdn -o tsv)

# Test health endpoint
curl https://$APP_URL/health

# Test portal dashboard
curl https://$APP_URL/api/portal/dashboard | jq

# Test companies API
curl https://$APP_URL/api/companies?limit=5 | jq
```

---

## View Logs

```bash
# Real-time logs
az containerapp logs show \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --follow

# View in Azure Portal
echo "https://portal.azure.com/#resource/subscriptions/b4425219-519a-45ab-a233-77272def645f/resourceGroups/rg-fineguard-prod/providers/Microsoft.App/containerApps/fineguard-api"
```

---

## Update Frontend API URL

After backend deployment, update frontend:
```bash
cd client

# Update .env.production
echo "VITE_API_URL=https://$APP_URL" > .env.production

# Deploy frontend
git add .env.production
git commit -m "Update API URL"
git push origin main
```

---

## Rollback (if needed)

```bash
# List revisions
az containerapp revision list \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  -o table

# Rollback to previous revision
az containerapp revision activate \
  --resource-group rg-fineguard-prod \
  --name fineguard-api \
  --revision <revision-name>
```

---

## Cost Management

```bash
# Scale down to save costs
az containerapp update \
  --name fineguard-api \
  --resource-group rg-fineguard-prod \
  --min-replicas 1 \
  --max-replicas 3

# View current costs
az consumption usage list \
  --start-date $(date -v-30d +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  -o table
```

---

## Monitoring

```bash
# View metrics
az monitor metrics list \
  --resource /subscriptions/b4425219-519a-45ab-a233-77272def645f/resourceGroups/rg-fineguard-prod/providers/Microsoft.App/containerApps/fineguard-api \
  --metric "Requests" \
  -o table

# Create alert
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group rg-fineguard-prod \
  --scopes /subscriptions/b4425219-519a-45ab-a233-77272def645f/resourceGroups/rg-fineguard-prod/providers/Microsoft.App/containerApps/fineguard-api \
  --condition "avg Percentage CPU > 80" \
  --description "Alert when CPU > 80%"
```

---

**Ready? Pick a method and run the commands! 🚀**
