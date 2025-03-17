# DBD-Core-React
AI rewrite of DBD Core from PVX to React

## Overview

This project is a modern implementation of the DBD Core application, rebuilt from Delphi/PVX to a React-based architecture. It features a containerized microservices architecture using Node.js backends, a React frontend, and PostgreSQL for data storage.

## System Architecture

- **Frontend**: React-based SPA with modern UI components
- **API Gateway**: Node.js service handling API requests and authentication
- **PVX Processor**: Service for processing legacy PVX data
- **Database**: PostgreSQL for data storage

## Deployment Options

### 1. Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/DBD-Core-React.git
cd DBD-Core-React

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the application with Docker Compose
docker-compose up -d
```

### 2. Azure Linux VM Deployment

This repository includes tools to deploy the application to Azure Linux VMs, which is the recommended production environment.

#### Prerequisites

- Azure CLI installed and configured
- Bash shell environment (use WSL on Windows if needed)
- Docker and Docker Compose (for local testing)

#### Step 1: Deploy Azure Infrastructure

```bash
# Navigate to the infrastructure directory
cd infrastructure

# Make scripts executable
chmod +x deploy-linux-vm.sh
chmod +x deploy-app.sh
chmod +x deploy-api-gateway.sh

# Deploy a Linux VM to Azure
./deploy-linux-vm.sh my-resource-group eastus dbd-vm dbdadmin your-tenant-id your-subscription-id production
```

#### Step 2: Set Up the VM Environment

After the VM is deployed, SSH into it and run the setup script:

```bash
# SSH into the VM (using the IP address from the deployment output)
ssh dbdadmin@<vm-ip-address>

# Copy the vm-setup.sh script to the VM and run it
chmod +x vm-setup.sh
./vm-setup.sh
```

#### Step 3: Deploy the Application

```bash
# Deploy the application to the VM
./deploy-app.sh dbdadmin <vm-ip-address> ~/.ssh/id_rsa_dbd
```

#### Step 4: Access the Application

After deployment, the application will be available at:
- Web UI: http://<vm-ip-address>
- API Gateway: http://<vm-ip-address>:3000

### 3. Azure API Management (Optional)

For production environments with multiple services, you can also deploy the API Management layer:

```bash
# Deploy API Management
./deploy-api-gateway.sh my-api-rg eastus dbd-apim admin@example.com "Admin Name" your-tenant-id your-subscription-id production
```

## Monitoring and Maintenance

### Checking Logs

```bash
# SSH into the VM
ssh dbdadmin@<vm-ip-address>

# View container logs
cd ~/dbd-app
docker-compose logs -f frontend  # View frontend logs
docker-compose logs -f api-gateway  # View API Gateway logs
```

### Updating the Application

To update the application with a new version:

```bash
# Deploy the updated application
./deploy-app.sh dbdadmin <vm-ip-address> ~/.ssh/id_rsa_dbd
```

## Development Notes

- All services are containerized for consistency across environments
- Ubuntu Server 22.04 LTS is the recommended OS for Azure VMs
- The application uses Docker Compose for managing services

## License

See the [LICENSE](LICENSE) file for details.
