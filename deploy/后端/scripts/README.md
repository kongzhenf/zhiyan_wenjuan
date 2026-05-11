# 问卷调查平台后端 - 部署脚本说明

## 文件说明

| 文件 | 用途 |
|------|------|
| docker-compose.yml | Docker Compose 编排文件，定义 app/mysql/redis 三个服务 |
| deploy.sh | 一键部署脚本，包含环境检查、构建、启动和验证 |
| rollback.sh | 回滚脚本，停止容器并清理镜像（保留数据卷） |

## 快速部署

```bash
# 1. 上传整个项目到服务器 /opt/deploy/questionnaire-backend
# 2. 将 scripts/ 下的文件复制到项目根目录
cp scripts/docker-compose.yml /opt/deploy/questionnaire-backend/
cp scripts/deploy.sh /opt/deploy/questionnaire-backend/
cp scripts/rollback.sh /opt/deploy/questionnaire-backend/

# 3. 执行部署
cd /opt/deploy/questionnaire-backend
bash deploy.sh
```

## 端口映射

| 服务 | 容器端口 | 宿主机端口 |
|------|----------|------------|
| 后端API (app) | 8080 | 8082 |
| MySQL (mysql) | 3306 | 3307 |
| Redis (redis) | 6379 | 6381 |

## 回滚

```bash
cd /opt/deploy/questionnaire-backend
bash rollback.sh
```

## 日常运维

```bash
# 查看容器状态
docker-compose ps

# 查看应用日志
docker logs -f questionnaire-app

# 重启应用（不重建）
docker-compose restart app

# 进入MySQL
docker exec -it questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db
```
