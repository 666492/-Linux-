# 基于 Linux 的高可用博客后台系统部署实战

> 部署项目，完整还原生产环境搭建、故障排查与自动化运维。

---

## 一、项目概述

本项目从零开始在 Ubuntu 22.04 上部署一套**具备后台管理功能的博客系统**，涵盖 Web 服务全链路：Nginx 反向代理 + HTTPS、Node.js 应用服务、MySQL 数据持久化、Redis 缓存计数，并构建了完整的运维体系（进程守护、日志轮转、定时备份）。项目记录了所有实际踩坑与解决方案。

**技术栈**：
- **操作系统**：Ubuntu 22.04.4
- **Web 服务器**：Nginx 1.18.0（反向代理 + 静态资源分发 + HTTPS）
- **应用服务**：Node.js 18.20 + Express（提供 RESTful API）
- **数据库**：MySQL 8.0（存储文章数据）
- **缓存**：Redis 7.0（页面访问计数）
- **进程管理**：Systemd（开机自启 + 崩溃自动重启）
- **日志管理**：Logrotate（每日切割，保留 7 天）
- **备份策略**：Shell 脚本 + Crontab（每日凌晨 2 点备份，保留 7 天）

**服务器信息**：
- IP：`192.168.113.132`
- 普通用户：`deploy`（运行应用，与 root 隔离）

---

## 二、功能展示

### 博客后台管理界面（访问 `https://192.168.113.132`）
- **顶部**：显示页面总访问量（Redis 自增计数）
- **中部**：发布新文章表单（标题 + 内容，点击发布）
- **底部**：文章列表，展示所有已发布文章（按时间倒序），每条附带 **删除** 按钮

### RESTful API 接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/posts` | 获取所有文章 |
| GET | `/api/posts/:id` | 获取单篇文章 |
| POST | `/api/posts` | 发布新文章（JSON: `{title, content}`） |
| DELETE | `/api/posts/:id` | 删除指定文章 |
| GET | `/api/count` | 获取访问量 |

---

## 三、部署步骤（精简版）

### 1. 系统环境准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y vim curl wget git net-tools ufw

# 创建普通用户（隔离运行环境）
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy
sudo usermod -aG sudo deploy   # 可选，方便调试

### 2.安装系统服务（root）
# MySQL
sudo apt install -y mysql-server
sudo systemctl enable mysql

# Redis
sudo apt install -y redis-server
sudo systemctl enable redis

# Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

### 3.部署Node.js应用
su - deploy
mkdir ~/myapp && cd ~/myapp
npm init -y
npm install express mysql2 ioredis

app.js 核心代码（简化版，完整见 GitHub）：
提供 /api/users：从 MySQL 查询用户列表
提供 /api/count：Redis 自增访问计数
监听 127.0.0.1:3000（仅本地，由 Nginx 代理对外）
index.html：静态首页，提供 API 测试链接。

### 4.数据库与缓存初始化：
CREATE DATABASE myapp;
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'AppPass123!';
GRANT ALL PRIVILEGES ON myapp.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;

### 5.Nginx反向代理+HTTPS：
生成自签名证书：
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/myapp.key \
    -out /etc/nginx/ssl/myapp.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Test/CN=192.168.113.132"

Nginx 配置要点：
HTTP(80) 自动重定向到 HTTPS(443)
静态资源（/）由 Nginx 直接返回 /home/deploy/myapp/index.html
API 请求（/api/）反向代理到 http://127.0.0.1:3000

### 6.Systemd进程守护：
创建 /etc/systemd/system/myapp.service：
User/Group：deploy
WorkingDirectory：/home/deploy/myapp
ExecStart：/usr/bin/node app.js
Restart=always（崩溃自动重启）
开机自启：sudo systemctl enable myapp

### 7.日志轮转：
配置 /etc/logrotate.d/myapp：
轮转 /var/log/myapp.log
策略：daily, rotate 7, compress
权限：create 0644 deploy deploy
轮转后重载服务：systemctl reload myapp

### 8.定时备份：
备份脚本 ~/myapp/backup.sh：
使用 mysqldump 备份 MySQL（--no-tablespaces 避免权限错误）
打包应用代码
删除 7 天前备份

定时任务（deploy 用户的 crontab）：
0 2 * * * /home/deploy/myapp/backup.sh
