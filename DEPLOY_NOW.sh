#!/bin/bash
# FineGuard - Complete Azure Deployment Script
# Run this script to deploy everything to Azure

set -e

echo "🚀 FineGuard Azure Deployment Script"
echo "======================================"
echo ""

# Configuration
RESOURCE_GROUP="fineguard-rg"
LOCATION="uksouth"
REGISTRY_NAME="fineguardregistry"
BACKEND_APP="fineguard-backend"
FRONTEND_APP="fineguard-frontend"
ENV_NAME="fineguard-env"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not installed. Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI found"
echo ""

# Login to Azure
echo "🔐 Logging in to Azure..."
az login

echo ""
echo "📋 Current subscription:"
az account show --query "{Name:name, ID:id, TenantID:tenantId}" -o table
echo ""

read -p "Is this the correct subscription? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the correct subscription with: az account set --subscription <subscription-id>"
    exit 1
fi

echo ""
echo "🏗️  Step 1/7: Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION
echo "✅ Resource group created"

echo ""
echo "🏗️  Step 2/7: Creating Container Registry..."
az acr create \
  --name $REGISTRY_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --admin-enabled true
echo "✅ Container Registry created"

# Get registry credentials
REGISTRY_URL=$(az acr show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query loginServer -o tsv)
REGISTRY_USERNAME=$(az acr credential show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query username -o tsv)
REGISTRY_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query passwords[0].value -o tsv)

echo ""
echo "🏗️  Step 3/7: Building Docker image..."
docker build -t $BACKEND_APP:latest .
echo "✅ Docker image built"

echo ""
echo "🏗️  Step 4/7: Pushing to Container Registry..."
docker login $REGISTRY_URL -u $REGISTRY_USERNAME -p $REGISTRY_PASSWORD
docker tag $BACKEND_APP:latest $REGISTRY_URL/$BACKEND_APP:latest
docker push $REGISTRY_URL/$BACKEND_APP:latest
echo "✅ Image pushed to registry"

echo ""
echo "🏗️  Step 5/7: Creating Container Apps Environment..."
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
echo "✅ Container Apps environment created"

echo ""
echo "🏗️  Step 6/7: Deploying Backend..."
az containerapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $REGISTRY_URL/$BACKEND_APP:latest \
  --target-port 8080 \
  --ingress external \
  --registry-server $REGISTRY_URL \
  --registry-username $REGISTRY_USERNAME \
  --registry-password $REGISTRY_PASSWORD \
  --env-vars \
    "DATABASE_URL=postgresql://fineguardadmin:FineGuard2025!Prod@pgfineguardprod.postgres.database.azure.com:5432/fineguard?sslmode=require" \
    "COMPANIES_HOUSE_API_KEY=elab6044-ce70-401e-8be2-4bc18bd17c37" \
    "NODE_ENV=production"

BACKEND_URL=$(az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "✅ Backend deployed at: https://$BACKEND_URL"

echo ""
echo "🏗️  Step 7/7: Building and deploying Frontend..."
cd client
npm install
npm run build

# Create Static Web App
az staticwebapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query properties.apiKey -o tsv)

# Deploy to Static Web App
npx @azure/static-web-apps-cli deploy \
  --deployment-token $DEPLOYMENT_TOKEN \
  --app-location dist

FRONTEND_URL=$(az staticwebapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv)
echo "✅ Frontend deployed at: https://$FRONTEND_URL"

cd ..

echo ""
echo "======================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "📊 Your FineGuard URLs:"
echo "   Frontend: https://$FRONTEND_URL"
echo "   Backend:  https://$BACKEND_URL"
echo "   Health:   https://$BACKEND_URL/health"
echo ""
echo "🔍 Verify deployment:"
echo "   curl https://$BACKEND_URL/health"
echo ""
echo "📋 Resource Group: $RESOURCE_GROUP"
echo "📋 Location: $LOCATION"
echo ""
echo "💡 Next steps:"
echo "   1. Update frontend API URLs to point to: https://$BACKEND_URL"
echo "   2. Test all endpoints"
echo "   3. Continue data import: node scripts/import-resume.js"
echo ""
