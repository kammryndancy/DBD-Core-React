#!/bin/bash
# deploy-app.sh - Script to deploy the DBD Core application to an Azure Linux VM

# Default values
VM_USER=${1:-"dbdadmin"}
VM_IP=${2:-""}
SSH_KEY_FILE=${3:-"$HOME/.ssh/id_rsa_dbd"}
APP_SOURCE_DIR=${4:-"$(pwd)"}

# Check for required parameters
if [ -z "$VM_IP" ]; then
  echo "Usage: $0 [vm-user] vm-ip [ssh-key-file] [app-source-dir]"
  echo "Parameters in [] are optional and have default values."
  exit 1
fi

# Determine SSH command
if [ -f "$SSH_KEY_FILE" ]; then
  SSH_CMD="ssh -i $SSH_KEY_FILE $VM_USER@$VM_IP"
else
  SSH_CMD="ssh $VM_USER@$VM_IP"
fi

# Check if we can connect to the VM
echo "Checking connection to VM..."
$SSH_CMD "echo 'Connection successful!'" || {
  echo "Failed to connect to the VM. Check your SSH credentials and VM IP."
  exit 1
}

# Create a deployment package
echo "Creating deployment package..."
DEPLOY_DIR=$(mktemp -d)
PACKAGE_NAME="dbd-app-$(date '+%Y%m%d-%H%M%S').tar.gz"

# Copy relevant directories and files
cp -r "$APP_SOURCE_DIR/frontend" "$DEPLOY_DIR/"
cp -r "$APP_SOURCE_DIR/services" "$DEPLOY_DIR/"
cp -r "$APP_SOURCE_DIR/migrations" "$DEPLOY_DIR/"
cp "$APP_SOURCE_DIR/docker-compose.yml" "$DEPLOY_DIR/"
cp "$APP_SOURCE_DIR/.env.example" "$DEPLOY_DIR/.env.example"

# Create the package
tar -czf "$PACKAGE_NAME" -C "$DEPLOY_DIR" .

# Copy the package to the VM
echo "Copying deployment package to VM..."
scp ${SSH_KEY_FILE:+-i "$SSH_KEY_FILE"} "$PACKAGE_NAME" "$VM_USER@$VM_IP:~/"

# Extract and deploy the application
echo "Deploying application on VM..."
$SSH_CMD << EOF
  # Create backup if app directory already exists
  if [ -d ~/dbd-app ]; then
    echo "Creating backup of existing application..."
    BACKUP_DIR=~/dbd-app-backup-\$(date '+%Y%m%d-%H%M%S')
    mv ~/dbd-app \$BACKUP_DIR
  fi

  # Create app directory and extract package
  mkdir -p ~/dbd-app
  tar -xzf ~/$PACKAGE_NAME -C ~/dbd-app
  
  # Create .env file if it doesn't exist
  if [ ! -f ~/dbd-app/.env ]; then
    echo "Creating .env file..."
    cp ~/dbd-app/.env.example ~/dbd-app/.env
    # Generate random DB password
    DB_PASSWORD=\$(openssl rand -base64 12)
    echo "DB_PASSWORD=\$DB_PASSWORD" >> ~/dbd-app/.env
  fi
  
  # Stop and remove any existing containers
  if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Stopping existing containers..."
    cd ~/dbd-app
    docker-compose down
    
    # Start the application
    echo "Starting the application..."
    docker-compose up -d
    
    echo "Application deployed and started successfully."
  else
    echo "Docker or Docker Compose not installed. Please run vm-setup.sh first."
  fi
EOF

# Clean up
echo "Cleaning up temporary files..."
rm -rf "$DEPLOY_DIR" "$PACKAGE_NAME"

echo "Deployment completed successfully!"
echo "You can access the application at http://$VM_IP"
