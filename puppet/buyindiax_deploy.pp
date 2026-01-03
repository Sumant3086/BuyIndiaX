# BuyIndiaX Puppet Deployment

exec { "deploy_app":
  command => "/bin/bash -c 'cd /home/ubuntu/app && echo \"PORT=5000\" > .env && echo \"MONGODB_URI=mongodb://localhost:27017/buyindiax\" >> .env && echo \"JWT_SECRET=buyindiax_secret_key_2024\" >> .env && echo \"NODE_ENV=production\" >> .env'",
  user    => "ubuntu",
  creates => "/home/ubuntu/app/.env",
}

file { "/etc/systemd/system/buyindiax-backend.service":
  content => "[Unit]
Description=BuyIndiaX Backend
After=network.target mongod.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target",
  notify  => Exec["reload_systemd"]
}

file { "/etc/systemd/system/buyindiax-frontend.service":
  content => "[Unit]
Description=BuyIndiaX Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/client
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target",
  notify  => Exec["reload_systemd"]
}

exec { "reload_systemd":
  command     => "/bin/systemctl daemon-reload",
  refreshonly => true
}

service { "buyindiax-backend":
  ensure  => running,
  enable  => true,
  require => [File["/etc/systemd/system/buyindiax-backend.service"], Exec["deploy_app"]]
}

service { "buyindiax-frontend":
  ensure  => running,
  enable  => true,
  require => [File["/etc/systemd/system/buyindiax-frontend.service"], Exec["deploy_app"]]
}
