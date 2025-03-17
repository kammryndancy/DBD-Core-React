#!/bin/bash
# deploy-api-gateway.sh - Linux deployment script for DBD Core API Gateway

# Default values
RESOURCE_GROUP_NAME=${1:-"dbd-api-rg"}
LOCATION=${2:-"eastus"}
API_MANAGEMENT_NAME=${3:-"dbd-apim"}
PUBLISHER_EMAIL=${4:-""}
PUBLISHER_NAME=${5:-""}
TENANT_ID=${6:-""}
SUBSCRIPTION_ID=${7:-""}
ENVIRONMENT=${8:-"development"}

# Check for required parameters
if [ -z "$PUBLISHER_EMAIL" ] || [ -z "$PUBLISHER_NAME" ] || [ -z "$TENANT_ID" ] || [ -z "$SUBSCRIPTION_ID" ]; then
  echo "Usage: $0 [resource-group-name] [location] [api-management-name] publisher-email publisher-name tenant-id subscription-id [environment]"
  echo "Parameters in [] are optional and have default values."
  exit 1
fi

# Login to Azure
echo "Logging into Azure..."
az login --tenant "$TENANT_ID"
az account set --subscription "$SUBSCRIPTION_ID"

# Create Resource Group
echo "Creating Resource Group..."
az group create \
  --name "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --tags \
    environment="$ENVIRONMENT" \
    project="demandbridge-dbd" \
    component="api-gateway"

# Get service URLs based on environment
if [ "$ENVIRONMENT" == "production" ]; then
  VALIDATION_SERVICE_URL="https://dbd-validation-service.azurewebsites.net"
  MIGRATION_SERVICE_URL="https://dbd-migration-service.azurewebsites.net"
elif [ "$ENVIRONMENT" == "staging" ]; then
  VALIDATION_SERVICE_URL="https://dbd-validation-service-staging.azurewebsites.net"
  MIGRATION_SERVICE_URL="https://dbd-migration-service-staging.azurewebsites.net"
else
  VALIDATION_SERVICE_URL="https://dbd-validation-service-dev.azurewebsites.net"
  MIGRATION_SERVICE_URL="https://dbd-migration-service-dev.azurewebsites.net"
fi

# Deploy API Management
echo "Deploying API Management..."
DEPLOYMENT_NAME="dbd-apim-$(date '+%Y%m%d-%H%M%S')"

az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --template-file "./api-gateway.bicep" \
  --parameters \
    apiManagementServiceName="$API_MANAGEMENT_NAME" \
    publisherEmail="$PUBLISHER_EMAIL" \
    publisherName="$PUBLISHER_NAME" \
    validationServiceUrl="$VALIDATION_SERVICE_URL" \
    migrationServiceUrl="$MIGRATION_SERVICE_URL" \
    location="$LOCATION"

# Configure Legacy Data Type Mappings
echo "Configuring Data Type Mappings..."
declare -A DATA_TYPE_MAPPINGS
DATA_TYPE_MAPPINGS["CHAR"]="VARCHAR"
DATA_TYPE_MAPPINGS["NUMBER(14,3)"]="DECIMAL(14,3)"
DATA_TYPE_MAPPINGS["DATE"]="TIMESTAMP WITH TIME ZONE"

for key in "${!DATA_TYPE_MAPPINGS[@]}"; do
  NAMED_VALUE="DataTypeMapping_${key//[^a-zA-Z0-9]/_}"
  az apim nv create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --service-name "$API_MANAGEMENT_NAME" \
    --named-value-id "$NAMED_VALUE" \
    --display-name "$NAMED_VALUE" \
    --value "${DATA_TYPE_MAPPINGS[$key]}" \
    --secret false
done

# Configure Module Tables (same as in PowerShell script)
echo "Configuring Module Tables..."
AP_MODULES=(
  "AP0_Div"
  "AP2_Term"
  "AP3_VendCatg"
  "AP4_Vend"
  "AP5_VendStatus"
  "AP8_VendMsg"
  "AP9_VendStats"
  "APA_InvoiceEntManChk"
)

for module in "${AP_MODULES[@]}"; do
  az apim nv create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --service-name "$API_MANAGEMENT_NAME" \
    --named-value-id "ModuleTable_$module" \
    --display-name "ModuleTable_$module" \
    --value "$module" \
    --secret false
done

echo "Deployment completed successfully."
