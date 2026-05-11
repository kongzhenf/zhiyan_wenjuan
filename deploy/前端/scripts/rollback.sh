#!/bin/bash
set -e

DEPLOY_DIR="/opt/deploy/questionnaire-frontend"
COMPOSE_CMD="docker compose"

echo "=== 前端回滚脚本 ==="
echo "部署目录: $DEPLOY_DIR"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

cd "$DEPLOY_DIR"

echo ">>> 停止并移除容器..."
$COMPOSE_CMD down

echo ">>> 移除构建镜像..."
docker rmi questionnaire-frontend-questionnaire-frontend:latest 2>/dev/null || true
docker rmi questionnaire-frontend-questionnaire-h5:latest 2>/dev/null || true

echo ">>> 验证容器已停止..."
$COMPOSE_CMD ps

echo "=== 回滚完成 ==="
