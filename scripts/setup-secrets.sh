#!/bin/bash

# Setup GitHub Secrets for CI/CD
# Usage: ./scripts/setup-secrets.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔐 Setting up GitHub Secrets for FineGuard${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}Installing GitHub CLI...${NC}"
    brew install gh
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Authenticating with GitHub...${NC}"
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"

# Get ACR credentials
ACR_NAME="fineguardregistry"
RESOURCE_GROUP="rg-fineguard-prod"

echo -e "${YELLOW}📦 Retrieving Azure Container Registry credentials...${NC}"
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Get Azure credentials for GitHub Actions
echo -e "${YELLOW}📦 Creating service principal for GitHub Actions...${NC}"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

AZURE_CREDENTIALS=$(az ad sp create-for-rbac \
  --name "github-actions-fineguard" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth)

# Get Static Web Apps deployment token
echo -e "${YELLOW}📦 Retrieving Static Web Apps deployment token...${NC}"
STATIC_WEB_APPS_TOKEN=$(az staticwebapp secrets list \
  --name wonderful-sea-02c6a4203 \
  --query properties.apiKey -o tsv 2>/dev/null || echo "")

if [ -z "$STATIC_WEB_APPS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Could not retrieve Static Web Apps token. Please add manually.${NC}"
fi

# Set GitHub secrets
echo -e "${YELLOW}🔐 Setting GitHub secrets...${NC}"

gh secret set ACR_USERNAME --body "$ACR_USERNAME"
echo "✅ ACR_USERNAME set"

gh secret set ACR_PASSWORD --body "$ACR_PASSWORD"
echo "✅ ACR_PASSWORD set"

gh secret set AZURE_CREDENTIALS --body "$AZURE_CREDENTIALS"
echo "✅ AZURE_CREDENTIALS set"

if [ ! -z "$STATIC_WEB_APPS_TOKEN" ]; then
    gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$STATIC_WEB_APPS_TOKEN"
    echo "✅ AZURE_STATIC_WEB_APPS_API_TOKEN set"
fi

# Set environment variables
echo -e "${YELLOW}🔐 Setting GitHub variables...${NC}"

gh variable set AZURE_CONTAINER_REGISTRY --body "fineguardregistry"
echo "✅ AZURE_CONTAINER_REGISTRY set"

gh variable set RESOURCE_GROUP --body "rg-fineguard-prod"
echo "✅ RESOURCE_GROUP set"

gh variable set CONTAINER_APP_NAME --body "fineguard-api"
echo "✅ CONTAINER_APP_NAME set"

echo ""
echo -e "${GREEN}🎉 GitHub Secrets configured successfully!${NC}"
echo ""
echo "Secrets set:"
echo "  - ACR_USERNAME"
echo "  - ACR_PASSWORD"
echo "  - AZURE_CREDENTIALS"
if [ ! -z "$STATIC_WEB_APPS_TOKEN" ]; then
    echo "  - AZURE_STATIC_WEB_APPS_API_TOKEN"
fi
echo ""
echo "Variables set:"
echo "  - AZURE_CONTAINER_REGISTRY"
echo "  - RESOURCE_GROUP"
echo "  - CONTAINER_APP_NAME"
echo ""
echo "You can now push to main branch to trigger deployments!"
