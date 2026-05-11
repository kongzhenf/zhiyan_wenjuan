# API 接口审查报告 (C2)

**审查日期**: 2026-05-09  
**审查范围**: 设计文档第4章全部API接口 vs 前端 `src/api/` 目录实现  
**baseURL配置**: `request.ts` 中 `baseURL = '/api'`，所有相对路径自动拼接 `/api` 前缀

---

## 4.1 认证模块接口

| API编号 | 设计文档定义 | 代码实际实现 | 是否一致 | 差异描述 |
|---------|-------------|-------------|---------|---------|
| 4.1-1 | POST `/api/auth/login` Body: {username, password} | `request.post('/auth/login', params)` params={username, password} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.1-2 | POST `/api/auth/refresh` Body: {refreshToken} | `request.post('/auth/refresh', { refreshToken })` | ✅ 是 | 方法、路径、参数完全一致 |
| 4.1-3 | POST `/api/auth/logout` Body: {} 需鉴权 | `request.post('/auth/logout', {})` | ✅ 是 | 方法、路径、参数完全一致 |

---

## 4.2 问卷管理模块接口

| API编号 | 设计文档定义 | 代码实际实现 | 是否一致 | 差异描述 |
|---------|-------------|-------------|---------|---------|
| 4.2-1 | GET `/api/questionnaires` Query: {page, pageSize, status, keyword, sortBy, sortOrder} | `request.get('/questionnaires', { params })` params={page, pageSize, status, keyword, sortBy, sortOrder} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-2 | POST `/api/questionnaires` Body: {title, description} | `request.post('/questionnaires', data)` data={title, description?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-3 | GET `/api/questionnaires/{id}` Path: {id} | `request.get('/questionnaires/${id}')` | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-4 | PUT `/api/questionnaires/{id}` Body: {title?, description?} | `request.put('/questionnaires/${id}', data)` data={title?, description?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-5 | DELETE `/api/questionnaires/{id}` Query: {confirm?} | `request.delete('/questionnaires/${id}', { params: { confirm } })` | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-6 | POST `/api/questionnaires/{id}/questions` Body: {type, title, required?, options?, config?} | `request.post('/questionnaires/${id}/questions', data)` data={type, title, required?, options?, config?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-7 | PUT `/api/questionnaires/{id}/questions/{qid}` Body: {title?, required?, options?, config?} | `request.put('/questionnaires/${id}/questions/${qid}', data)` data={title?, required?, options?, config?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-8 | DELETE `/api/questionnaires/{id}/questions/{qid}` | `request.delete('/questionnaires/${id}/questions/${qid}')` | ✅ 是 | 方法、路径完全一致 |
| 4.2-9 | PUT `/api/questionnaires/{id}/questions/sort` Body: {questionIds} | `request.put('/questionnaires/${id}/questions/sort', { questionIds })` | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-10 | POST `/api/questionnaires/{id}/publish` Body: {deadline?, maxResponses?, allowDuplicateDevice?} | `request.post('/questionnaires/${id}/publish', config)` config={deadline?, maxResponses?, allowDuplicateDevice?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-11 | PUT `/api/questionnaires/{id}/close` Body: {} | `request.put('/questionnaires/${id}/close', {})` | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-12 | POST `/api/questionnaires/{id}/copy` Body: {} | `request.post('/questionnaires/${id}/copy', {})` | ✅ 是 | 方法、路径、参数完全一致 |
| 4.2-13 | PUT `/api/questionnaires/{id}/draft` Body: {title?, description?, questions?} | `request.put('/questionnaires/${id}/draft', data)` data=any | ✅ 是 | 方法、路径一致；参数类型为any但业务逻辑符合设计 |
| 4.2-14 | GET `/api/questionnaires/{id}/preview` | `request.get('/questionnaires/${id}/preview')` | ✅ 是 | 方法、路径完全一致 |
| 4.2-15 | GET `/api/questionnaires/{id}/qrcode` Query: {size?, format?} | URL直接拼接: `${baseURL}/questionnaires/${id}/qrcode` （未传Query参数size/format） | ⚠️ 部分一致 | 路径一致，HTTP方法一致（浏览器GET请求），但代码未传递设计文档中定义的可选Query参数 size 和 format。注意：此为URL构造函数（用于img src），调用方可自行拼接参数，非严格不一致 |
| 4.2-16 | GET `/api/questionnaires/{id}/link` | `request.get('/questionnaires/${id}/link')` | ✅ 是 | 方法、路径完全一致 |

---

## 4.3 问卷填写模块接口（H5端）

| API编号 | 设计文档定义 | 代码实际实现 | 是否一致 | 差异描述 |
|---------|-------------|-------------|---------|---------|
| 4.3-1 | GET `/api/fill/{linkId}` 获取问卷内容 | **未找到实现** | ❌ 否 | 前端 `src/api/` 目录中无任何文件实现此接口。缺少 H5 填写模块的 API 封装 |
| 4.3-2 | POST `/api/fill/{linkId}/submit` Body: {deviceId, answers, submitTime?, duration?} | **未找到实现** | ❌ 否 | 前端 `src/api/` 目录中无任何文件实现此接口。缺少提交答卷的 API 封装 |
| 4.3-3 | GET `/api/fill/{linkId}/status` Query: {deviceId} | **未找到实现** | ❌ 否 | 前端 `src/api/` 目录中无任何文件实现此接口。缺少检查问卷状态的 API 封装 |

---

## 4.4 数据统计模块接口

| API编号 | 设计文档定义 | 代码实际实现 | 是否一致 | 差异描述 |
|---------|-------------|-------------|---------|---------|
| 4.4-1 | GET `/api/statistics/{questionnaireId}/overview` Query: {startDate?, endDate?} | `request.get('/statistics/${questionnaireId}/overview', { params })` params={startDate?, endDate?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.4-2 | GET `/api/statistics/{questionnaireId}/questions` Query: {startDate?, endDate?} | `request.get('/statistics/${questionnaireId}/questions', { params })` params={startDate?, endDate?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.4-3 | GET `/api/statistics/{questionnaireId}/questions/{qid}/texts` Query: {page?, pageSize?, keyword?, startDate?, endDate?} | `request.get('/statistics/${questionnaireId}/questions/${qid}/texts', { params })` params={page?, pageSize?, keyword?, startDate?, endDate?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.4-4 | POST `/api/statistics/{questionnaireId}/export` Body: {format, startDate?, endDate?} | `request.post('/statistics/${questionnaireId}/export', data)` data={format, startDate?, endDate?} | ✅ 是 | 方法、路径、参数完全一致 |
| 4.4-5 | GET `/api/statistics/exports/{exportId}/download` | URL直接拼接: `${baseURL}/statistics/exports/${exportId}/download` | ✅ 是 | 路径一致，HTTP方法一致（浏览器GET下载） |
| 4.4-6 | GET `/api/statistics/exports` Query: {page?, pageSize?, status?, questionnaireId?} | `request.get('/statistics/exports', { params })` params={page?, pageSize?, status?, questionnaireId?} | ✅ 是 | 方法、路径、参数完全一致 |

---

## 审查汇总

| 模块 | 接口总数 | 一致 | 部分一致 | 不一致 |
|------|---------|------|---------|--------|
| 4.1 认证模块 | 3 | 3 | 0 | 0 |
| 4.2 问卷管理模块 | 16 | 15 | 1 | 0 |
| 4.3 问卷填写模块（H5） | 3 | 0 | 0 | 3 |
| 4.4 数据统计模块 | 6 | 6 | 0 | 0 |
| **合计** | **28** | **24** | **1** | **3** |

---

## 主要问题

### 问题1（严重）：H5问卷填写模块API完全缺失

设计文档4.3节定义了3个H5端填写接口（获取问卷内容、提交答卷、检查状态），但在前端 `src/api/` 目录下没有对应的实现文件（如 `fill.ts` 或 `survey.ts`）。

**影响的需求编号**: FR-001, FR-002, FR-003, FR-012

**建议**: 新建 `src/api/fill.ts` 文件，实现以下三个API封装：
- `getQuestionnaireByLink(linkId: string)` → GET `/fill/{linkId}`
- `submitAnswers(linkId: string, data: SubmitData)` → POST `/fill/{linkId}/submit`
- `checkFillStatus(linkId: string, deviceId: string)` → GET `/fill/{linkId}/status?deviceId=xxx`

### 问题2（轻微）：二维码URL构造未传递可选参数

`getQrcodeUrl` 仅构造基础URL，未提供 `size` 和 `format` 参数的传递能力。作为URL构造函数（用于 `<img src>` 等场景），调用方可自行拼接，但不如提供完整参数签名规范。

---

## 结论：❌ FAIL

存在3个设计文档定义的接口在代码中完全缺失实现（H5填写模块），不满足设计文档与代码一致性要求。
