#!/bin/bash
# 问卷调查平台后端 - 部署脚本
# 目标服务器: 10.32.129.153
# 部署目录: /opt/deploy/questionnaire-backend

set -e

DEPLOY_DIR="/opt/deploy/questionnaire-backend"
COMPOSE_CMD="docker-compose"

echo "=========================================="
echo "  问卷调查平台 - 后端部署"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. 检查环境
echo "[1/5] 检查环境..."
docker version --format "Docker: {{.Server.Version}}" || { echo "Docker未安装"; exit 1; }
$COMPOSE_CMD version || { echo "Docker Compose未安装"; exit 1; }

# 2. 检查端口
echo "[2/5] 检查端口..."
for port in 8082 3307 6381; do
    (echo >/dev/tcp/localhost/$port) 2>/dev/null && echo "警告: 端口 $port 已被占用，将停止旧容器" || echo "端口 $port 可用"
done

# 3. 创建 .env 文件（如不存在）
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "[3/5] 创建 .env 配置..."
    cat > "$DEPLOY_DIR/.env" << 'EOF'
MYSQL_PASSWORD=questionnaire123
JWT_SECRET=questionnaire-platform-prod-jwt-secret-2026
H5_BASE_URL=http://10.32.129.153:3001/s
EOF
else
    echo "[3/5] .env 已存在，跳过创建"
fi

# 4. 停止旧容器并重建
echo "[4/5] 停止旧容器并重建..."
cd "$DEPLOY_DIR"
$COMPOSE_CMD down 2>/dev/null || true
$COMPOSE_CMD up -d --build

# 5. 等待服务就绪并验证
echo "[5/5] 等待服务启动..."
sleep 30

# 检查容器状态
echo "--- 容器状态 ---"
$COMPOSE_CMD ps

# 健康检查
echo "--- 健康检查 ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' http://localhost:8082/api/auth/login)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ API 健康检查通过 (HTTP $HTTP_CODE)"
else
    echo "✗ API 健康检查失败 (HTTP $HTTP_CODE)"
    echo "查看日志: docker logs questionnaire-app"
    exit 1
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  后端API: http://10.32.129.153:8082"
echo "  MySQL:   10.32.129.153:3307"
echo "  Redis:   10.32.129.153:6381"
echo "=========================================="
