# 对齐验证清单 (ALIGNMENT CHECKLIST)

## 1. 接口清单（API）

| 状态 | 编号 | 方法 | 路径 | 描述 | 来源 |
|------|------|------|------|------|------|
| [x] | API-001 | POST | /api/auth/login | 管理员登录 | 设计文档#4.1 |
| [x] | API-002 | POST | /api/auth/refresh | Token刷新 | 设计文档#4.1 |
| [x] | API-003 | POST | /api/auth/logout | 退出登录 | 设计文档#4.1 |
| [x] | API-004 | GET | /api/questionnaires | 问卷列表 | 设计文档#4.2 |
| [x] | API-005 | POST | /api/questionnaires | 创建问卷 | 设计文档#4.2 |
| [x] | API-006 | GET | /api/questionnaires/{id} | 获取问卷详情含题目 | 设计文档#4.2 |
| [x] | API-007 | PUT | /api/questionnaires/{id} | 更新问卷基本信息 | 设计文档#4.2 |
| [x] | API-008 | DELETE | /api/questionnaires/{id} | 删除问卷 | 设计文档#4.2 |
| [x] | API-009 | POST | /api/questionnaires/{id}/questions | 添加题目 | 设计文档#4.2 |
| [x] | API-010 | PUT | /api/questionnaires/{id}/questions/{qid} | 更新题目 | 设计文档#4.2 |
| [x] | API-011 | DELETE | /api/questionnaires/{id}/questions/{qid} | 删除题目 | 设计文档#4.2 |
| [x] | API-012 | PUT | /api/questionnaires/{id}/questions/sort | 题目排序 | 设计文档#4.2 |
| [x] | API-013 | POST | /api/questionnaires/{id}/publish | 发布问卷 | 设计文档#4.2 |
| [x] | API-014 | PUT | /api/questionnaires/{id}/close | 关闭问卷 | 设计文档#4.2 |
| [x] | API-015 | POST | /api/questionnaires/{id}/copy | 复制问卷 | 设计文档#4.2 |
| [x] | API-016 | PUT | /api/questionnaires/{id}/draft | 保存草稿/自动保存 | 设计文档#4.2 |
| [x] | API-017 | GET | /api/questionnaires/{id}/preview | 预览问卷H5数据 | 设计文档#4.2 |
| [x] | API-018 | GET | /api/questionnaires/{id}/qrcode | 获取二维码图片 | 设计文档#4.2 |
| [x] | API-019 | GET | /api/questionnaires/{id}/link | 获取访问链接 | 设计文档#4.2 |
| [x] | API-020 | GET | /api/fill/{linkId} | H5获取问卷内容 | 设计文档#4.3 |
| [x] | API-021 | POST | /api/fill/{linkId}/submit | H5提交答卷 | 设计文档#4.3 |
| [x] | API-022 | GET | /api/fill/{linkId}/status | H5检查问卷状态 | 设计文档#4.3 |
| [x] | API-023 | GET | /api/statistics/{questionnaireId}/overview | 统计概览 | 设计文档#4.4 |
| [x] | API-024 | GET | /api/statistics/{questionnaireId}/questions | 逐题统计数据 | 设计文档#4.4 |
| [x] | API-025 | GET | /api/statistics/{questionnaireId}/questions/{qid}/texts | 填空题原文分页 | 设计文档#4.4 |
| [x] | API-026 | POST | /api/statistics/{questionnaireId}/export | 触发数据导出 | 设计文档#4.4 |
| [x] | API-027 | GET | /api/statistics/exports/{exportId}/download | 下载导出文件 | 设计文档#4.4 |
| [x] | API-028 | GET | /api/statistics/exports | 导出任务列表 | 设计文档#4.4 |

> [!假设] API-020~022 为H5用户端接口，本项目为管理后台前端，已在API层定义但不在管理端页面中直接调用。如需H5端实现需单独开发。

## 2. 数据模型清单（DB）

| 状态 | 编号 | 表名 | 关键字段 | 来源 |
|------|------|------|----------|------|
| [!假设] | DB-001 | t_admin | id, username, password, locked, fail_count, lock_until | 设计文档#3.2.1 |
| [!假设] | DB-002 | t_questionnaire | id, title, description, status, deadline, max_responses, restrict_device, access_code | 设计文档#3.2.2 |
| [!假设] | DB-003 | t_question | id, questionnaire_id, type, content, sort_order, required, config | 设计文档#3.2.3 |
| [!假设] | DB-004 | t_question_option | id, question_id, content, sort_order | 设计文档#3.2.4 |
| [!假设] | DB-005 | t_response | id, questionnaire_id, device_fingerprint, ip_address, submitted_at | 设计文档#3.2.5 |
| [!假设] | DB-006 | t_answer | id, response_id, question_id, answer_content | 设计文档#3.2.6 |

> [!假设] 数据库表为后端职责，前端通过TypeScript类型定义（src/api/*.ts）与设计文档数据模型对齐。前端不直接创建数据库，类型定义已覆盖所有字段。

## 3. 页面清单（PAGE）

| 状态 | 编号 | 页面名称 | 路由路径 | 来源 |
|------|------|----------|----------|------|
| [x] | PAGE-001 | 登录页 | /login | UI原型#login-container |
| [x] | PAGE-002 | 首页概览 | /dashboard | UI原型#page-dashboard |
| [x] | PAGE-003 | 问卷列表 | /questionnaire/list | UI原型#page-questionnaire-list |
| [x] | PAGE-004 | 问卷创建/编辑 | /questionnaire/edit/:id? | UI原型#page-questionnaire-edit |
| [x] | PAGE-005 | 统计概览 | /statistics/overview/:id | UI原型#page-statistics-overview |
| [x] | PAGE-006 | 逐题统计 | /statistics/detail/:id | UI原型#page-statistics-detail |
| [x] | PAGE-007 | 数据导出 | /statistics/export | UI原型#page-data-export |

## 4. 业务规则清单（BIZ）

| 状态 | 编号 | 描述 | 来源 |
|------|------|------|------|
| [x] | BIZ-001 | 管理员登录：密码连续错误5次锁定10分钟 | 需求文档#管理员登录 |
| [x] | BIZ-002 | Token有效期8小时，refreshToken 7天 | 设计文档#4.1 |
| [x] | BIZ-003 | 问卷状态流转：draft→active→closed（不可逆） | 设计文档#6.3 |
| [x] | BIZ-004 | 每份问卷最多50道题目 | 需求文档#功能二限制 |
| [x] | BIZ-005 | 选择类题目选项至少2项，最多20项 | 需求文档#功能二限制 |
| [x] | BIZ-006 | 编辑过程自动保存（每30秒） | 需求文档#功能二 |
| [x] | BIZ-007 | 发布前校验：至少1道题目、选择题至少2选项 | 设计文档#4.2发布 |
| [!假设] | BIZ-008 | H5端无需登录即可填写问卷 | 需求文档#功能一 |
| [!假设] | BIZ-009 | 同一设备重复提交限制（设备指纹检测） | 设计文档#4.3 |
| [x] | BIZ-010 | 问卷达到最大回收数自动关闭 | 需求文档#功能三 |
| [x] | BIZ-011 | 已有回收数据的问卷删除需二次确认 | 需求文档#功能三 |
| [x] | BIZ-012 | 数据导出≤5万条同步，>5万条异步 | 设计文档#4.4 |
| [x] | BIZ-013 | 导出文件有效期24小时 | 设计文档#4.4 |
| [x] | BIZ-014 | 问卷标题最长100字符 | 设计文档#3.2.2 |
| [!假设] | BIZ-015 | H5提交频率限制：同IP每分钟≤10次 | 需求文档#安全要求 |

> [!假设] BIZ-008/009/015 为H5用户端和后端协作实现的业务规则，前端管理端已通过发布配置（设备限制开关）支持配置入口，具体限制逻辑由后端执行。

## 5. 错误码清单（ERR）

| 状态 | 编号 | 业务code | 描述 | 来源 |
|------|------|----------|------|------|
| [x] | ERR-001 | 400001 | 请求参数校验失败 | 设计文档#4.2.2 |
| [x] | ERR-002 | 400002 | 选项数量不符合要求 | 设计文档#4.2.2 |
| [x] | ERR-003 | 400003 | 题目数量已达上限(50) | 设计文档#4.2.2 |
| [x] | ERR-004 | 400004 | 排序题目ID列表不匹配 | 设计文档#4.2.2 |
| [x] | ERR-005 | 400005 | 问卷无题目不允许发布 | 设计文档#4.2.2 |
| [x] | ERR-006 | 400006 | 题目配置不完整 | 设计文档#4.2.2 |
| [x] | ERR-007 | 400007 | 当前状态不允许发布 | 设计文档#4.2.2 |
| [x] | ERR-008 | 400008 | 当前状态不允许关闭 | 设计文档#4.2.2 |
| [x] | ERR-009 | 400009 | 当前状态不支持草稿保存 | 设计文档#4.2.2 |
| [x] | ERR-010 | 400010 | 删除需二次确认 | 设计文档#4.2.2 |
| [x] | ERR-011 | 400011 | 问卷未发布无法获取链接/二维码 | 设计文档#4.2.2 |
| [x] | ERR-012 | 401000 | Token无效或已过期 | 设计文档#4.2.2 |
| [x] | ERR-013 | 401001 | 用户名或密码错误 | 设计文档#4.2.2 |
| [x] | ERR-014 | 401002 | 账号已锁定 | 设计文档#4.2.2 |
| [x] | ERR-015 | 401003 | refreshToken无效或已过期 | 设计文档#4.2.2 |
| [x] | ERR-016 | 404001 | 问卷不存在 | 设计文档#4.2.2 |
| [x] | ERR-017 | 404002 | 题目不存在 | 设计文档#4.2.2 |
| [x] | ERR-018 | 4001 | H5提交校验失败 | 设计文档#4.3 |
| [x] | ERR-019 | 4031 | H5问卷已结束 | 设计文档#4.3 |
| [x] | ERR-020 | 4032 | H5问卷已达回收上限 | 设计文档#4.3 |
| [x] | ERR-021 | 4040 | H5问卷不存在 | 设计文档#4.3 |
| [x] | ERR-022 | 4091 | H5同一设备重复提交 | 设计文档#4.3 |
| [x] | ERR-023 | 4290 | H5提交频率超限 | 设计文档#4.3 |

> 所有错误码已在API响应拦截器（src/api/request.ts）中统一处理，Token过期自动刷新，业务错误通过ElMessage展示。

## 模块分配计划

| 模块 | 负责Agent | 包含页面/功能 | 状态 |
|------|-----------|---------------|------|
| 公共基础 | 主Agent(自己) | 项目骨架、路由配置、API封装、全局状态、公共布局组件 | ✅ 已完成 |
| 模块A：登录+布局 | 子Agent-1 (bg_57313aaa) | PAGE-001登录页、主布局（Header+Sidebar）、PAGE-002首页概览 | ✅ 已完成 |
| 模块B：问卷管理 | 子Agent-2 (bg_be0c8a84) | PAGE-003问卷列表、PAGE-004问卷编辑器 | ✅ 已完成 |
| 模块C：统计与导出 | 子Agent-3 (bg_4128cec3) | PAGE-005统计概览、PAGE-006逐题统计、PAGE-007数据导出 | ✅ 已完成 |

## 验收报告

| 检查项 | 首次结论 | 修复轮次 | 最终结论 |
|--------|----------|----------|----------|
| C1-清单完成度 | PASS | 0 | PASS |
| C2-接口路径 | FAIL(缺H5 fill API) | 1 | PASS |
| C4-UI原型对齐 | PASS(侧栏菜单缺2项) | 1 | PASS |
| C5-Mock扫描 | PASS(有条件-Dashboard硬编码) | 1 | PASS |

### 修复记录
- **C2修复**: 新增 `src/api/fill.ts`，实现3个H5填写模块API（getFillQuestionnaireApi/submitFillApi/checkFillStatusApi）
- **C4修复**: 在 MainLayout.vue 侧栏菜单中添加"统计概览"和"逐题统计"菜单项
- **C5修复**: DashboardView.vue 移除 Math.random() 硬编码趋势数据，改为调用 getStatisticsOverviewApi 获取真实趋势数据
