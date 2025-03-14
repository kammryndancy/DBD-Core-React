@description('The name of the API Management service')
param apiManagementServiceName string = 'dbd-apim'

@description('The email address of the owner of the API Management service')
param publisherEmail string

@description('The name of the owner of the API Management service')
param publisherName string

@description('The pricing tier of the API Management service')
@allowed([
  'Developer'
  'Standard'
  'Premium'
])
param sku string = 'Developer'

@description('The instance size of the API Management service')
@allowed([
  1
  2
])
param skuCount int = 1

@description('Location for all resources')
param location string = resourceGroup().location

@description('The base URL for the validation service')
param validationServiceUrl string

@description('The base URL for the migration service')
param migrationServiceUrl string

resource apiManagementService 'Microsoft.ApiManagement/service@2021-08-01' = {
  name: apiManagementServiceName
  location: location
  sku: {
    name: sku
    capacity: skuCount
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
  }
}

// API Version Set for Data Migration Services
resource migrationApiVersionSet 'Microsoft.ApiManagement/service/apiVersionSets@2021-08-01' = {
  parent: apiManagementService
  name: 'migration-api-version-set'
  properties: {
    displayName: 'Data Migration APIs'
    versioningScheme: 'Segment'
  }
}

// Validation Service API
resource validationApi 'Microsoft.ApiManagement/service/apis@2021-08-01' = {
  parent: apiManagementService
  name: 'validation-service'
  properties: {
    displayName: 'Validation Service API'
    apiRevision: '1'
    subscriptionRequired: true
    protocols: [
      'https'
    ]
    path: 'validation'
    format: 'openapi+json'
    value: loadTextContent('../services/validation-service/openapi.json')
    serviceUrl: validationServiceUrl
  }
}

// Migration Service API
resource migrationApi 'Microsoft.ApiManagement/service/apis@2021-08-01' = {
  parent: apiManagementService
  name: 'migration-service'
  properties: {
    displayName: 'Migration Service API'
    apiRevision: '1'
    subscriptionRequired: true
    protocols: [
      'https'
    ]
    path: 'migration'
    format: 'openapi+json'
    value: loadTextContent('../services/migration-service/openapi.json')
    serviceUrl: migrationServiceUrl
  }
}

// Products
resource standardProduct 'Microsoft.ApiManagement/service/products@2021-08-01' = {
  parent: apiManagementService
  name: 'standard'
  properties: {
    displayName: 'Standard'
    description: 'Standard tier with full access to migration APIs'
    subscriptionRequired: true
    approvalRequired: false
    state: 'published'
  }
}

// Add APIs to Product
resource standardProductApi1 'Microsoft.ApiManagement/service/products/apis@2021-08-01' = {
  parent: standardProduct
  name: validationApi.name
}

resource standardProductApi2 'Microsoft.ApiManagement/service/products/apis@2021-08-01' = {
  parent: standardProduct
  name: migrationApi.name
}

// Policies
resource apiPolicy 'Microsoft.ApiManagement/service/apis/policies@2021-08-01' = {
  parent: validationApi
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <cors>
            <allowed-origins>
              <origin>https://dbd-frontend.azurewebsites.net</origin>
              <origin>http://localhost:3000</origin>
            </allowed-origins>
            <allowed-methods>
              <method>GET</method>
              <method>POST</method>
              <method>PUT</method>
              <method>DELETE</method>
              <method>PATCH</method>
            </allowed-methods>
            <allowed-headers>
              <header>Content-Type</header>
              <header>Authorization</header>
            </allowed-headers>
          </cors>
          <base />
          <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized">
            <openid-config url="https://login.microsoftonline.com/common/.well-known/openid-configuration" />
            <required-claims>
              <claim name="aud" match="any">
                <value>api://dbd-api</value>
              </claim>
            </required-claims>
          </validate-jwt>
          <rate-limit calls="100" renewal-period="60" />
          <quota calls="1000" renewal-period="604800" />
        </inbound>
        <backend>
          <base />
        </backend>
        <outbound>
          <base />
        </outbound>
        <on-error>
          <base />
        </on-error>
      </policies>
    '''
  }
}

// Diagnostic Settings
resource diagnosticSettings 'Microsoft.ApiManagement/service/diagnostics@2021-08-01' = {
  parent: apiManagementService
  name: 'applicationinsights'
  properties: {
    loggerId: appInsightsLogger.id
    sampling: {
      samplingType: 'fixed'
      percentage: 100
    }
    metrics: true
    httpCorrelationProtocol: 'W3C'
    logClientIp: true
    verbosity: 'verbose'
    alwaysLog: 'allErrors'
  }
}

// Application Insights Logger
resource appInsightsLogger 'Microsoft.ApiManagement/service/loggers@2021-08-01' = {
  parent: apiManagementService
  name: 'appinsights'
  properties: {
    loggerType: 'applicationInsights'
    credentials: {
      instrumentationKey: reference(appInsights.id, '2020-02-02').InstrumentationKey
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${apiManagementServiceName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
  }
}

output apimUrl string = apiManagementService.properties.gatewayUrl
output appInsightsKey string = appInsights.properties.InstrumentationKey
