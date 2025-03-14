# PVX Processor Service

## Overview

The PVX Processor service is a modern microservice designed to validate, process, and convert legacy PVX files into a PostgreSQL database schema. It provides robust error handling, detailed logging, and a comprehensive API for integration with frontend applications.

## Features

- **File Processing**
  - Single and batch PVX file processing
  - Comprehensive validation
  - Automatic schema conversion
  - Progress tracking

- **Modern Database Features**
  - UUID primary keys
  - Audit fields (created_at, updated_at)
  - Row-level security
  - Full-text search capabilities

- **Supported Modules**
  - Accounts Payable (AP)
    - AP0_Div: Division information
    - AP2_Term: Payment terms
    - AP3_VendCatg: Vendor categories
    - AP4_Vend: Vendor master data
    - AP5_VendStatus: Vendor status
    - AP8_VendMsg: Vendor messages
    - AP9_VendStats: Vendor statistics
    - APA_InvoiceEntManChk: Invoice entry

  - Accounts Receivable (AR)
    - AR1_Cust: Customer information
    - AR2_Terms: Payment terms
    - AR5_SlsTax: Sales tax
    - AR6_OpenInvoice: Open invoices
    - ARA_SlspersonStats: Salesperson statistics
    - ARB_InvoiceEntHdr: Invoice entry header

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- TypeScript >= 5.0

### Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the service
npm start
```

### Development
```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## Configuration

### Environment Variables
```env
# Server
PORT=3003
NODE_ENV=development
LOG_LEVEL=info

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=pvx_migration
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## API Documentation

Detailed API documentation is available in the `/docs` directory:
- [API Reference](docs/api-reference.md)
- [Developer Guide](docs/developer-guide.md)
- [Migration Guide](docs/migration-guide.md)

### Quick Start Example

```typescript
import axios from 'axios';
import FormData from 'form-data';

const processPVXFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify({
    validateOnly: false,
    addAuditFields: true,
    useUuidPrimaryKeys: true,
    enableRowLevelSecurity: true
  }));

  const response = await axios.post(
    'http://localhost:3003/api/v1/process',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};
```

## Architecture

### Components
- **Validators**: Ensure PVX file integrity and data consistency
- **Processors**: Handle file parsing and data transformation
- **Converters**: Generate modern PostgreSQL schemas
- **Logger**: Comprehensive logging with Winston

### Security Features
- JWT authentication
- Rate limiting
- Row-level security
- Input validation
- CORS protection
- Helmet security headers

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration
```

## Error Handling

The service implements comprehensive error handling:
- Validation errors
- Processing errors
- Database errors
- Authentication errors
- Rate limiting errors

Each error response includes:
- Error code
- Descriptive message
- Stack trace (development only)
- Request ID for tracking

## Performance

### Optimizations
- Batch processing
- Streaming file uploads
- Connection pooling
- Query optimization
- Proper indexing

### Monitoring
- Request tracking
- Processing time metrics
- Error rate monitoring
- Resource usage stats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
