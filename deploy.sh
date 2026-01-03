#!/bin/bash
echo "=== BuyIndiaX Deployment ==="

cd terraform
terraform init
terraform apply -auto-approve

APP_IP=$(terraform output -raw app_server_ip)
NAGIOS_IP=$(terraform output -raw nagios_server_ip)

echo $APP_IP > server_ip.txt
echo $NAGIOS_IP > nagios_ip.txt

echo "Waiting 90s for initialization..."
sleep 90

echo "Deploying application..."
ssh -i devopsKey.pem -o StrictHostKeyChecking=no ubuntu@$APP_IP "cd /home/ubuntu && git clone https://github.com/Sumant3086/BuyIndiaX.git app || (cd app && git pull) && cd app && npm install && cd client && npm install && npm run build && cd .. && npm run seed"

ssh -i devopsKey.pem ubuntu@$APP_IP "sudo /opt/puppetlabs/bin/puppet apply /home/ubuntu/app/puppet/buyindiax_deploy.pp"

echo "Configuring Nagios..."
sed "s/APP_SERVER_IP/$APP_IP/g" ../nagios/buyindiax_monitoring.cfg > /tmp/nagios.cfg
scp -i devopsKey.pem /tmp/nagios.cfg ubuntu@$NAGIOS_IP:/tmp/
ssh -i devopsKey.pem ubuntu@$NAGIOS_IP "sudo cp /tmp/nagios.cfg /etc/nagios4/conf.d/buyindiax.cfg && sudo systemctl restart nagios4 apache2"

echo "=== Complete ==="
echo "App: http://$APP_IP:3000"
echo "Nagios: http://$NAGIOS_IP/nagios4 (nagiosadmin/nagiosadmin)"
