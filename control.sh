#!/bin/bash
# 服务启停管理脚本
# 用法：./control.sh {start|stop|restart|status}

case $1 in
  start)
    sudo systemctl start myapp
    ;;
  stop)
    sudo systemctl stop myapp
    ;;
  restart)
    sudo systemctl restart myapp
    ;;
  status)
    sudo systemctl status myapp
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
esac
