#!/bin/bash

# FineGuard Azure Deployment Script
# Usage: ./scripts/deploy-azure.sh --environment production --region uksouth

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
REGION="uksouth"
RESOURCE_GROUP="rg-fineguard-prod"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 FineGuard Azure Deployment${NC}"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not found. Please install: brew install azure-cli${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Azure. Running 'az login'...${NC}"
    az login
fi

echo -e "${GREEN}✅ Azure CLI authenticated${NC}"
echo ""

# Set subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Using subscription: $SUBSCRIPTION_ID"

# Check if resource group exists
echo -e "${YELLOW}📦 Checking resource group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✅ Resource group $RESOURCE_GROUP exists${NC}"
else
    echo -e "${YELLOW}Creating resource group $RESOURCE_GROUP in $REGION...${NC}"
    az group create --name $RESOURCE_GROUP --location $REGION
    echo -e "${GREEN}✅ Resource group created${NC}"
fi

# Create Azure Container Registry if not exists
ACR_NAME="fineguardregistry"
echo -e "${YELLOW}📦 Checking Azure Container Registry...${NC}"
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✅ ACR $ACR_NAME exists${NC}"
else
    echo -e "${YELLOW}Creating Azure Container Registry...${NC}"
    az acr create \
      --name $ACR_NAME \
      --resource-group $RESOURCE_GROUP \
      --location $REGION \
      --sku Basic \
      --admin-enabled true
    echo -e "${GREEN}✅ ACR created${NC}"
fi

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

echo -e "${GREEN}✅ ACR credentials retrieved${NC}"

# Build and push backend image
echo -e "${YELLOW}🐳 Building backend Docker image...${NC}"
docker build -t ${ACR_LOGIN_SERVER}/backend:latest .

echo -e "${YELLOW}🐳 Logging into ACR...${NC}"
echo $ACR_PASSWORD | docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME --password-stdin

echo -e "${YELLOW}🐳 Pushing backend image to ACR...${NC}"
docker push ${ACR_LOGIN_SERVER}/backend:latest

echo -e "${GREEN}✅ Backend image pushed to ACR${NC}"

# Create Container Apps Environment if not exists
ENVIRONMENT_NAME="fineguard-env-${ENVIRONMENT}"
echo -e "${YELLOW}📦 Checking Container Apps Environment...${NC}"
if az containerapp env show --name $ENVIRONMENT_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✅ Container Apps Environment exists${NC}"
else
    echo -e "${YELLOW}Creating Container Apps Environment...${NC}"
    az containerapp env create \
      --name $ENVIRONMENT_NAME \
      --resource-group $RESOURCE_GROUP \
      --location $REGION
    echo -e "${GREEN}✅ Container Apps Environment created${NC}"
fi

# Deploy backend to Container Apps
CONTAINER_APP_NAME="fineguard-api"
echo -e "${YELLOW}🚀 Deploying backend to Container Apps...${NC}"

# Get database connection string
DB_CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name pgfineguardprod \
  --database-name fineguard \
  --admin-user fineguard_admin \
  --query connectionStrings.nodejs -o tsv 2>/dev/null || echo "")

if [ -z "$DB_CONNECTION_STRING" ]; then
    echo -e "${YELLOW}⚠️  Could not retrieve DB connection string. Using environment variable.${NC}"
    DB_CONNECTION_STRING="${DATABASE_URL}"
fi

# Check if container app exists
if az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Updating existing container app...${NC}"
    az containerapp update \
      --name $CONTAINER_APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --image ${ACR_LOGIN_SERVER}/backend:latest \
      --set-env-vars \
        NODE_ENV=production \
        PORT=8080
else
    echo -e "${YELLOW}Creating new container app...${NC}"
    az containerapp create \
      --name $CONTAINER_APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --environment $ENVIRONMENT_NAME \
      --image ${ACR_LOGIN_SERVER}/backend:latest \
      --target-port 8080 \
      --ingress external \
      --min-replicas 1 \
      --max-replicas 10 \
      --cpu 1.0 \
      --memory 2Gi \
      --registry-server $ACR_LOGIN_SERVER \
      --registry-username $ACR_USERNAME \
      --registry-password $ACR_PASSWORD \
      --env-vars \
        NODE_ENV=production \
        PORT=8080
fi

echo -e "${GREEN}✅ Backend deployed to Container Apps${NC}"

# Get the application URL
APP_URL=$(az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn -o tsv)

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Backend API URL: https://${APP_URL}"
echo "Health Check: https://${APP_URL}/health"
echo ""
echo "Next steps:"
echo "1. Update frontend VITE_API_URL to: https://${APP_URL}"
echo "2. Configure database connection string in Azure Portal"
echo "3. Set up GitHub Actions secrets for CI/CD"
echo "4. Configure custom domain and SSL"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
