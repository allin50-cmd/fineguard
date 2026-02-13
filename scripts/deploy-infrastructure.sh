#!/bin/bash

# Deploy FineGuard Infrastructure using Bicep
# Usage: ./scripts/deploy-infrastructure.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

RESOURCE_GROUP="rg-fineguard-prod"
LOCATION="uksouth"
DEPLOYMENT_NAME="fineguard-infra-$(date +%Y%m%d-%H%M%S)"

echo -e "${GREEN}🚀 Deploying FineGuard Infrastructure${NC}"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not found${NC}"
    exit 1
fi

# Login check
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please login to Azure${NC}"
    az login
fi

echo -e "${GREEN}✅ Azure CLI authenticated${NC}"

# Create resource group if not exists
echo -e "${YELLOW}📦 Ensuring resource group exists...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Validate Bicep template
echo -e "${YELLOW}✓ Validating Bicep template...${NC}"
az deployment group validate \
  --resource-group $RESOURCE_GROUP \
  --template-file azure/infrastructure.bicep \
  --parameters azure/parameters.json

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Bicep validation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bicep template validated${NC}"

# Deploy infrastructure
echo -e "${YELLOW}🚀 Deploying infrastructure (this may take 10-15 minutes)...${NC}"
az deployment group create \
  --name $DEPLOYMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --template-file azure/infrastructure.bicep \
  --parameters azure/parameters.json \
  --verbose

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"

# Get deployment outputs
echo -e "${YELLOW}📊 Retrieving deployment outputs...${NC}"

BACKEND_URL=$(az deployment group show \
  --name $DEPLOYMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.outputs.backendAppUrl.value -o tsv)

POSTGRES_FQDN=$(az deployment group show \
  --name $DEPLOYMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.outputs.postgresServerFqdn.value -o tsv)

REDIS_HOST=$(az deployment group show \
  --name $DEPLOYMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.outputs.redisHostName.value -o tsv)

APP_INSIGHTS_KEY=$(az deployment group show \
  --name $DEPLOYMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.outputs.appInsightsInstrumentationKey.value -o tsv)

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "=== Infrastructure Endpoints ==="
echo "Backend API: $BACKEND_URL"
echo "PostgreSQL: $POSTGRES_FQDN"
echo "Redis Cache: $REDIS_HOST"
echo "App Insights Key: $APP_INSIGHTS_KEY"
echo ""
echo "Next steps:"
echo "1. Update GitHub secrets with new credentials"
echo "2. Deploy application code using GitHub Actions"
echo "3. Configure custom domain in Azure Portal"
echo "4. Set up monitoring alerts"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
