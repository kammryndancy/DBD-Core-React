@description('The name of the frontend application')
param appName string = 'dbd-frontend'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The SKU for the static web app')
param staticWebAppSku string = 'Standard'

@description('The SKU for the CDN profile')
param cdnSku string = 'Standard_Microsoft'

@description('The SKU for Application Insights')
param appInsightsSku string = 'PerGB2018'

@description('Tags for all resources')
param tags object = {
  environment: 'production'
  project: 'demandbridge-dbd'
  component: 'frontend'
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: appName
  location: location
  tags: tags
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties: {
    provider: 'Azure'
    enableDefaultTelemetry: true
    buildProperties: {
      appLocation: '/frontend'
      outputLocation: 'dist'
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  tags: tags
  kind: 'web'
  sku: {
    name: appInsightsSku
  }
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaWebAppGallery'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// CDN Profile
resource cdnProfile 'Microsoft.Cdn/profiles@2021-06-01' = {
  name: '${appName}-cdn'
  location: location
  tags: tags
  sku: {
    name: cdnSku
  }
}

// CDN Endpoint
resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2021-06-01' = {
  parent: cdnProfile
  name: appName
  location: location
  tags: tags
  properties: {
    originHostHeader: staticWebApp.properties.defaultHostname
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: [
      'text/plain'
      'text/html'
      'text/css'
      'text/javascript'
      'application/x-javascript'
      'application/javascript'
      'application/json'
      'application/xml'
    ]
    isCompressionEnabled: true
    origins: [
      {
        name: 'frontend-origin'
        properties: {
          hostName: staticWebApp.properties.defaultHostname
          httpPort: 80
          httpsPort: 443
          originHostHeader: staticWebApp.properties.defaultHostname
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
  }
}

// Key Vault for secrets
resource keyVault 'Microsoft.KeyVault/vaults@2021-11-01-preview' = {
  name: '${appName}-kv'
  location: location
  tags: tags
  properties: {
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: '${appName}-logs'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 1
    }
  }
}

// Diagnostic Settings
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${appName}-diag'
  scope: staticWebApp
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'StaticSiteAuditLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Output values
output staticWebAppHostname string = staticWebApp.properties.defaultHostname
output cdnEndpointHostname string = cdnEndpoint.properties.hostName
output appInsightsKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString
