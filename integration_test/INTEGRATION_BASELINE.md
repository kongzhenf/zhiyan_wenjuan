# 集成基线清单 (INTEGRATION_BASELINE.md)

**生成时间**: 2026-05-11  
**项目**: 问卷调查平台  
**技术栈**: Spring Boot 3.2.5 + Vue 3 + Vant (H5)

---

## 1. 模块清单

| 编号 | 模块名称 | 职责 | 技术栈 | 部署方式 |
|------|----------|------|--------|----------|
| MOD-001 | 后端API服务 | 提供RESTful API，业务逻辑处理 | Spring Boot 3.2.5 / Java 17 / JPA | Docker (questionnaire-backend:8080) |
| MOD-002 | 前端管理后台 | 管理员问卷管理/统计/导出 | Vue 3 / Element Plus / Vite | Docker (questionnaire-frontend:80/nginx) |
| MOD-003 | H5移动端 | 受访者问卷填写 | Vue 3 / Vant / Vite | Docker (questionnaire-h5:80/nginx) |
| MOD-004 | MySQL数据库 | 数据持久化 | MySQL 8.0 | Docker (questionnaire-mysql:3306) |
| MOD-005 | Redis缓存 | Token黑名单/速率限制 | Redis 7 Alpine | Docker (questionnaire-redis:6379) |

---

## 2. 接口调用清单

### 2.1 认证模块 (AuthController)

| 编号 | 接口 | 调用方 | 被调方 | 认证 | 说明 |
|------|------|--------|--------|------|------|
| [x] INT-001 | POST /api/auth/login | MOD-002(前端) | MOD-001(后端) | 无 | 管理员登录，返回JWT Token |
| [x] INT-002 | POST /api/auth/refresh | MOD-002(前端) | MOD-001(后端) | 无 | Token刷新 |
| [x] INT-003 | POST /api/auth/logout | MOD-002(前端) | MOD-001(后端) | Bearer Token | 登出（Token加入黑名单） |

### 2.2 问卷管理模块 (QuestionnaireController)

| 编号 | 接口 | 调用方 | 被调方 | 认证 | 说明 |
|------|------|--------|--------|------|------|
| [x] INT-004 | GET /api/questionnaires | MOD-002 | MOD-001 | JWT | 分页查询问卷列表 |
| [x] INT-005 | POST /api/questionnaires | MOD-002 | MOD-001 | JWT | 创建问卷 |
| [x] INT-006 | GET /api/questionnaires/{id} | MOD-002 | MOD-001 | JWT | 获取问卷详情（含题目） |
| [x] INT-007 | PUT /api/questionnaires/{id} | MOD-002 | MOD-001 | JWT | 更新问卷基本信息 |
| [x] INT-008 | DELETE /api/questionnaires/{id} | MOD-002 | MOD-001 | JWT | 删除问卷（两步确认） |
| [x] INT-009 | POST /api/questionnaires/{id}/questions | MOD-002 | MOD-001 | JWT | 添加题目 |
| [x] INT-010 | PUT /api/questionnaires/{id}/questions/{qid} | MOD-002 | MOD-001 | JWT | 更新题目 |
| [x] INT-011 | DELETE /api/questionnaires/{id}/questions/{qid} | MOD-002 | MOD-001 | JWT | 删除题目 |
| [x] INT-012 | PUT /api/questionnaires/{id}/questions/sort | MOD-002 | MOD-001 | JWT | 题目排序 |
| [x] INT-013 | POST /api/questionnaires/{id}/publish | MOD-002 | MOD-001 | JWT | 发布问卷 |
| [x] INT-014 | PUT /api/questionnaires/{id}/close | MOD-002 | MOD-001 | JWT | 关闭问卷 |
| [x] INT-015 | POST /api/questionnaires/{id}/copy | MOD-002 | MOD-001 | JWT | 复制问卷 |
| [x] INT-016 | PUT /api/questionnaires/{id}/draft | MOD-002 | MOD-001 | JWT | 保存草稿 |
| [x] INT-017 | GET /api/questionnaires/{id}/preview | MOD-002 | MOD-001 | JWT | 预览问卷 |
| [x] INT-018 | GET /api/questionnaires/{id}/qrcode | MOD-002 | MOD-001 | JWT | 获取二维码(PNG) |
| [x] INT-019 | GET /api/questionnaires/{id}/link | MOD-002 | MOD-001 | JWT | 获取分享链接 |

### 2.3 问卷填写模块 (FillController)

| 编号 | 接口 | 调用方 | 被调方 | 认证 | 说明 |
|------|------|--------|--------|------|------|
| [x] INT-020 | GET /api/fill/{linkId} | MOD-003(H5) | MOD-001(后端) | 无 | 获取问卷内容（公开） |
| [x] INT-021 | POST /api/fill/{linkId}/submit | MOD-003(H5) | MOD-001(后端) | 无 | 提交答卷（公开） |
| [x] INT-022 | GET /api/fill/{linkId}/status | MOD-003(H5) | MOD-001(后端) | 无 | 检查填写状态（公开） |

### 2.4 统计与导出模块 (StatisticsController)

| 编号 | 接口 | 调用方 | 被调方 | 认证 | 说明 |
|------|------|--------|--------|------|------|
| [x] INT-023 | GET /api/statistics/{id}/overview | MOD-002 | MOD-001 | JWT | 统计概览 |
| [x] INT-024 | GET /api/statistics/{id}/questions | MOD-002 | MOD-001 | JWT | 逐题统计 |
| [x] INT-025 | GET /api/statistics/{id}/questions/{qid}/texts | MOD-002 | MOD-001 | JWT | 文本题答案列表 |
| [x] INT-026 | POST /api/statistics/{id}/export | MOD-002 | MOD-001 | JWT | 触发数据导出 |
| [x] INT-027 | GET /api/statistics/exports/{exportId}/download | MOD-002 | MOD-001 | JWT | 下载导出文件 |
| [x] INT-028 | GET /api/statistics/exports | MOD-002 | MOD-001 | JWT | 导出任务列表 |

---

## 3. 数据流清单

| 编号 | 数据流路径 | 描述 |
|------|------------|------|
| [x] DF-001 | H5→后端→MySQL | 受访者提交答卷：H5 POST /api/fill/{code}/submit → 后端验证 → 写入t_response + t_answer |
| [x] DF-002 | 前端→后端→MySQL | 创建问卷：前端POST /api/questionnaires → 后端生成accessCode → 写入t_questionnaire |
| [x] DF-003 | 前端→后端→MySQL | 添加题目：前端POST /questions → 后端写入t_question + t_question_option |
| [x] DF-004 | 前端→后端→MySQL→前端 | 统计数据：前端GET /statistics → 后端聚合t_answer数据 → 返回统计结果 |
| [x] DF-005 | 前端→后端→文件系统 | 数据导出：POST export → 异步生成xlsx/csv → 写入/app/exports/ → 返回下载链接 |
| [x] DF-006 | 前端→后端→Redis | 登录认证：POST login → 生成JWT → Token黑名单存Redis |
| [x] DF-007 | H5→后端→Redis | 提交速率限制：submit请求 → Redis检查IP频率 → 通过/拒绝 |

---

## 4. 外部依赖清单

| 编号 | 依赖 | 用途 | 集成点 |
|------|------|------|--------|
| [x] EXT-001 | MySQL 8.0 | 数据持久化 | JDBC (Spring Data JPA) |
| [x] EXT-002 | Redis 7 | Token黑名单 + 速率限制 | Spring Data Redis (StringRedisTemplate) |
| [x] EXT-003 | BCrypt | 密码加密验证 | Spring Security BCryptPasswordEncoder |
| [x] EXT-004 | JWT (HMAC-SHA) | 身份认证 | io.jsonwebtoken (jjwt) |
| [x] EXT-005 | EasyExcel (Alibaba) | Excel导出 | 异步文件生成 |
| [x] EXT-006 | QRCode (ZXing) | 二维码生成 | 返回PNG字节流 |

---

## 5. 修复记录

| 时间 | 编号 | 问题描述 | 修复内容 |
|------|------|----------|----------|
| 2026-05-11 | INT-001 | 登录接口返回401001（密码hash不匹配） | 更新init.sql和DB中admin密码hash |
| 2026-05-11 | INT-009 | 添加题目500错误(Hibernate orphanRemoval) | 修改setOptions为getOptions().clear()+addAll() |
| 2026-05-11 | INT-006 | 获取详情500错误(LazyInitializationException) | 添加@Transactional(readOnly=true) |
| 2026-05-11 | INT-020 | 获取问卷500错误(LazyInitializationException) | FillServiceImpl添加@Transactional(readOnly=true) |
| 2026-05-11 | INT-024 | 逐题统计500错误(LazyInitializationException) | StatisticsServiceImpl添加@Transactional(readOnly=true) |
