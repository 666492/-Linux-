创建 ~/myapp/backup.sh：
#!/bin/bash
# 数据库与代码定时备份脚本
# 用法：./backup.sh

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/home/deploy/myapp/backup.log"

mkdir -p $BACKUP_DIR

# 备份 MySQL（添加 --no-tablespaces 避免表空间权限问题）
mysqldump --no-tablespaces -u appuser -p'AppPass123!' myapp > $BACKUP_DIR/myapp_$DATE.sql

# 打包应用代码（可选）
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /home/deploy myapp

# 删除 7 天前的备份文件
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed at $(date)" >> $LOG_FILE

添加执行权限并设置 crontab（crontab -e）：
0 2 * * * /home/deploy/myapp/backup.sh
