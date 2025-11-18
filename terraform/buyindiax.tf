provider "aws" { 
  region = "us-east-1" 
}

resource "aws_instance" "buyindiax" {
  ami           = "ami-0c7217cdde317cfec"
  instance_type = "t2.micro"
  key_name      = "devopsKey"
  
  vpc_security_group_ids = [aws_security_group.buyindiax_sg.id]
  
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt-get update
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs git
    
    # Install MongoDB 6.0
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    
    # Install Nagios 4
    apt-get install -y nagios4 nagios-plugins-contrib apache2
    systemctl start nagios4
    systemctl enable nagios4
    systemctl start apache2
    systemctl enable apache2
    
    # Install Puppet Agent
    wget https://apt.puppet.com/puppet7-release-jammy.deb
    dpkg -i puppet7-release-jammy.deb
    apt-get update
    apt-get install -y puppet-agent
    
    echo "DevOps tools installed: Terraform, AWS EC2, Puppet, Nagios" > /tmp/setup_done.txt
  EOF
  
  tags = {
    Name = "buyindiax-server"
    Project = "BuyIndiaX"
    ManagedBy = "Terraform"
  }
}

resource "aws_security_group" "buyindiax_sg" {
  name        = "buyindiax-sg"
  description = "Security group for BuyIndiaX application"
  
  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }
  
  # HTTP for Nagios
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for Nagios"
  }
  
  # React Frontend
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "React Frontend"
  }
  
  # Node.js Backend
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Node.js Backend"
  }
  
  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = {
    Name = "buyindiax-sg"
    Project = "BuyIndiaX"
  }
}

output "server_ip" {
  value       = aws_instance.buyindiax.public_ip
  description = "Public IP of BuyIndiaX server"
}

output "ssh_command" {
  value       = "ssh -i ~/.ssh/devopsKey.pem ubuntu@${aws_instance.buyindiax.public_ip}"
  description = "SSH command to connect to server"
}

output "application_url" {
  value       = "http://${aws_instance.buyindiax.public_ip}:3000"
  description = "BuyIndiaX application URL"
}

output "nagios_url" {
  value       = "http://${aws_instance.buyindiax.public_ip}/nagios4"
  description = "Nagios monitoring dashboard"
}
