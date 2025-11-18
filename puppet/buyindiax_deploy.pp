# Puppet Manifest - BuyIndiaX Deployment
# This is the PUPPET SLAVE configuration
# Executed on EC2 instance to deploy MERN application

exec { "deploy_buyindiax":
  command => "/bin/bash -c '\
    cd /home/ubuntu && \
    git clone https://github.com/Sumant3086/BuyIndiaX.git app && \
    cd app && \
    echo \"PORT=5000\" > .env && \
    echo \"MONGODB_URI=mongodb://localhost:27017/buyindiax\" >> .env && \
    echo \"JWT_SECRET=buyindiax_secret_key_2024_secure_token\" >> .env && \
    echo \"RAZORPAY_KEY_ID=your_razorpay_key_id\" >> .env && \
    echo \"RAZORPAY_KEY_SECRET=your_razorpay_key_secret\" >> .env && \
    echo \"NODE_ENV=production\" >> .env && \
    npm install && \
    cd client && npm install && cd .. && \
    npm run seed\
  '",
  user    => "ubuntu",
  creates => "/home/ubuntu/app",
  timeout => 1800
}

# Systemd service for Backend (Express + Node.js)
file { "/etc/systemd/system/buyindiax-backend.service":
  content => "[Unit]
Description=BuyIndiaX Backend - Express API
After=network.target mongod.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target",
  notify  => Exec["reload_systemd"]
}

# Systemd service for Frontend (React)
file { "/etc/systemd/system/buyindiax-frontend.service":
  content => "[Unit]
Description=BuyIndiaX Frontend - React App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/client
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target",
  notify  => Exec["reload_systemd"]
}

# Reload systemd daemon
exec { "reload_systemd":
  command     => "/bin/systemctl daemon-reload",
  refreshonly => true
}

# Start and enable backend service
service { "buyindiax-backend":
  ensure  => running,
  enable  => true,
  require => [File["/etc/systemd/system/buyindiax-backend.service"], Exec["deploy_buyindiax"]]
}

# Start and enable frontend service
service { "buyindiax-frontend":
  ensure  => running,
  enable  => true,
  require => [File["/etc/systemd/system/buyindiax-frontend.service"], Exec["deploy_buyindiax"]]
}
