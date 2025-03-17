#!/bin/bash
# deploy-linux-vm.sh - Script to deploy Azure Linux VM for DBD Core

# Default values
RESOURCE_GROUP_NAME=${1:-"dbd-vm-rg"}
LOCATION=${2:-"eastus"}
VM_NAME=${3:-"dbd-linux-vm"}
ADMIN_USERNAME=${4:-"dbdadmin"}
TENANT_ID=${5:-""}
SUBSCRIPTION_ID=${6:-""}
ENVIRONMENT=${7:-"development"}

# Check for required parameters
if [ -z "$TENANT_ID" ] || [ -z "$SUBSCRIPTION_ID" ]; then
  echo "Usage: $0 [resource-group-name] [location] [vm-name] [admin-username] tenant-id subscription-id [environment]"
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
    component="virtual-machine"

# Generate SSH key if using SSH authentication
read -p "Use SSH key authentication? (y/n): " USE_SSH
if [ "$USE_SSH" = "y" ]; then
  AUTH_TYPE="sshPublicKey"
  
  # Generate SSH key if it doesn't exist
  SSH_KEY_FILE="$HOME/.ssh/id_rsa_dbd"
  if [ ! -f "$SSH_KEY_FILE" ]; then
    echo "Generating SSH key..."
    ssh-keygen -t rsa -b 2048 -f "$SSH_KEY_FILE" -N ""
  fi
  
  # Read SSH public key
  SSH_PUBLIC_KEY=$(cat "${SSH_KEY_FILE}.pub")
  ADMIN_AUTH=$SSH_PUBLIC_KEY
else
  AUTH_TYPE="password"
  # Prompt for password
  read -sp "Enter password for VM admin user: " ADMIN_PASSWORD
  echo ""
  ADMIN_AUTH=$ADMIN_PASSWORD
fi

# Deploy VM
echo "Deploying Linux VM..."
DEPLOYMENT_NAME="dbd-vm-$(date '+%Y%m%d-%H%M%S')"

az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --template-file "./azure-linux-vm.bicep" \
  --parameters \
    vmName="$VM_NAME" \
    adminUsername="$ADMIN_USERNAME" \
    authenticationType="$AUTH_TYPE" \
    adminPasswordOrKey="$ADMIN_AUTH" \
    environment="$ENVIRONMENT" \
    location="$LOCATION"

# Get VM IP and DNS
VM_IP=$(az vm show -d -g "$RESOURCE_GROUP_NAME" -n "$VM_NAME" --query publicIps -o tsv)
VM_DNS=$(az vm show -d -g "$RESOURCE_GROUP_NAME" -n "$VM_NAME" --query fqdns -o tsv)

echo "VM Deployment completed successfully."
echo "VM IP Address: $VM_IP"
echo "VM DNS Name: $VM_DNS"

if [ "$AUTH_TYPE" = "sshPublicKey" ]; then
  echo "Connect using: ssh -i $SSH_KEY_FILE $ADMIN_USERNAME@$VM_IP"
else
  echo "Connect using: ssh $ADMIN_USERNAME@$VM_IP"
fi

# Create VM setup script
cat > ./vm-setup.sh << 'EOF'
#!/bin/bash
# VM setup script for DBD Core application

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
DOCKER_COMPOSE_VERSION="2.18.1"
sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER

# Create app directory
mkdir -p ~/dbd-app
cd ~/dbd-app

# Create docker-compose.yml
cat > docker-compose.yml << 'DOCKER_EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api-gateway

  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://pvx_user:${DB_PASSWORD}@postgres:5432/pvx_db
      - PVX_PROCESSOR_URL=http://pvx-processor:3001
    depends_on:
      postgres:
        condition: service_healthy
      pvx-processor:
        condition: service_started

  pvx-processor:
    build:
      context: ./services/pvx-processor
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pvx_user:${DB_PASSWORD}@postgres:5432/pvx_db
    volumes:
      - pvx-data:/app/data
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=pvx_db
      - POSTGRES_USER=pvx_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pvx_user -d pvx_db"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
  pvx-data:
DOCKER_EOF

# Create .env file with random DB password
DB_PASSWORD=$(openssl rand -base64 12)
echo "DB_PASSWORD=${DB_PASSWORD}" > .env

echo "VM setup completed. Deploy your application code to the ~/dbd-app directory."
echo "After deployment, run 'docker-compose up -d' to start the application."
EOF

echo "Created vm-setup.sh script. Copy this script to your VM after connecting and run it to set up the environment."
