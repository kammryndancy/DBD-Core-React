# Deploy-ApiGateway.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "dbd-api-rg",

    [Parameter(Mandatory=$true)]
    [string]$Location = "eastus",

    [Parameter(Mandatory=$true)]
    [string]$ApiManagementName = "dbd-apim",

    [Parameter(Mandatory=$true)]
    [string]$PublisherEmail,

    [Parameter(Mandatory=$true)]
    [string]$PublisherName,

    [Parameter(Mandatory=$true)]
    [string]$TenantId,

    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory=$false)]
    [string]$Environment = "development"
)

# Login to Azure
Write-Host "Logging into Azure..."
az login --tenant $TenantId
az account set --subscription $SubscriptionId

# Create Resource Group
Write-Host "Creating Resource Group..."
az group create `
    --name $ResourceGroupName `
    --location $Location `
    --tags `
        environment=$Environment `
        project="demandbridge-dbd" `
        component="api-gateway"

# Get service URLs based on environment
$validationServiceUrl = switch ($Environment) {
    "production" { "https://dbd-validation-service.azurewebsites.net" }
    "staging" { "https://dbd-validation-service-staging.azurewebsites.net" }
    default { "https://dbd-validation-service-dev.azurewebsites.net" }
}

$migrationServiceUrl = switch ($Environment) {
    "production" { "https://dbd-migration-service.azurewebsites.net" }
    "staging" { "https://dbd-migration-service-staging.azurewebsites.net" }
    default { "https://dbd-migration-service-dev.azurewebsites.net" }
}

# Deploy API Management
Write-Host "Deploying API Management..."
$deploymentName = "dbd-apim-$((Get-Date).ToString('yyyyMMdd-HHmmss'))"

az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroupName `
    --template-file "./api-gateway.bicep" `
    --parameters `
        apiManagementServiceName=$ApiManagementName `
        publisherEmail=$PublisherEmail `
        publisherName=$PublisherName `
        validationServiceUrl=$validationServiceUrl `
        migrationServiceUrl=$migrationServiceUrl `
        location=$Location

# Configure Legacy Data Type Mappings
Write-Host "Configuring Data Type Mappings..."
$dataTypeMappings = @{
    "CHAR" = "VARCHAR"
    "NUMBER(14,3)" = "DECIMAL(14,3)"
    "DATE" = "TIMESTAMP WITH TIME ZONE"
}

foreach ($mapping in $dataTypeMappings.GetEnumerator()) {
    $namedValue = "DataTypeMapping_$($mapping.Key -replace '[^a-zA-Z0-9]', '_')"
    az apim nv create `
        --resource-group $ResourceGroupName `
        --service-name $ApiManagementName `
        --named-value-id $namedValue `
        --display-name $namedValue `
        --value $mapping.Value `
        --secret false
}

# Configure Module Tables
Write-Host "Configuring Module Tables..."
$apModules = @(
    "AP0_Div",
    "AP2_Term",
    "AP3_VendCatg",
    "AP4_Vend",
    "AP5_VendStatus",
    "AP8_VendMsg",
    "AP9_VendStats",
    "APA_InvoiceEntManChk"
)

$arModules = @(
    "AR1_Cust",
    "AR2_Terms",
    "AR5_SlsTax",
    "AR6_OpenInvoice",
    "ARA_SlspersonStats",
    "ARB_InvoiceEntHdr"
)

# Store module configurations
az apim nv create `
    --resource-group $ResourceGroupName `
    --service-name $ApiManagementName `
    --named-value-id "APModules" `
    --display-name "APModules" `
    --value ($apModules -join ",") `
    --secret false

az apim nv create `
    --resource-group $ResourceGroupName `
    --service-name $ApiManagementName `
    --named-value-id "ARModules" `
    --display-name "ARModules" `
    --value ($arModules -join ",") `
    --secret false

# Configure PVX Integration Settings
Write-Host "Configuring PVX Integration..."
az apim nv create `
    --resource-group $ResourceGroupName `
    --service-name $ApiManagementName `
    --named-value-id "PVXFileExtensions" `
    --display-name "PVXFileExtensions" `
    --value ".pxprg" `
    --secret false

az apim nv create `
    --resource-group $ResourceGroupName `
    --service-name $ApiManagementName `
    --named-value-id "LegacyComponents" `
    --display-name "LegacyComponents" `
    --value "tf2g,tf2w,tf2z" `
    --secret false

# Configure Modern Features
Write-Host "Configuring Modern Features..."
$modernFeatures = @{
    "RowLevelSecurity" = "true"
    "FullTextSearch" = "true"
    "AuditTriggers" = "true"
    "UUIDPrimaryKeys" = "true"
    "ForeignKeyConstraints" = "true"
}

foreach ($feature in $modernFeatures.GetEnumerator()) {
    az apim nv create `
        --resource-group $ResourceGroupName `
        --service-name $ApiManagementName `
        --named-value-id "Feature_$($feature.Key)" `
        --display-name "Feature_$($feature.Key)" `
        --value $feature.Value `
        --secret false
}

# Get deployment outputs
Write-Host "Getting Deployment Outputs..."
$outputs = az deployment group show `
    --name $deploymentName `
    --resource-group $ResourceGroupName `
    --query "properties.outputs" `
    --output json | ConvertFrom-Json

Write-Host "`nDeployment Complete!`n"
Write-Host "API Management URL: $($outputs.apimUrl.value)"
Write-Host "Application Insights Key: $($outputs.appInsightsKey.value)"

Write-Host "`nNext Steps:"
Write-Host "1. Configure custom domains in Azure Portal"
Write-Host "2. Set up Azure AD authentication"
Write-Host "3. Import API specifications"
Write-Host "4. Test the API endpoints"
Write-Host "5. Monitor the migration process through Application Insights"
