param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "dbd-frontend-rg",

    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",

    [Parameter(Mandatory=$true)]
    [string]$AppName = "dbd-frontend",

    [Parameter(Mandatory=$true)]
    [string]$TenantId,

    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId
)

# Login to Azure
Write-Host "Logging into Azure..."
az login --tenant $TenantId
az account set --subscription $SubscriptionId

# Create Resource Group
Write-Host "Creating Resource Group..."
az group create `
    --name $ResourceGroupName `
    --location $Location

# Create Static Web App
Write-Host "Creating Static Web App..."
az staticwebapp create `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku Standard `
    --app-location "/frontend" `
    --output-location "dist" `
    --branch main

# Create App Configuration
Write-Host "Creating App Configuration..."
$appConfigName = "$AppName-config"
az appconfig create `
    --name $appConfigName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku Standard

# Create Application Insights
Write-Host "Creating Application Insights..."
$appInsightsName = "$AppName-insights"
az monitor app-insights component create `
    --app $appInsightsName `
    --location $Location `
    --resource-group $ResourceGroupName `
    --application-type web

# Get App Insights Connection String
$appInsightsKey = az monitor app-insights component show `
    --app $appInsightsName `
    --resource-group $ResourceGroupName `
    --query "connectionString" `
    --output tsv

# Create CDN Profile and Endpoint
Write-Host "Creating CDN Profile and Endpoint..."
az cdn profile create `
    --name "$AppName-cdn" `
    --resource-group $ResourceGroupName `
    --sku Standard_Microsoft

$staticWebAppHostname = az staticwebapp show `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --query "defaultHostname" `
    --output tsv

az cdn endpoint create `
    --name $AppName `
    --profile-name "$AppName-cdn" `
    --resource-group $ResourceGroupName `
    --origin $staticWebAppHostname `
    --origin-host-header $staticWebAppHostname

# Configure App Settings
Write-Host "Configuring App Settings..."
az staticwebapp appsettings set `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --setting-names `
        APPLICATIONINSIGHTS_CONNECTION_STRING=$appInsightsKey `
        PVX_IMPORT_ENABLED=true `
        CHAR_TO_VARCHAR_ENABLED=true `
        NUMBER_TO_DECIMAL_ENABLED=true `
        DATE_TO_TIMESTAMP_ENABLED=true `
        ROW_LEVEL_SECURITY_ENABLED=true `
        FULL_TEXT_SEARCH_ENABLED=true `
        AUDIT_TRIGGERS_ENABLED=true

# Configure CORS
Write-Host "Configuring CORS..."
az staticwebapp cors show `
    --name $AppName `
    --resource-group $ResourceGroupName

# Output Important Information
Write-Host "`nDeployment Complete!`n"
Write-Host "Static Web App URL: https://$staticWebAppHostname"
Write-Host "CDN Endpoint: https://$AppName.$Location.azureedge.net"
Write-Host "Application Insights Resource: $appInsightsName"
Write-Host "App Configuration Store: $appConfigName"

Write-Host "`nNext Steps:"
Write-Host "1. Configure your custom domain in the Azure Portal"
Write-Host "2. Set up Azure AD authentication"
Write-Host "3. Configure your GitHub repository for CI/CD"
Write-Host "4. Update your .env.production file with the correct values"
