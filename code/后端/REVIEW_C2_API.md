# API 接口审查报告 (REVIEW_C2_API)

**审查日期**: 2026-05-09  
**审查范围**: 设计文档第4章 API 接口 vs 后端 Controller 代码实现  
**审查标准**: HTTP方法、URL路径、必填请求参数名是否一致

---

## 审查结果

| API编号 | 设计文档定义 | 代码实际实现 | 是否一致 | 差异描述 |
|---------|-------------|-------------|---------|---------|
| 4.1-1 | POST `/api/auth/login` 参数: username, password | POST `/api/auth/login` 参数: username, password | ✅ 一致 | 无差异 |
| 4.1-2 | POST `/api/auth/refresh` 参数: refreshToken | POST `/api/auth/refresh` 参数: refreshToken | ✅ 一致 | 无差异 |
| 4.1-3 | POST `/api/auth/logout` 无请求体 | POST `/api/auth/logout` 无请求体 | ✅ 一致 | 无差异 |
| 4.2-1 | GET `/api/questionnaires` Query: page, pageSize, status, keyword, sortBy, sortOrder | GET `/api/questionnaires` Query: page, pageSize, status, keyword, sortBy, sortOrder | ✅ 一致 | 无差异 |
| 4.2-2 | POST `/api/questionnaires` Body: title(必填), description | POST `/api/questionnaires` Body: title, description | ✅ 一致 | 无差异 |
| 4.2-3 | GET `/api/questionnaires/{id}` Path: id | GET `/api/questionnaires/{id}` Path: id | ✅ 一致 | 无差异 |
| 4.2-4 | PUT `/api/questionnaires/{id}` Body: title, description | PUT `/api/questionnaires/{id}` Body: title, description | ✅ 一致 | 无差异 |
| 4.2-5 | DELETE `/api/questionnaires/{id}` Query: confirm | DELETE `/api/questionnaires/{id}` Query: confirm | ✅ 一致 | 无差异 |
| 4.2-6 | POST `/api/questionnaires/{id}/questions` Body: type, title, required, options, config | POST `/api/questionnaires/{id}/questions` Body: type, title, required, options, config | ✅ 一致 | 无差异 |
| 4.2-7 | PUT `/api/questionnaires/{id}/questions/{qid}` Body: title, required, options, config | PUT `/api/questionnaires/{id}/questions/{qid}` Body: title, required, options, config | ✅ 一致 | 无差异 |
| 4.2-8 | DELETE `/api/questionnaires/{id}/questions/{qid}` | DELETE `/api/questionnaires/{id}/questions/{qid}` | ✅ 一致 | 无差异 |
| 4.2-9 | PUT `/api/questionnaires/{id}/questions/sort` Body: questionIds | PUT `/api/questionnaires/{id}/questions/sort` Body: questionIds | ✅ 一致 | 无差异 |
| 4.2-10 | POST `/api/questionnaires/{id}/publish` Body: deadline, maxResponses, allowDuplicateDevice | POST `/api/questionnaires/{id}/publish` Body: deadline, maxResponses, allowDuplicateDevice | ✅ 一致 | 无差异 |
| 4.2-11 | PUT `/api/questionnaires/{id}/close` | PUT `/api/questionnaires/{id}/close` | ✅ 一致 | 无差异 |
| 4.2-12 | POST `/api/questionnaires/{id}/copy` | POST `/api/questionnaires/{id}/copy` | ✅ 一致 | 无差异 |
| 4.2-13 | PUT `/api/questionnaires/{id}/draft` Body: title, description, questions | PUT `/api/questionnaires/{id}/draft` Body: title, description, questions | ✅ 一致 | 无差异 |
| 4.2-14 | GET `/api/questionnaires/{id}/preview` | GET `/api/questionnaires/{id}/preview` | ✅ 一致 | 无差异 |
| 4.2-15 | GET `/api/questionnaires/{id}/qrcode` Query: size, format | GET `/api/questionnaires/{id}/qrcode` Query: size（缺少format参数） | ⚠️ 不一致 | 代码缺少 `format` 查询参数（设计文档要求支持 png/svg 格式切换），代码仅硬编码返回 PNG |
| 4.2-16 | GET `/api/questionnaires/{id}/link` | GET `/api/questionnaires/{id}/link` | ✅ 一致 | 无差异 |
| 4.3-1 | GET `/api/fill/{linkId}` Path: linkId | GET `/api/fill/{linkId}` Path: linkId | ✅ 一致 | 无差异 |
| 4.3-2 | POST `/api/fill/{linkId}/submit` Body: deviceId, answers[].questionId, answers[].type, answers[].value, submitTime, duration | POST `/api/fill/{linkId}/submit` Body: deviceFingerprint, answers[].questionId, answers[].answer | ❌ 不一致 | 1) 参数名不一致: 设计文档为 `deviceId`，代码为 `deviceFingerprint`；2) answers子字段不一致: 设计文档要求 `type` 和 `value` 字段，代码仅有 `answer` 字段；3) 代码缺少 `submitTime`、`duration` 字段 |
| 4.3-3 | GET `/api/fill/{linkId}/status` Query: deviceId(必填) | GET `/api/fill/{linkId}/status` Query: deviceFingerprint(非必填) | ❌ 不一致 | 1) 参数名不一致: 设计文档为 `deviceId`，代码为 `deviceFingerprint`；2) 必填属性不一致: 设计文档要求必填，代码为 `required=false` |
| 4.4-1 | GET `/api/statistics/{questionnaireId}/overview` Query: startDate, endDate | GET `/api/statistics/{questionnaireId}/overview` 无Query参数 | ⚠️ 不一致 | 代码缺少 `startDate`、`endDate` 查询参数（设计文档要求可按日期范围筛选趋势数据） |
| 4.4-2 | GET `/api/statistics/{questionnaireId}/questions` Query: startDate, endDate | GET `/api/statistics/{questionnaireId}/questions` 无Query参数 | ⚠️ 不一致 | 代码缺少 `startDate`、`endDate` 查询参数（设计文档要求可按日期范围筛选统计） |
| 4.4-3 | GET `/api/statistics/{questionnaireId}/questions/{qid}/texts` Query: page, pageSize, keyword, startDate, endDate | GET `/api/statistics/{questionnaireId}/questions/{qid}/texts` Query: page, pageSize, keyword, startDate, endDate | ✅ 一致 | 无差异 |
| 4.4-4 | POST `/api/statistics/{questionnaireId}/export` Body: format(必填), startDate, endDate | POST `/api/statistics/{questionnaireId}/export` Body: format(默认xlsx), startDate, endDate | ✅ 一致 | format有默认值"xlsx"，实质等效，可接受 |
| 4.4-5 | GET `/api/statistics/exports/{exportId}/download` | GET `/api/statistics/exports/{exportId}/download` | ✅ 一致 | 无差异 |
| 4.4-6 | GET `/api/statistics/exports` Query: page, pageSize, status, questionnaireId | GET `/api/statistics/exports` Query: page, pageSize, status, questionnaireId | ✅ 一致 | 代码pageSize默认值20与设计文档默认值10不同，但属于次要差异 |

---

## 差异汇总

### 关键不一致项（影响前后端对接）

| # | API | 差异类型 | 详细描述 |
|---|-----|---------|---------|
| 1 | 4.3-2 提交答卷 | 参数名不一致 | 设计文档: `deviceId` → 代码: `deviceFingerprint` |
| 2 | 4.3-2 提交答卷 | 请求体结构不一致 | 设计文档 answers 要求 `questionId`+`type`+`value` 三字段，代码仅有 `questionId`+`answer` 两字段 |
| 3 | 4.3-2 提交答卷 | 缺少字段 | 代码缺少 `submitTime`、`duration` 请求字段 |
| 4 | 4.3-3 检查状态 | 参数名不一致 | 设计文档: `deviceId` → 代码: `deviceFingerprint` |
| 5 | 4.3-3 检查状态 | 必填属性不一致 | 设计文档要求 `deviceId` 必填，代码 `deviceFingerprint` 为非必填 |

### 次要不一致项（功能缺失但不阻断核心流程）

| # | API | 差异类型 | 详细描述 |
|---|-----|---------|---------|
| 6 | 4.2-15 获取二维码 | 缺少参数 | 代码缺少 `format` Query参数，不支持SVG格式输出 |
| 7 | 4.4-1 统计概览 | 缺少参数 | 代码缺少 `startDate`、`endDate` Query参数 |
| 8 | 4.4-2 逐题统计 | 缺少参数 | 代码缺少 `startDate`、`endDate` Query参数 |

---

## 结论: ❌ FAIL

存在 **5 项关键不一致** 和 **3 项次要不一致**。其中问卷填写模块（4.3）的提交接口和状态检查接口的参数名与请求体结构与设计文档明显不符，会直接导致前后端对接失败，必须修复。
