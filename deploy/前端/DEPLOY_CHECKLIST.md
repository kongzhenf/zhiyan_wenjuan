# 前端部署检查清单（DEPLOY_CHECKLIST）

## 环境检查项
- [x] ENV-001 SSH连接测试 | 实际结果：SSH_OK, 主机名 zsj-uop-dev-4
- [x] ENV-002 磁盘空间检查 (≥5G可用) | 实际结果：22G可用, 44%使用
- [x] ENV-003 Docker版本检查 | 实际结果：Docker 24.0.6
- [x] ENV-004 Docker Compose版本检查 | 实际结果：Docker Compose v5.0.2 (docker-compose V1命令可用)
- [x] ENV-005 前端端口3002可用性检查 | 实际结果：端口3002可用（80/3000已被其他项目占用）
- [x] ENV-006 H5端口3003可用性检查 | 实际结果：端口3003可用

## 后端服务验证
- [x] BACKEND-001 后端API健康检查 (POST /api/auth/login) | 实际结果：HTTP 200, 返回JWT token
- [x] BACKEND-002 后端访问地址确认 | 实际结果：10.32.129.153:8082 (容器内8080→宿主机8082)

## API地址配置
- [x] APICONF-001 前端nginx.conf proxy_pass配置为后端实际地址 | 实际结果：proxy_pass http://10.32.129.153:8082/api/ (已修改)
- [x] APICONF-002 H5 nginx.conf proxy_pass配置为后端实际地址 | 实际结果：proxy_pass http://10.32.129.153:8082/api/ (已修改)
- [x] APICONF-003 前端代码 baseURL 降级为 /api | 实际结果：.dockerignore排除.env，代码fallback到'/api'，nginx代理模式
- [x] APICONF-004 H5代码 baseURL 降级为 /api | 实际结果：.dockerignore排除.env，代码fallback到'/api'，nginx代理模式
- [x] APICONF-005 前端.env配置 VITE_H5_BASE_URL=http://10.32.129.153:3003 | 实际结果：已创建（注：代码中未引用此变量，不影响运行）

## 产物清单
- [x] ART-001 前端编码产物传输到服务器 /opt/deploy/questionnaire-frontend/frontend | 实际结果：scp传输成功
- [x] ART-002 H5编码产物传输到服务器 /opt/deploy/questionnaire-frontend/h5 | 实际结果：scp传输成功
- [x] ART-003 前端产物验证（关键文件存在） | 实际结果：package.json, Dockerfile, nginx.conf, src/ 均存在
- [x] ART-004 H5产物验证（关键文件存在） | 实际结果：package.json, Dockerfile, nginx.conf, src/ 均存在

## 构建步骤
- [x] BUILD-001 前端Docker镜像构建 | 实际结果：questionnaire-frontend-questionnaire-frontend:latest 构建成功, Vite build 12.46s, 27个chunk
- [x] BUILD-002 H5 Docker镜像构建 | 实际结果：questionnaire-frontend-questionnaire-h5:latest 构建成功, Vite build 3.77s, 7个chunk

## 部署步骤
- [x] DEPLOY-001 停止旧前端容器（如有） | 实际结果：无旧容器
- [x] DEPLOY-002 停止旧H5容器（如有） | 实际结果：无旧容器
- [x] DEPLOY-003 创建docker-compose.yml编排文件 | 实际结果：文件创建成功, 包含前端(3002)和H5(3003)两个服务
- [x] DEPLOY-004 启动前端+H5容器 | 实际结果：docker-compose up -d --build 成功, 两容器启动

## 验证项
- [x] VERIFY-001 前端容器状态检查 | 实际结果：questionnaire-frontend Up, 0.0.0.0:3002->80/tcp
- [x] VERIFY-002 H5容器状态检查 | 实际结果：questionnaire-h5 Up, 0.0.0.0:3003->80/tcp
- [x] VERIFY-003 前端页面可达 (curl http://10.32.129.153:3002/) | 实际结果：HTTP 200
- [x] VERIFY-004 H5页面可达 (curl http://10.32.129.153:3003/) | 实际结果：HTTP 200
- [x] VERIFY-005 前端nginx代理后端API (curl http://10.32.129.153:3002/api/auth/login) | 实际结果：HTTP 200, 返回JWT token, 响应0.098s
- [x] VERIFY-006 H5 nginx代理后端API (curl http://10.32.129.153:3003/api/auth/login) | 实际结果：HTTP 200, 返回JWT token, 响应0.097s

## 部署验收（阶段C）

### 1. 清单完成度
- 总计 28 项检查，全部标记为 [x]
- 未完成项：无
- 失败项：无

### 2. 环境验证
- ENV-001 ~ ENV-006：全部通过
- 端口调整说明：默认端口 80/3000 被 ticket-system-frontend / meeting-reservation-frontend 占用，调整为 3002/3003

### 3. 服务验证
- VERIFY-001 ~ VERIFY-006：全部通过
- 前端 Admin 页面正常加载
- H5 移动端页面正常加载
- 两端 nginx 反向代理均正常转发 API 请求到后端

### 4. 后端连通性验证
- 前端端口 3002 → nginx → 10.32.129.153:8082 → 后端 API：HTTP 200 ✅
- H5 端口 3003 → nginx → 10.32.129.153:8082 → 后端 API：HTTP 200 ✅

### 5. 失败项汇总
无失败项

### 6. 部署结论
**成功** — 28/28 项全部通过
