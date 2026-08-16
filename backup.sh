创建 ~/myapp/backup.sh：
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump --no-tablespaces -u appuser -p'AppPass123!' myapp > $BACKUP_DIR/myapp_$DATE.sql
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /home/deploy myapp
find $BACKUP_DIR -type f -mtime +7 -delete
echo "Backup completed at $(date)" >> /home/deploy/myapp/backup.log

添加执行权限并设置 crontab（crontab -e）：
0 2 * * * /home/deploy/myapp/backup.sh
