# 冒烟测试验证与修复记录 (SMOKE_TEST_FIXES.md)

**执行时间**: 2026-05-11  
**执行环境**: Docker Compose 容器集群（2052921194065797121_default 网络）

---

## 1. 服务存活性验证结果

| 服务名 | 容器名 | 访问地址 | 验证方式 | 状态码/结果 | 判定 |
|--------|--------|----------|----------|-------------|------|
| MySQL 8.0 | questionnaire-mysql | localhost:3308 | `mysqladmin ping` / `SELECT 1` | healthy (Up 39h) | ✅ 通过 |
| Redis 7 | questionnaire-redis | localhost:6382 | `redis-cli ping` | PONG (healthy) | ✅ 通过 |
| 后端 API | questionnaire-backend | backend:8080 (容器内) | POST /api/auth/login | 200 JSON响应 | ✅ 通过 |
| 前端管理后台 | questionnaire-frontend | frontend:80 (容器内) | GET / | HTTP 200 | ✅ 通过 |
| H5 移动端 | questionnaire-h5 | h5:80 (容器内) | GET / | HTTP 200 | ✅ 通过 |

**结论**: 所有5个服务均正常运行，容器健康检查通过。

---

## 2. Mock 数据检测结果

### 前端管理后台 (code/前端)
- **检测方法**: 全文搜索 `mock/Mock/MOCK/faker/Faker/mockData/fakeData/dummyData`
- **结果**: **未发现任何 Mock 数据残留**
- 所有API调用均通过 `src/api/` 目录下的service文件发起真实HTTP请求
- 无 mockjs、msw、json-server 相关依赖

### H5 移动端 (code/H5)
- **检测方法**: 全文搜索 mock 相关特征
- **结果**: **未发现任何 Mock 数据残留**
- 所有API调用集中在 `src/stores/survey.ts`，通过 axios 实例发起真实请求
- package.json 中无 mock 相关依赖

---

## 3. 前后端 API 路径交叉比对

### 前端 API 基础地址配置
- **Vite dev proxy**: `/api` → `http://localhost:8080` (路径保留)
- **Nginx prod proxy**: `/api/` → `http://backend:8080/api/` (路径保留)
- **baseURL**: `import.meta.env.VITE_API_BASE_URL || '/api'`

### API 路径一致性验证

| 前端路径 | 后端路径 | 一致性 | 备注 |
|----------|----------|--------|------|
| POST `/auth/login` | POST `/api/auth/login` | ✅ | 前端baseURL=/api，拼接后一致 |
| POST `/auth/refresh` | POST `/api/auth/refresh` | ✅ | |
| POST `/auth/logout` | POST `/api/auth/logout` | ✅ | |
| GET `/questionnaires` | GET `/api/questionnaires` | ✅ | |
| POST `/questionnaires` | POST `/api/questionnaires` | ✅ | |
| GET `/questionnaires/:id` | GET `/api/questionnaires/{id}` | ✅ | |
| PUT `/questionnaires/:id` | PUT `/api/questionnaires/{id}` | ✅ | |
| DELETE `/questionnaires/:id` | DELETE `/api/questionnaires/{id}` | ✅ | |
| POST `/questionnaires/:id/questions` | POST `/api/questionnaires/{id}/questions` | ✅ | |
| PUT `/questionnaires/:id/questions/:qid` | PUT `/api/questionnaires/{id}/questions/{qid}` | ✅ | |
| DELETE `/questionnaires/:id/questions/:qid` | DELETE `/api/questionnaires/{id}/questions/{qid}` | ✅ | |
| PUT `/questionnaires/:id/questions/sort` | PUT `/api/questionnaires/{id}/questions/sort` | ✅ | |
| POST `/questionnaires/:id/publish` | POST `/api/questionnaires/{id}/publish` | ✅ | |
| PUT `/questionnaires/:id/close` | PUT `/api/questionnaires/{id}/close` | ✅ | |
| POST `/questionnaires/:id/copy` | POST `/api/questionnaires/{id}/copy` | ✅ | |
| PUT `/questionnaires/:id/draft` | PUT `/api/questionnaires/{id}/draft` | ✅ | |
| GET `/questionnaires/:id/preview` | GET `/api/questionnaires/{id}/preview` | ✅ | |
| GET `/questionnaires/:id/link` | GET `/api/questionnaires/{id}/link` | ✅ | |
| GET `/questionnaires/:id/qrcode` | GET `/api/questionnaires/{id}/qrcode` | ✅ | |
| GET `/statistics/:id/overview` | GET `/api/statistics/{id}/overview` | ✅ | |
| GET `/statistics/:id/questions` | GET `/api/statistics/{id}/questions` | ✅ | |
| GET `/statistics/:id/questions/:qid/texts` | GET `/api/statistics/{id}/questions/{qid}/texts` | ✅ | |
| POST `/statistics/:id/export` | POST `/api/statistics/{id}/export` | ✅ | |
| GET `/statistics/exports` | GET `/api/statistics/exports` | ✅ | |
| GET `/statistics/exports/:id/download` | GET `/api/statistics/exports/{id}/download` | ✅ | |
| GET `/fill/:linkId` | GET `/api/fill/{linkId}` | ✅ | |
| POST `/fill/:linkId/submit` | POST `/api/fill/{linkId}/submit` | ✅ | |
| GET `/fill/:linkId/status` | GET `/api/fill/{linkId}/status` | ✅ | |

**结论**: 前后端所有28个API路径完全一致，无路径不匹配问题。

---

## 4. 后端接口完整性检查

所有Controller方法均有完整的业务逻辑实现，无空壳接口。具体验证：
- AuthController: 登录/刷新/登出 → 有完整的BCrypt验证、JWT生成逻辑
- QuestionnaireController: CRUD + 生命周期管理 → 有完整的实现
- FillController: 问卷获取/提交/状态检查 → 有完整的实现
- StatisticsController: 统计/导出 → 有完整的实现（含EasyExcel异步导出）

---

## 5. 登录链路冒烟结果

| 步骤 | 请求 | 结果 | 判定 |
|------|------|------|------|
| 初次登录(admin/admin123) | POST /api/auth/login | `{"success":false,"code":401001,"message":"用户名或密码错误"}` | ❌ 失败 |
| 根因分析 | 检查BCrypt hash | init.sql中hash不对应admin123 | 已定位 |
| 修复密码hash | UPDATE t_admin SET password=... | 更新为admin123对应的BCrypt hash | 已修复 |
| 修复后登录 | POST /api/auth/login | `{"success":true,...,"accessToken":"eyJ..."}` | ✅ 通过 |

---

## 6. 端到端冒烟结果

| 链路 | 步骤 | 结果 | 判定 |
|------|------|------|------|
| 登录→获取Token | POST /api/auth/login | 返回accessToken+refreshToken | ✅ |
| Token→问卷列表 | GET /api/questionnaires (Bearer token) | 返回空列表（正常） | ✅ |
| 创建问卷 | POST /api/questionnaires | 返回新问卷ID | ✅ |
| 添加题目 | POST /api/questionnaires/{id}/questions | 首次失败(Hibernate bug)→修复后成功 | ✅(修复后) |
| 发布问卷 | POST /api/questionnaires/{id}/publish | 返回accessCode和状态active | ✅ |
| H5获取问卷 | GET /api/fill/{accessCode} | 返回问卷+题目完整数据 | ✅(修复后) |
| H5提交答卷 | POST /api/fill/{accessCode}/submit | 返回responseId | ✅ |
| 统计概览 | GET /api/statistics/{id}/overview | 返回totalResponses=1 | ✅ |
| 题目统计 | GET /api/statistics/{id}/questions | 首次失败(LazyInit)→修复后成功 | ✅(修复后) |
| 填写状态 | GET /api/fill/{code}/status?deviceId=... | 返回fillable:true | ✅ |
| 前端→后端代理 | 从frontend容器请求backend:8080 | 正常响应 | ✅ |
| H5→后端代理 | 从h5容器请求backend:8080 | 正常响应 | ✅ |

---

## 7. 本阶段代码修复明细

### 修复 1: BCrypt 密码 Hash 不匹配

| 项目 | 内容 |
|------|------|
| **问题** | init.sql中admin用户密码BCrypt hash不对应"admin123" |
| **根因** | 初始化SQL中使用了一个示例hash值，与实际密码不匹配 |
| **修复文件** | `code/后端/db/init.sql` |
| **修复内容** | 将password字段hash替换为 `$2a$10$ouxXvG.IFt6c66Vv7tC8hevbQiU0tf4uEbCsQ3DBjYwC2KF3oNFzy`（对应明文admin123） |
| **数据库** | 同步UPDATE t_admin表中的password字段 |

### 修复 2: Hibernate orphanRemoval 集合替换错误

| 项目 | 内容 |
|------|------|
| **问题** | `addQuestion`和`updateQuestion`方法中使用`question.setOptions(savedOptions)`替换了被Hibernate管理的集合引用，导致`HibernateException: A collection with cascade="all-delete-orphan" was no longer referenced` |
| **根因** | Lombok `@Data`生成的setter直接替换了集合引用，Hibernate要求只能修改不能替换有orphanRemoval标记的集合 |
| **修复文件** | `code/后端/src/main/java/com/questionnaire/service/impl/QuestionnaireServiceImpl.java` |
| **修复内容** | 将2处`question.setOptions(savedOptions)`替换为`question.getOptions().clear(); question.getOptions().addAll(savedOptions);` |

### 修复 3: LazyInitializationException (事务外懒加载)

| 项目 | 内容 |
|------|------|
| **问题** | `getDetail`、`preview`、`getQuestionStatistics`等读取方法未添加`@Transactional`，导致在构建响应时访问`Question.options`懒加载集合时Session已关闭 |
| **根因** | 这些方法缺少事务注解，JPA Session在方法调用后立即关闭，但`buildQuestionMap`方法尝试访问未初始化的懒加载代理 |
| **修复文件** | `code/后端/src/main/java/com/questionnaire/service/impl/QuestionnaireServiceImpl.java`、`code/后端/src/main/java/com/questionnaire/service/impl/FillServiceImpl.java`、`code/后端/src/main/java/com/questionnaire/service/impl/StatisticsServiceImpl.java` |
| **修复内容** | 为以下方法添加`@Transactional(readOnly = true)`: `list()`, `getDetail()`, `preview()`, `getQuestionnaire()`, `checkStatus()`, `getOverview()`, `getQuestionStatistics()`, `getTextAnswers()` |
| **额外防护** | 在`buildQuestionMap`中增加try-catch，若懒加载仍然失败则回退到直接查询 |
