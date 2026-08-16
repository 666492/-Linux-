创建 /etc/systemd/system/myapp.service：
[Unit]
Description=My Node.js App
After=network.target mysql.service redis-server.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/myapp
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=myapp
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

启用并启动：
sudo systemctl daemon-reload; sudo systemctl enable myapp; sudo systemctl start myapp
