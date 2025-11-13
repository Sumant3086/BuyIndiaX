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
