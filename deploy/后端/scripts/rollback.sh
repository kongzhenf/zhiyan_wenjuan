#!/bin/bash
# 问卷调查平台后端 - 回滚脚本
# 回滚策略: 停止并移除当前容器，清除构建缓存

set -e

DEPLOY_DIR="/opt/deploy/questionnaire-backend"
COMPOSE_CMD="docker-compose"

echo "=========================================="
echo "  问卷调查平台 - 后端回滚"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

cd "$DEPLOY_DIR"

# 1. 停止所有容器
echo "[1/4] 停止容器..."
$COMPOSE_CMD down

# 2. 移除构建的镜像
echo "[2/4] 移除镜像..."
docker rmi questionnaire-backend-app:latest 2>/dev/null || echo "镜像不存在，跳过"

# 3. 数据保留说明
echo "[3/4] 数据卷保留..."
echo "  MySQL数据卷: questionnaire-backend_mysql-data (保留)"
echo "  Redis数据卷: questionnaire-backend_redis-data (保留)"
echo "  导出文件卷: questionnaire-backend_export-data (保留)"
echo "  如需彻底清除数据，执行: docker volume rm questionnaire-backend_mysql-data questionnaire-backend_redis-data questionnaire-backend_export-data"

# 4. 验证
echo "[4/4] 验证回滚..."
$COMPOSE_CMD ps
echo ""
echo "回滚完成。如需重新部署，执行: bash deploy.sh"
