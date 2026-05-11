# 部署检查清单 (DEPLOY_CHECKLIST)

**项目**: 小型问卷调查平台 - 后端  
**部署方式**: Docker Compose  
**目标服务器**: 10.32.129.153:22 (root)  
**生成时间**: 2026-05-11  
**执行时间**: 2026-05-11 14:30 ~ 14:57 (UTC+8)

---

## 环境检查项

| 编号 | 描述 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| [x] ENV-001 | SSH连接服务器10.32.129.153:22 | 连接成功 | SSH连接成功，输出 SSH_OK | 通过 |
| [x] ENV-002 | 检查磁盘空间 (>2GB可用) | df -h 显示充足空间 | /dev/vda1 40G 总量，23G 可用 (41%使用) | 通过 |
| [x] ENV-003 | 检查Docker版本 | docker version 输出版本号 | Docker 24.0.6 | 通过 |
| [x] ENV-004 | 检查Docker Compose版本(V2优先) | docker compose version 或 docker-compose version | docker compose V2不可用；docker-compose V5.0.2 (V1命令形式) 可用 | 通过 |
| [x] ENV-005 | 检查端口8080占用情况 | 端口可用或可释放 | 已被ticket-system-app占用，改用8082 | 通过(调整) |
| [x] ENV-006 | 检查端口3306占用情况 | 端口可用或可释放 | 已被ai-dev-mysql占用，改用3307 | 通过(调整) |
| [x] ENV-007 | 检查端口6379占用情况 | 端口可用或可释放 | 已被ai-dev-redis占用，改用6381 | 通过(调整) |

## 产物清单

| 编号 | 描述 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| [x] ART-001 | 传输后端编码产物到服务器 /opt/deploy/questionnaire-backend | 全部文件传输完成 | scp传输成功：src/, pom.xml, Dockerfile, .dockerignore, .env.example, db/, docker-compose.yml | 通过 |
| [x] ART-002 | 验证文件完整性 (pom.xml, Dockerfile, docker-compose.yml, db/init.sql, src/) | 关键文件均存在 | ls验证全部文件存在，db/init.sql、src/main 目录结构完整 | 通过 |

## 数据库准备

| 编号 | 描述 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| [x] DB-001 | MySQL通过Docker Compose启动 | docker-compose.yml中mysql服务配置正确 | questionnaire-mysql容器启动，状态healthy | 通过 |
| [x] DB-002 | 数据库questionnaire_db自动创建 | MYSQL_DATABASE环境变量 + init.sql CREATE DATABASE | 数据库自动创建成功 | 通过 |
| [x] DB-003 | init.sql自动执行(挂载到docker-entrypoint-initdb.d) | 表结构和种子数据导入成功 | 7张表全部创建成功：t_admin, t_answer, t_export_task, t_question, t_question_option, t_questionnaire, t_response | 通过 |
| [x] DB-004 | 应用数据源配置正确连接mysql容器 | SPRING_DATASOURCE_URL指向mysql:3306 | 初次启动因characterEncoding=utf8mb4报错，修正为UTF-8后连接成功 | 通过(修复) |

## 构建步骤

| 编号 | 描述 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| [x] BUILD-001 | Docker多阶段构建(maven:3.9+temurin-17) | docker compose build 成功 | Successfully built 14e81a946480, 镜像 questionnaire-backend-app:latest | 通过 |
| [x] BUILD-002 | Spring Boot应用JAR打包 | target/*.jar 生成 | Maven package成功，app.jar复制到最终镜像 | 通过 |

## 部署步骤

| 编号 | 描述 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| [x] DEPLOY-001 | 创建.env配置文件 | 包含MYSQL_PASSWORD, JWT_SECRET等 | .env创建成功，含MYSQL_PASSWORD, JWT_SECRET, H5_BASE_URL | 通过 |
| [x] DEPLOY-002 | 停止旧容器(如存在) | docker-compose down 成功或无旧容器 | 无旧容器，down命令正常完成 | 通过 |
| [x] DEPLOY-003 | 启动全部服务 docker-compose up -d --build | mysql, redis, app三个容器启动 | 三个容器全部启动成功 | 通过 |
| [x] DEPLOY-004 | 等待MySQL健康检查通过 | mysql容器状态healthy | questionnaire-mysql状态healthy | 通过 |
| [x] DEPLOY-005 | 等待应用启动完成 | app容器状态running | Started QuestionnaireApplication in 9.011 seconds | 通过 |

## 验证项

| 编号 | 描述 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| [x] VERIFY-001 | 检查三个容器运行状态 | mysql/redis/app均为Up | questionnaire-mysql(healthy), questionnaire-redis(Up), questionnaire-app(Up) | 通过 |
| [x] VERIFY-002 | 检查应用启动日志无数据库连接错误 | 无异常堆栈 | Tomcat started on port 8080, Started QuestionnaireApplication in 9.011s，无报错 | 通过 |
| [x] VERIFY-003 | 健康检查: curl http://localhost:8082 | HTTP响应(非connection refused) | POST /api/auth/login 返回 HTTP 200 + JWT token (响应时间 0.019s) | 通过 |
| [x] VERIFY-004 | 数据库表验证: 7张表已创建 | SHOW TABLES 显示7张表 | 确认7张表：t_admin, t_answer, t_export_task, t_question, t_question_option, t_questionnaire, t_response | 通过 |
| [x] VERIFY-005 | 管理员账号存在验证 | t_admin有admin记录 | id=1, username=admin 存在，登录返回JWT成功 | 通过 |

---

## 部署验收（阶段C）

- **清单完成度**: 21/21 全部完成 (100%)
- **环境验证**: ENV-001 ~ ENV-007 全部通过（其中 ENV-005/006/007 因端口冲突调整为备用端口）
- **服务验证**: VERIFY-001 ~ VERIFY-005 全部通过
- **失败项汇总**: 
  - DB-004 初次启动因 `characterEncoding=utf8mb4` 不被 MySQL JDBC 8.3.0 支持，修正为 `characterEncoding=UTF-8` 后解决
- **部署结论**: **成功** — 全部 21 项检查清单均已通过，后端 API 服务正常运行，数据库初始化完成，管理员账号可正常登录
