#!/bin/bash
# Minimal deployment script for BuyIndiaX

echo "=== BuyIndiaX Deployment ==="

# Step 1: Initialize Terraform
cd terraform
terraform init
terraform apply -auto-approve

# Get server IP
SERVER_IP=$(terraform output -raw server_ip)
echo $SERVER_IP > server_ip.txt
echo "Server IP: $SERVER_IP"

# Step 2: Wait for server to be ready
echo "Waiting for server initialization (60s)..."
sleep 60

# Step 3: Deploy with Puppet
echo "Deploying application with Puppet..."
ssh -i ~/.ssh/devopsKey.pem -o StrictHostKeyChecking=no ubuntu@$SERVER_IP "sudo /opt/puppetlabs/bin/puppet apply /home/ubuntu/app/puppet/buyindiax_deploy.pp"

# Step 4: Configure Nagios
echo "Configuring Nagios monitoring..."
ssh -i ~/.ssh/devopsKey.pem ubuntu@$SERVER_IP "sudo cp /home/ubuntu/app/nagios/buyindiax_monitoring.cfg /etc/nagios4/conf.d/ && sudo systemctl restart nagios4"

echo "=== Deployment Complete ==="
echo "Application: http://$SERVER_IP:3000"
echo "Nagios: http://$SERVER_IP/nagios4"
