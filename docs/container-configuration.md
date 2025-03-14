# Container Configuration for PVX Processing System

## Service Architecture

### 1. Frontend Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

### 2. API Gateway Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm install
COPY services/api-gateway/ .
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. PVX Processor Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY services/pvx-processor/package*.json ./
RUN npm install
COPY services/pvx-processor/ .
CMD ["npm", "start"]
```

### 4. PostgreSQL Container
```dockerfile
FROM postgres:15-alpine
ENV POSTGRES_DB=pvx_db
ENV POSTGRES_USER=pvx_user
COPY init-scripts/ /docker-entrypoint-initdb.d/
EXPOSE 5432
```

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://api-gateway:3000
    depends_on:
      - api-gateway

  api-gateway:
    build:
      context: .
      dockerfile: services/api-gateway/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://pvx_user:${DB_PASSWORD}@postgres:5432/pvx_db
      - PVX_PROCESSOR_URL=http://pvx-processor:3001
    depends_on:
      - postgres
      - pvx-processor

  pvx-processor:
    build:
      context: .
      dockerfile: services/pvx-processor/Dockerfile
    environment:
      - DATABASE_URL=postgresql://pvx_user:${DB_PASSWORD}@postgres:5432/pvx_db
    volumes:
      - pvx-data:/app/data
    depends_on:
      - postgres

  postgres:
    build:
      context: .
      dockerfile: postgres/Dockerfile
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres-data:
  pvx-data:
```

## Container Security Considerations

1. Base Images
   - Using Alpine-based images for minimal attack surface
   - Regular security updates via automated builds

2. Environment Variables
   - Sensitive data managed through environment variables
   - Database credentials never hardcoded
   - Separate .env files for different environments

3. Volume Management
   - Persistent storage for PostgreSQL data
   - Secure volume for PVX file processing
   - Regular backup procedures

## Resource Management

### Container Resource Limits
```yaml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  pvx-processor:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  postgres:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

## Health Checks

```yaml
services:
  api-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pvx_user -d pvx_db"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## Networking

1. Internal Network
   - Services communicate via internal Docker network
   - Only necessary ports exposed externally
   - API Gateway acts as reverse proxy

2. Service Discovery
   - Container names used as DNS within Docker network
   - Environment variables for service URLs
   - Automatic service discovery in Docker Compose

## Development vs Production

### Development
- Hot-reloading enabled for frontend
- Debug logging enabled
- Source maps included
- Volumes mounted for local development

### Production
- Multi-stage builds for smaller images
- Production optimization flags
- Minimal logging
- No source maps
- Read-only file systems where possible
