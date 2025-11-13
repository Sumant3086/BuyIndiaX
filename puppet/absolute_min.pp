exec { "deploy":
  command => "/bin/bash -c 'git clone https://github.com/Sumant3086/BuyIndiaX.git ~/app && cd ~/app && echo PORT=5000>.env && npm i && cd client && npm i && cd .. && pm2 start server.js && cd client && pm2 start npm -- start'",
  user => "ubuntu",
  creates => "/home/ubuntu/app"
}
