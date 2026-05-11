#!/bin/bash
set -e

DEPLOY_DIR="/opt/deploy/questionnaire-frontend"
COMPOSE_CMD="docker compose"

echo "=== 前端部署脚本 ==="
echo "部署目录: $DEPLOY_DIR"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 停止旧容器
echo ">>> 停止旧容器..."
cd "$DEPLOY_DIR"
$COMPOSE_CMD down 2>/dev/null || true

# 构建并启动
echo ">>> 构建并启动容器..."
$COMPOSE_CMD up -d --build

# 等待启动
echo ">>> 等待服务启动..."
sleep 10

# 检查容器状态
echo ">>> 容器状态:"
$COMPOSE_CMD ps

# 健康检查
echo ">>> 健康检查..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ || echo "000")
H5_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/ || echo "000")
echo "前端: HTTP $FRONTEND_STATUS"
echo "H5: HTTP $H5_STATUS"

# API代理检查
echo ">>> API代理检查..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3002/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' || echo "000")
echo "前端API代理: HTTP $API_STATUS"

echo "=== 部署完成 ==="
