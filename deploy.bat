@echo off
REM Minimal deployment script for BuyIndiaX (Windows)

echo === BuyIndiaX Deployment ===

REM Step 1: Initialize Terraform
cd terraform
terraform init
terraform apply -auto-approve

REM Get server IP
for /f "delims=" %%i in ('terraform output -raw server_ip') do set SERVER_IP=%%i
echo %SERVER_IP% > server_ip.txt
echo Server IP: %SERVER_IP%

REM Step 2: Wait for server
echo Waiting for server initialization (60s)...
timeout /t 60 /nobreak

REM Step 3: Deploy with Puppet
echo Deploying application with Puppet...
ssh -i %USERPROFILE%\.ssh\devopsKey.pem -o StrictHostKeyChecking=no ubuntu@%SERVER_IP% "sudo /opt/puppetlabs/bin/puppet apply /home/ubuntu/app/puppet/buyindiax_deploy.pp"

REM Step 4: Configure Nagios
echo Configuring Nagios monitoring...
ssh -i %USERPROFILE%\.ssh\devopsKey.pem ubuntu@%SERVER_IP% "sudo cp /home/ubuntu/app/nagios/buyindiax_monitoring.cfg /etc/nagios4/conf.d/ && sudo systemctl restart nagios4"

echo === Deployment Complete ===
echo Application: http://%SERVER_IP%:3000
echo Nagios: http://%SERVER_IP%/nagios4
pause
