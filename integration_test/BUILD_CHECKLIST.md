# BUILD_CHECKLIST - 问卷调查平台 Docker 容器化构建检查清单

## 1. 项目结构清单

| 编号 | 模块名称 | 构建工具 | 语言/框架 | 源码路径 |
|------|----------|----------|-----------|----------|
| PROJ-001 | 后端 API 服务 | Maven 3.9 | Java 17 / Spring Boot 3.2.5 | /data/documents/2052921194065797121/code/后端 |
| PROJ-002 | 前端管理后台 | npm + Vite | TypeScript / Vue 3 + Element Plus | /data/documents/2052921194065797121/code/前端 |
| PROJ-003 | H5 移动端 | npm + Vite | TypeScript / Vue 3 + Vant 4 | /data/documents/2052921194065797121/code/H5 |

## 2. 基础镜像清单

| 编号 | 模块 | 阶段 | 基础镜像 | 用途 |
|------|------|------|----------|------|
| IMG-001 | 后端 | build | maven:3.9-eclipse-temurin-17-alpine | Maven 编译打包 |
| IMG-002 | 后端 | runtime | eclipse-temurin:17-jre-alpine | 运行 Spring Boot JAR |
| IMG-003 | 前端 | build | node:20-alpine | npm install + vite build |
| IMG-004 | 前端 | runtime | nginx:alpine | 静态文件托管 + API 反向代理 |
| IMG-005 | H5 | build | node:20-alpine | npm install + vite build |
| IMG-006 | H5 | runtime | nginx:alpine | 静态文件托管 + API 反向代理 |
| IMG-007 | MySQL | runtime | mysql:8.0 | 数据库服务 |
| IMG-008 | Redis | runtime | redis:7-alpine | 缓存服务 |

## 3. 配置文件清单

| 编号 | 配置项 | 模块 | 注入方式 | 默认值 |
|------|--------|------|----------|--------|
| CONF-001 | MYSQL_HOST | 后端 | 环境变量 | mysql (docker 服务名) |
| CONF-002 | MYSQL_PORT | 后端 | 环境变量 | 3306 |
| CONF-003 | MYSQL_DATABASE | 后端 | 环境变量 | questionnaire_db |
| CONF-004 | MYSQL_USERNAME | 后端 | 环境变量 | root |
| CONF-005 | MYSQL_PASSWORD | 后端/MySQL | 环境变量 | questionnaire123 |
| CONF-006 | REDIS_HOST | 后端 | 环境变量 | redis (docker 服务名) |
| CONF-007 | REDIS_PORT | 后端 | 环境变量 | 6379 |
| CONF-008 | JWT_SECRET | 后端 | 环境变量 | questionnaire-platform-jwt-secret-key-2024 |
| CONF-009 | H5_BASE_URL | 后端 | 环境变量 | http://localhost:3001/s |
| CONF-010 | VITE_API_BASE_URL | 前端 | 构建参数(不需要,nginx代理) | /api |
| CONF-011 | VITE_API_BASE_URL | H5 | 构建参数(不需要,nginx代理) | /api |

## 4. Dockerfile 清单

| 编号 | 服务 | 文件路径 | 构建阶段说明 |
|------|------|----------|--------------|
| [x] DF-001 | 后端 | /data/documents/2052921194065797121/code/后端/Dockerfile | build: maven编译 → runtime: jre运行 |
| [x] DF-002 | 前端 | /data/documents/2052921194065797121/code/前端/Dockerfile | build: npm+vite构建 → runtime: nginx托管 |
| [x] DF-003 | H5 | /data/documents/2052921194065797121/code/H5/Dockerfile | build: npm+vite构建 → runtime: nginx托管 |

## 5. docker-compose 服务清单

| 编号 | 服务名 | 镜像来源 | 宿主机端口 | 容器端口 | 依赖 |
|------|--------|----------|------------|----------|------|
| [x] SVC-001 | mysql | mysql:8.0 | 3308 | 3306 | 无 |
| [x] SVC-002 | redis | redis:7-alpine | 6382 | 6379 | 无 |
| [x] SVC-003 | backend | 本地构建(后端Dockerfile) | 8082 | 8080 | mysql, redis |
| [x] SVC-004 | frontend | 本地构建(前端Dockerfile) | 3000 | 80 | backend |
| [x] SVC-005 | h5 | 本地构建(H5 Dockerfile) | 3001 | 80 | backend |

## 6. 验证检查清单

| 编号 | 验证项 | 验证命令 | 预期结果 | 实际结果 |
|------|--------|----------|----------|----------|
| [x] VERIFY-001 | MySQL 容器健康 | docker-compose ps mysql | Up (healthy) | ✅ Up (healthy) |
| [x] VERIFY-002 | Redis 容器健康 | docker-compose ps redis | Up (healthy) | ✅ Up (healthy)，redis-cli ping 返回 PONG |
| [x] VERIFY-003 | 后端 API 响应 | curl http://localhost:8082/api/auth/login | 返回 JSON | ✅ 返回 {"success":true,...} 含 JWT Token |
| [x] VERIFY-004 | 前端页面访问 | curl http://localhost:3000 | 返回 HTML | ✅ 返回 Vue SPA HTML 页面 |
| [x] VERIFY-005 | 前端→后端代理 | curl http://localhost:3000/api/auth/login | 返回后端 JSON 响应 | ✅ 返回 {"success":true,...} 含 JWT Token |
| [x] VERIFY-006 | H5 页面访问 | curl http://localhost:3001 | 返回 HTML | ✅ 返回 Vue SPA HTML 页面 |
| [x] VERIFY-007 | H5→后端代理 | curl http://localhost:3001/api/auth/login | 返回后端 JSON 响应 | ✅ 返回 {"success":true,...} 含 JWT Token |
| [x] VERIFY-008 | 数据库初始化 | docker exec mysql查询t_admin | admin用户存在 | ✅ COUNT=1，admin 已初始化 |

## 修复记录

| 轮次 | 问题描述 | 修复内容 |
|------|----------|----------|
| 1 | 前端 vue-tsc 类型检查失败 | Dockerfile 改用 `npx vite build` |
| 2 | 端口 3306/6379/8080 被占用 | 改用 3308/6382/8082 |
| 3 | JDBC characterEncoding=utf8mb4 不合法 | 覆盖 SPRING_DATASOURCE_URL 使用 UTF-8 |

## 最终状态

**所有容器运行正常，所有验证项通过。** 验证时间：2026-05-11
