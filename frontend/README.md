# DemandBridge DBD Frontend

Modern React-based frontend for the DemandBridge Data Migration Dashboard. This application provides a user interface for managing and monitoring the migration from PVX to PostgreSQL.

## Features

### Data Migration Dashboard
- Real-time validation statistics
- Data type conversion monitoring
- Migration progress tracking
- Error reporting and analysis

### AP Module
- Vendor management
- Invoice processing
- Validation rules configuration
- Data type mapping for:
  - AP0_Div (Division information)
  - AP2_Term (Payment terms)
  - AP3_VendCatg (Vendor categories)
  - AP4_Vend (Vendor master data)
  - AP5_VendStatus (Vendor status)
  - AP8_VendMsg (Vendor messages)
  - AP9_VendStats (Vendor statistics)
  - APA_InvoiceEntManChk (Invoice entry)

### AR Module
- Customer management
- Invoice processing
- Sales tax configuration
- Data type mapping for:
  - AR1_Cust (Customer information)
  - AR2_Terms (Payment terms)
  - AR5_SlsTax (Sales tax)
  - AR6_OpenInvoice (Open invoices)
  - ARA_SlspersonStats (Salesperson statistics)
  - ARB_InvoiceEntHdr (Invoice entry header)

### Data Type Migration
- CHAR → VARCHAR conversion
- NUMBER(14,3) → DECIMAL(14,3) conversion
- DATE → TIMESTAMP WITH TIME ZONE conversion
- Validation rules and schema management
- Audit logging and error tracking

## Technology Stack

- React 18
- TypeScript
- Material-UI (MUI)
- Redux for state management
- React Router for navigation
- Vite for development and building

## Local Development

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Azure Cloud Deployment

### Prerequisites
1. Azure Account with active subscription
2. Azure CLI installed (`winget install Microsoft.AzureCLI`)
3. PowerShell 7 or higher (`winget install Microsoft.PowerShell`)
4. Git for Windows (`winget install Git.Git`)

### Quick Deploy
1. Clone the repository:
```bash
git clone https://github.com/YOUR_ORG/demandbridge-dbd.git
cd demandbridge-dbd/frontend
```

2. Update environment variables:
```bash
# Copy the example env file
cp .env.production.example .env.production

# Edit .env.production with your values
notepad .env.production
```

3. Run the deployment script:
```powershell
# Open PowerShell as Administrator
cd scripts
./deploy-azure.ps1 `
    -ResourceGroupName "dbd-frontend-rg" `
    -Location "eastus" `
    -AppName "dbd-frontend" `
    -TenantId "your-tenant-id" `
    -SubscriptionId "your-subscription-id"
```

### Manual Deployment Steps

#### 1. Resource Creation
```bash
# Login to Azure
az login

# Create Resource Group
az group create --name dbd-frontend-rg --location eastus

# Create Static Web App
az staticwebapp create \
  --name dbd-frontend \
  --resource-group dbd-frontend-rg \
  --location eastus \
  --sku Standard
```

#### 2. Configuration Setup
```bash
# Create App Configuration
az appconfig create \
  --name dbd-frontend-config \
  --resource-group dbd-frontend-rg \
  --location eastus

# Add Application Insights
az monitor app-insights component create \
  --app dbd-frontend \
  --location eastus \
  --resource-group dbd-frontend-rg \
  --application-type web
```

#### 3. Security Configuration
1. Enable Azure AD authentication:
```bash
az staticwebapp auth update \
  --name dbd-frontend \
  --resource-group dbd-frontend-rg \
  --provider azure-active-directory \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET
```

2. Update `staticwebapp.config.json` with your tenant ID:
```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  }
}
```

#### 4. Performance Optimization
1. Configure CDN:
```bash
az cdn profile create \
  --name dbd-frontend-cdn \
  --resource-group dbd-frontend-rg \
  --sku Standard_Microsoft

az cdn endpoint create \
  --name dbd-frontend \
  --profile-name dbd-frontend-cdn \
  --resource-group dbd-frontend-rg \
  --origin your-static-webapp-url \
  --origin-host-header your-static-webapp-url
```

2. Enable compression and caching in `staticwebapp.config.json`:
```json
{
  "globalHeaders": {
    "Cache-Control": "max-age=3600"
  }
}
```

### Migration Configuration

The application supports various data type migrations:

1. **CHAR to VARCHAR**
   - Enabled by default
   - Configurable max length
   - Preserves data integrity

2. **NUMBER(14,3) to DECIMAL(14,3)**
   - Maintains precision
   - Handles legacy numeric formats
   - Validates range constraints

3. **DATE to TIMESTAMP WITH TIME ZONE**
   - Timezone awareness
   - ISO 8601 compliance
   - Historical data preservation

Configure these settings in `.env.production`:
```bash
# Data Type Migration Settings
VITE_CHAR_TO_VARCHAR_ENABLED=true
VITE_NUMBER_TO_DECIMAL_ENABLED=true
VITE_DATE_TO_TIMESTAMP_ENABLED=true
VITE_DEFAULT_NUMERIC_PRECISION=14
VITE_DEFAULT_NUMERIC_SCALE=3
```

### Monitoring and Logging

1. **Application Insights**
   - Real-time metrics
   - Error tracking
   - Performance monitoring

2. **Audit Logs**
   - Data type conversions
   - Validation failures
   - Schema modifications

3. **Security Events**
   - Authentication attempts
   - Authorization checks
   - Data access patterns

### Troubleshooting

1. **Deployment Issues**
   - Check Azure Static Web Apps logs
   - Verify GitHub Actions workflow
   - Validate environment variables

2. **Authentication Problems**
   - Confirm Azure AD configuration
   - Check client ID and secret
   - Verify redirect URIs

3. **Performance Issues**
   - Monitor CDN metrics
   - Check Application Insights
   - Verify caching configuration

## Development

The project follows a modern React architecture with TypeScript for type safety. Key points:

1. **Type Safety**
   - Strict TypeScript configuration
   - Comprehensive type definitions for all modules
   - Interface-first development approach

2. **State Management**
   - Redux for global state
   - Modular state organization by feature
   - Type-safe actions and reducers

3. **Component Structure**
   - Feature-based organization
   - Shared components in common directory
   - Material-UI for consistent styling

4. **API Integration**
   - Axios for HTTP requests
   - Proxy configuration for development
   - Error handling and retry logic

### Project Structure

```
src/
├── components/       # Shared components
├── pages/           # Page components
│   ├── ap/          # AP module pages
│   ├── ar/          # AR module pages
│   ├── validation/  # Validation pages
│   └── Dashboard/   # Main dashboard
├── store/           # Redux store setup
│   └── slices/      # Redux slices
├── types/           # TypeScript types
├── utils/           # Utility functions
└── App.tsx          # Main app component
```

## Contributing

1. Follow TypeScript best practices
2. Maintain consistent code style
3. Write comprehensive tests
4. Document new features and changes

## License

Copyright 2024 DemandBridge. All rights reserved.
