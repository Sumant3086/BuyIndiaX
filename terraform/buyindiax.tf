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
    apt-get update
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs git
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    wget https://apt.puppet.com/puppet7-release-jammy.deb
    dpkg -i puppet7-release-jammy.deb
    apt-get update
    apt-get install -y puppet-agent
  EOF
  
  tags = {
    Name = "app-server"
    Project = "BuyIndiaX"
  }
}

resource "aws_instance" "nagios" {
  ami           = "ami-0c7217cdde317cfec"
  instance_type = "t2.micro"
  key_name      = "devopsKey"
  vpc_security_group_ids = [aws_security_group.nagios_sg.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y apache2 nagios4 nagios-plugins-contrib
    htpasswd -bc /etc/nagios4/htpasswd.users nagiosadmin nagiosadmin
    systemctl start apache2 nagios4
    systemctl enable apache2 nagios4
  EOF
  
  tags = {
    Name = "nagios-server"
    Project = "BuyIndiaX"
  }
}

resource "aws_instance" "puppet_master" {
  ami           = "ami-0c7217cdde317cfec"
  instance_type = "t2.micro"
  key_name      = "devopsKey"
  vpc_security_group_ids = [aws_security_group.puppet_sg.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    wget https://apt.puppet.com/puppet7-release-jammy.deb
    dpkg -i puppet7-release-jammy.deb
    apt-get update
    apt-get install -y puppetserver
    systemctl start puppetserver
    systemctl enable puppetserver
  EOF
  
  tags = {
    Name = "puppet-master"
    Project = "BuyIndiaX"
  }
}

resource "aws_security_group" "buyindiax_sg" {
  name = "buyindiax-sg"
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "buyindiax-sg"
  }
}

resource "aws_security_group" "nagios_sg" {
  name = "nagios-sg"
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "nagios-sg"
  }
}

resource "aws_security_group" "puppet_sg" {
  name = "puppet-sg"
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 8140
    to_port     = 8140
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "puppet-sg"
  }
}

output "app_server_ip" {
  value = aws_instance.buyindiax.public_ip
}

output "nagios_server_ip" {
  value = aws_instance.nagios.public_ip
}

output "puppet_master_ip" {
  value = aws_instance.puppet_master.public_ip
}

output "application_url" {
  value = "http://${aws_instance.buyindiax.public_ip}:3000"
}

output "nagios_url" {
  value = "http://${aws_instance.nagios.public_ip}/nagios4"
}
