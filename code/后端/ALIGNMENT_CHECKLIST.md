# 对齐验证清单 (ALIGNMENT_CHECKLIST)

## 接口清单

- [x] API-001 POST /api/auth/login 管理员登录 | 来源：设计文档#4.1
- [x] API-002 POST /api/auth/refresh Token刷新 | 来源：设计文档#4.1
- [x] API-003 POST /api/auth/logout 退出登录 | 来源：设计文档#4.1
- [x] API-004 GET /api/questionnaires 问卷列表 | 来源：设计文档#4.2
- [x] API-005 POST /api/questionnaires 创建问卷 | 来源：设计文档#4.2
- [x] API-006 GET /api/questionnaires/{id} 获取问卷详情含题目 | 来源：设计文档#4.2
- [x] API-007 PUT /api/questionnaires/{id} 更新问卷基本信息 | 来源：设计文档#4.2
- [x] API-008 DELETE /api/questionnaires/{id} 删除问卷 | 来源：设计文档#4.2
- [x] API-009 POST /api/questionnaires/{id}/questions 添加题目 | 来源：设计文档#4.2
- [x] API-010 PUT /api/questionnaires/{id}/questions/{qid} 更新题目 | 来源：设计文档#4.2
- [x] API-011 DELETE /api/questionnaires/{id}/questions/{qid} 删除题目 | 来源：设计文档#4.2
- [x] API-012 PUT /api/questionnaires/{id}/questions/sort 题目排序 | 来源：设计文档#4.2
- [x] API-013 POST /api/questionnaires/{id}/publish 发布问卷 | 来源：设计文档#4.2
- [x] API-014 PUT /api/questionnaires/{id}/close 关闭问卷 | 来源：设计文档#4.2
- [x] API-015 POST /api/questionnaires/{id}/copy 复制问卷 | 来源：设计文档#4.2
- [x] API-016 PUT /api/questionnaires/{id}/draft 保存草稿/自动保存 | 来源：设计文档#4.2
- [x] API-017 GET /api/questionnaires/{id}/preview 预览问卷H5数据 | 来源：设计文档#4.2
- [x] API-018 GET /api/questionnaires/{id}/qrcode 获取二维码图片 | 来源：设计文档#4.2
- [x] API-019 GET /api/questionnaires/{id}/link 获取访问链接 | 来源：设计文档#4.2
- [x] API-020 GET /api/fill/{linkId} 获取问卷内容(H5) | 来源：设计文档#4.3
- [x] API-021 POST /api/fill/{linkId}/submit 提交答卷(H5) | 来源：设计文档#4.3
- [x] API-022 GET /api/fill/{linkId}/status 检查问卷状态(H5) | 来源：设计文档#4.3
- [x] API-023 GET /api/statistics/{questionnaireId}/overview 统计概览 | 来源：设计文档#4.4
- [x] API-024 GET /api/statistics/{questionnaireId}/questions 逐题统计 | 来源：设计文档#4.4
- [x] API-025 GET /api/statistics/{questionnaireId}/questions/{qid}/texts 填空题原文列表 | 来源：设计文档#4.4
- [x] API-026 POST /api/statistics/{questionnaireId}/export 触发数据导出 | 来源：设计文档#4.4
- [x] API-027 GET /api/statistics/exports/{exportId}/download 下载导出文件 | 来源：设计文档#4.4
- [x] API-028 GET /api/statistics/exports 导出任务列表 | 来源：设计文档#4.4

## 数据模型清单

- [x] DB-001 t_admin 管理员表 | 来源：设计文档#3.2.1
- [x] DB-002 t_questionnaire 问卷表 | 来源：设计文档#3.2.2
- [x] DB-003 t_question 题目表 | 来源：设计文档#3.2.3
- [x] DB-004 t_question_option 选项表 | 来源：设计文档#3.2.4
- [x] DB-005 t_response 答卷表 | 来源：设计文档#3.2.5
- [x] DB-006 t_answer 答案表 | 来源：设计文档#3.2.6

## 业务规则清单

- [x] BIZ-001 密码连续错误5次锁定账号10分钟 | 来源：需求文档#管理员登录
- [x] BIZ-002 accessToken有效期8小时，refreshToken有效期7天 | 来源：设计文档#4.1
- [x] BIZ-003 问卷状态机：draft→active→closed（不可逆） | 来源：设计文档#4.2
- [x] BIZ-004 每份问卷最多50道题目 | 来源：设计文档#4.2
- [x] BIZ-005 选择类题型选项至少2项，最多20项 | 来源：设计文档#4.2
- [x] BIZ-006 同一设备重复提交限制（设备指纹检测） | 来源：设计文档#4.3
- [x] BIZ-007 H5提交接口频率限制（同IP 1分钟≤10次） | 来源：需求文档#安全要求
- [x] BIZ-008 数据导出≤5万条同步，>5万条异步 | 来源：设计文档#4.4
- [x] BIZ-009 导出文件有效期24小时 | 来源：设计文档#4.4
- [x] BIZ-010 问卷截止时间到期/回收满额自动关闭 | 来源：需求文档#功能三
- [x] BIZ-011 删除有回收数据的问卷需二次确认 | 来源：设计文档#4.2
- [x] BIZ-012 草稿保存全量快照策略 | 来源：设计文档#4.2
- [x] BIZ-013 退出登录Token加入黑名单 | 来源：设计文档#4.1

## 错误码清单

- [x] ERR-001 200 操作成功 | 来源：设计文档#4.2.2
- [x] ERR-002 400001 请求参数校验失败 | 来源：设计文档#4.2.2
- [x] ERR-003 400002 选项数量不符合要求 | 来源：设计文档#4.2.2
- [x] ERR-004 400003 题目数量已达上限 | 来源：设计文档#4.2.2
- [x] ERR-005 400004 排序题目ID列表不匹配 | 来源：设计文档#4.2.2
- [x] ERR-006 400005 问卷无题目不允许发布 | 来源：设计文档#4.2.2
- [x] ERR-007 400006 题目配置不完整 | 来源：设计文档#4.2.2
- [x] ERR-008 400007 当前状态不允许发布 | 来源：设计文档#4.2.2
- [x] ERR-009 400008 当前状态不允许关闭 | 来源：设计文档#4.2.2
- [x] ERR-010 400009 当前状态不支持草稿保存 | 来源：设计文档#4.2.2
- [x] ERR-011 400010 删除需二次确认 | 来源：设计文档#4.2.2
- [x] ERR-012 400011 问卷未发布无法获取链接/二维码 | 来源：设计文档#4.2.2
- [x] ERR-013 401000 Token无效或已过期 | 来源：设计文档#4.2.2
- [x] ERR-014 401001 用户名或密码错误 | 来源：设计文档#4.2.2
- [x] ERR-015 401002 账号已锁定 | 来源：设计文档#4.2.2
- [x] ERR-016 401003 refreshToken无效或已过期 | 来源：设计文档#4.2.2
- [x] ERR-017 404001 问卷不存在 | 来源：设计文档#4.2.2
- [x] ERR-018 404002 题目不存在 | 来源：设计文档#4.2.2
- [x] ERR-019 4001 提交校验失败(H5) | 来源：设计文档#4.3
- [x] ERR-020 4031 问卷已结束(H5) | 来源：设计文档#4.3
- [x] ERR-021 4032 问卷已达回收上限(H5) | 来源：设计文档#4.3
- [x] ERR-022 4040 问卷不存在(H5) | 来源：设计文档#4.3
- [x] ERR-023 4091 同一设备重复提交(H5) | 来源：设计文档#4.3
- [x] ERR-024 4290 提交频率超限(H5) | 来源：设计文档#4.3
- [x] ERR-025 4010 未授权(统计模块) | 来源：设计文档#4.4
- [x] ERR-026 4002 题目类型不匹配(非填空题) | 来源：设计文档#4.4
- [x] ERR-027 4003 无数据可导出 | 来源：设计文档#4.4
- [x] ERR-028 4004 导出文件正在生成中 | 来源：设计文档#4.4
- [x] ERR-029 4005 导出文件已过期 | 来源：设计文档#4.4

## 模块分配

| 模块 | 负责Agent | 包含接口 | 状态 |
|------|-----------|----------|------|
| 公共基础设施 | 主Agent | 统一响应、全局异常、JWT认证、CORS、Redis配置 | ✅完成 |
| 认证模块 | 子Agent-1 | API-001~003 | ✅完成 |
| 问卷管理模块 | 子Agent-2 | API-004~019 | ✅完成 |
| 问卷填写模块(H5) | 子Agent-3 | API-020~022 | ✅完成 |
| 统计模块 | 子Agent-4 | API-023~028 | ✅完成 |
| 定时任务模块 | 子Agent-4 | BIZ-010, 异步导出 | ✅完成 |

## 验收报告

| 检查项 | 首次结论 | 修复轮次 | 最终结论 |
|--------|----------|----------|----------|
| C2-接口路径 | FAIL | 1 | PASS |
| C3-数据模型 | PASS | 0 | PASS |
| C5-Mock扫描 | PASS | 0 | PASS |

### C2修复记录
- 修复SubmitRequest: `deviceFingerprint`→`deviceId`，新增`submitTime`/`duration`字段
- 修复SubmitAnswerItem: `answer`(String)→`value`(Object)，新增`type`字段
- 修复FillController: status接口参数`deviceFingerprint`→`deviceId`(required)
- 修复StatisticsController: overview/questions接口新增`startDate`/`endDate`参数
- 修复QuestionnaireController: qrcode接口新增`format`参数
- 更新FillServiceImpl/StatisticsServiceImpl适配新参数签名
