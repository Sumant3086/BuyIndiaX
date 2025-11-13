# ABSOLUTE MINIMUM - 30 Lines Total

## One Command Setup (Copy-Paste This)

```bash
# Create Terraform file (15 lines)
cat > main.tf <<'EOF'
provider "aws" { region = "us-east-1" }
resource "aws_instance" "s" {
  ami = "ami-0c7217cdde317cfec"
  instance_type = "t2.micro"
  key_name = "buyindiax-key"
  vpc_security_group_ids = [aws_security_group.sg.id]
  user_data = "#!/bin/bash\napt update\ncurl -fsSL https://deb.nodesource.com/setup_18.x|bash -\napt install -y nodejs git nagios4\nnpm i -g pm2\nwget https://apt.puppet.com/puppet7-release-jammy.deb\ndpkg -i puppet7-release-jammy.deb\napt update && apt install -y puppet-agent"
}
resource "aws_security_group" "sg" {
  ingress { from_port=22; to_port=22; protocol="tcp"; cidr_blocks=["0.0.0.0/0"] }
  ingress { from_port=80; to_port=80; protocol="tcp"; cidr_blocks=["0.0.0.0/0"] }
  ingress { from_port=3000; to_port=3000; protocol="tcp"; cidr_blocks=["0.0.0.0/0"] }
  ingress { from_port=5000; to_port=5000; protocol="tcp"; cidr_blocks=["0.0.0.0/0"] }
  egress { from_port=0; to_port=0; protocol="-1"; cidr_blocks=["0.0.0.0/0"] }
}
output "ip" { value = aws_instance.s.public_ip }
EOF

# Deploy
terraform init && terraform apply -auto-approve
IP=$(terraform output -raw ip)
sleep 180

# Deploy app with Puppet (10 lines)
ssh -i ~/.ssh/buyindiax-key.pem -o StrictHostKeyChecking=no ubuntu@$IP 'cat > /tmp/d.pp <<EOF
exec { "d": command => "/bin/bash -c \"git clone https://github.com/Sumant3086/BuyIndiaX.git ~/a && cd ~/a && echo PORT=5000>>.env && npm i && cd client && npm i && cd .. && pm2 start server.js && cd client && pm2 start npm -- start\"", user => "ubuntu", creates => "/home/ubuntu/a" }
EOF
sudo /opt/puppetlabs/bin/puppet apply /tmp/d.pp

# Setup Nagios (5 lines)
sudo tee /etc/nagios4/conf.d/a.cfg<<EOF
define host{use linux-server;host_name l;address 127.0.0.1;}
define service{use generic-service;host_name l;service_description N;check_command check_http!-p 5000;}
define service{use generic-service;host_name l;service_description R;check_command check_http!-p 3000;}
EOF
sudo systemctl restart nagios4'

echo "App: http://$IP:3000"
echo "Nagios: http://$IP/nagios4 (user:nagiosadmin pass:admin123)"
```

## That's It!

**Total Lines:**
- Terraform: 15 lines
- Puppet: 10 lines  
- Nagios: 5 lines
- **Total: 30 lines**

## Cleanup
```bash
terraform destroy -auto-approve
```
