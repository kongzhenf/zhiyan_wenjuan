# 功能基线清单 (FUNCTIONAL BASELINE)

> 生成时间: 2026-05-11
> 来源: 需求文档 + 编码产物交叉比对
> 部署地址: http://10.32.129.153:8082 (API基础路径 /api)
> 管理员账号: admin / admin123

---

## 一、功能需求清单

### 模块1：认证管理 (Auth)

| 编号 | 描述 | 关联接口 | 需要用例数 | 状态 |
|------|------|----------|-----------|------|
| [x] FR-001 | 管理员使用正确账号密码登录 | POST /api/auth/login | 3 | 已覆盖 |
| [x] FR-002 | 登录参数校验（用户名/密码为空） | POST /api/auth/login | 3 | 已覆盖 |
| [x] FR-003 | 登录失败-用户名或密码错误 | POST /api/auth/login | 2 | 已覆盖 |
| [x] FR-004 | 账号锁定（连续5次错误密码） | POST /api/auth/login | 2 | 已覆盖 |
| [x] FR-005 | Token刷新 | POST /api/auth/refresh | 3 | 已覆盖 |
| [x] FR-006 | 退出登录 | POST /api/auth/logout | 2 | 已覆盖 |
| [x] FR-007 | JWT鉴权-未登录/Token过期访问后台接口 | JwtAuthFilter | 3 | 已覆盖 |

### 模块2：问卷管理 (Questionnaire)

| 编号 | 描述 | 关联接口 | 需要用例数 | 状态 |
|------|------|----------|-----------|------|
| [x] FR-008 | 创建问卷（输入标题和描述） | POST /api/questionnaires | 3 | 已覆盖 |
| [x] FR-009 | 获取问卷列表（分页、状态筛选、关键字搜索、排序） | GET /api/questionnaires | 4 | 已覆盖 |
| [x] FR-010 | 获取问卷详情 | GET /api/questionnaires/{id} | 2 | 已覆盖 |
| [x] FR-011 | 更新问卷基本信息 | PUT /api/questionnaires/{id} | 3 | 已覆盖 |
| [x] FR-012 | 删除问卷（含二次确认逻辑） | DELETE /api/questionnaires/{id} | 3 | 已覆盖 |
| [x] FR-013 | 复制问卷 | POST /api/questionnaires/{id}/copy | 2 | 已覆盖 |
| [x] FR-014 | 保存问卷草稿 | PUT /api/questionnaires/{id}/draft | 3 | 已覆盖 |
| [x] FR-015 | 预览问卷（H5效果） | GET /api/questionnaires/{id}/preview | 2 | 已覆盖 |

### 模块3：题目管理 (Question)

| 编号 | 描述 | 关联接口 | 需要用例数 | 状态 |
|------|------|----------|-----------|------|
| [x] FR-016 | 添加题目（单选/多选/填空/评分/下拉） | POST /api/questionnaires/{id}/questions | 4 | 已覆盖 |
| [x] FR-017 | 更新题目配置 | PUT /api/questionnaires/{id}/questions/{qid} | 3 | 已覆盖 |
| [x] FR-018 | 删除题目 | DELETE /api/questionnaires/{id}/questions/{qid} | 2 | 已覆盖 |
| [x] FR-019 | 题目拖拽排序 | PUT /api/questionnaires/{id}/questions/sort | 3 | 已覆盖 |
| [x] FR-020 | 选择题选项数量校验（最少2项，最多20项） | POST/PUT questions | 2 | 已覆盖 |
| [x] FR-021 | 题目数量上限校验（每问卷最多50题） | POST questions | 2 | 已覆盖 |

### 模块4：问卷发布与生命周期 (Publish/Lifecycle)

| 编号 | 描述 | 关联接口 | 需要用例数 | 状态 |
|------|------|----------|-----------|------|
| [x] FR-022 | 发布问卷（含截止时间、最大回收数、设备限制配置） | POST /api/questionnaires/{id}/publish | 4 | 已覆盖 |
| [x] FR-023 | 发布校验-无题目不允许发布 | POST /api/questionnaires/{id}/publish | 2 | 已覆盖 |
| [x] FR-024 | 关闭问卷 | PUT /api/questionnaires/{id}/close | 3 | 已覆盖 |
| [x] FR-025 | 获取问卷访问链接 | GET /api/questionnaires/{id}/link | 2 | 已覆盖 |
| [x] FR-026 | 获取问卷二维码 | GET /api/questionnaires/{id}/qrcode | 2 | 已覆盖 |

### 模块5：H5端问卷填写 (Fill)

| 编号 | 描述 | 关联接口 | 需要用例数 | 状态 |
|------|------|----------|-----------|------|
| [x] FR-027 | 通过链接获取问卷内容（无需登录） | GET /api/fill/{linkId} | 3 | 已覆盖 |
| [x] FR-028 | 提交问卷答案 | POST /api/fill/{linkId}/submit | 4 | 已覆盖 |
| [x] FR-029 | 问卷已关闭时访问提示 | GET /api/fill/{linkId} | 2 | 已覆盖 |
| [x] FR-030 | 问卷不存在时访问提示 | GET /api/fill/{linkId} | 2 | 已覆盖 |
| [x] FR-031 | 同一设备重复提交限制 | POST /api/fill/{linkId}/submit | 2 | 已覆盖 |
| [x] FR-032 | 设备提交状态查询 | GET /api/fill/{linkId}/status | 2 | 已覆盖 |
| [x] FR-033 | 必填项校验 | POST /api/fill/{linkId}/submit | 2 | 已覆盖 |
| [x] FR-034 | 达到最大回收数后自动关闭 | POST /api/fill/{linkId}/submit | 2 | 已覆盖 |
| [x] FR-035 | 提交频率限制（同一IP 1分钟最多10次） | POST /api/fill/{linkId}/submit + RateLimiter | 2 | 已覆盖 |

### 模块6：数据统计与导出 (Statistics)

| 编号 | 描述 | 关联接口 | 需要用例数 | 状态 |
|------|------|----------|-----------|------|
| [x] FR-036 | 统计概览（总回收量、今日新增、时间趋势） | GET /api/statistics/{id}/overview | 3 | 已覆盖 |
| [x] FR-037 | 逐题统计（选择题选项占比） | GET /api/statistics/{id}/questions | 3 | 已覆盖 |
| [x] FR-038 | 填空题原始回答列表（分页、关键字搜索） | GET /api/statistics/{id}/questions/{qid}/texts | 3 | 已覆盖 |
| [x] FR-039 | 数据导出（Excel/CSV） | POST /api/statistics/{id}/export | 3 | 已覆盖 |
| [x] FR-040 | 导出文件下载 | GET /api/statistics/exports/{exportId}/download | 3 | 已覆盖 |
| [x] FR-041 | 导出任务列表查询 | GET /api/statistics/exports | 2 | 已覆盖 |
| [x] FR-042 | 按时间范围筛选统计数据 | GET /api/statistics/{id}/overview + questions | 2 | 已覆盖 |

---

## 二、业务流程清单

| 编号 | 描述 | 涉及模块 | 状态 |
|------|------|----------|------|
| [x] BF-001 | 管理员登录 → 创建问卷 → 添加题目 → 发布 → 获取链接 | Auth + Questionnaire + Question + Publish | 已覆盖 |
| [x] BF-002 | 受访者访问链接 → 填写问卷 → 提交 | Fill | 已覆盖 |
| [x] BF-003 | 管理员查看统计 → 导出数据 | Statistics | 已覆盖 |
| [x] BF-004 | 问卷生命周期：草稿 → 进行中 → 已结束 | Questionnaire + Publish | 已覆盖 |
| [x] BF-005 | 问卷复制 → 修改 → 重新发布 | Questionnaire | 已覆盖 |

---

## 三、用户角色清单

| 编号 | 角色 | 权限范围 | 状态 |
|------|------|----------|------|
| [x] ROLE-001 | 问卷管理员 (admin) | 所有后台管理接口（需JWT鉴权） | 已覆盖 |
| [x] ROLE-002 | 受访者（匿名用户） | 仅H5填写接口（/api/fill/*，无需登录） | 已覆盖 |

---

## 四、编码实现清单（接口与需求交叉比对）

### Controller 层接口

| 接口 | 方法 | 对应需求 | 鉴权要求 | 状态 |
|------|------|----------|----------|------|
| /api/auth/login | POST | FR-001~004 | 公开 | [x] 已比对 |
| /api/auth/refresh | POST | FR-005 | 公开 | [x] 已比对 |
| /api/auth/logout | POST | FR-006 | 需JWT | [x] 已比对 |
| /api/questionnaires | GET | FR-009 | 需JWT | [x] 已比对 |
| /api/questionnaires | POST | FR-008 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id} | GET | FR-010 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id} | PUT | FR-011 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id} | DELETE | FR-012 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/questions | POST | FR-016 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/questions/{qid} | PUT | FR-017 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/questions/{qid} | DELETE | FR-018 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/questions/sort | PUT | FR-019 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/publish | POST | FR-022~023 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/close | PUT | FR-024 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/copy | POST | FR-013 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/draft | PUT | FR-014 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/preview | GET | FR-015 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/qrcode | GET | FR-026 | 需JWT | [x] 已比对 |
| /api/questionnaires/{id}/link | GET | FR-025 | 需JWT | [x] 已比对 |
| /api/fill/{linkId} | GET | FR-027,029,030 | 公开 | [x] 已比对 |
| /api/fill/{linkId}/submit | POST | FR-028,031,033~035 | 公开 | [x] 已比对 |
| /api/fill/{linkId}/status | GET | FR-032 | 公开 | [x] 已比对 |
| /api/statistics/{id}/overview | GET | FR-036,042 | 需JWT | [x] 已比对 |
| /api/statistics/{id}/questions | GET | FR-037,042 | 需JWT | [x] 已比对 |
| /api/statistics/{id}/questions/{qid}/texts | GET | FR-038 | 需JWT | [x] 已比对 |
| /api/statistics/{id}/export | POST | FR-039 | 需JWT | [x] 已比对 |
| /api/statistics/exports/{exportId}/download | GET | FR-040 | 需JWT | [x] 已比对 |
| /api/statistics/exports | GET | FR-041 | 需JWT | [x] 已比对 |

### 数据模型（7张表）

| 表名 | 对应需求 | 状态 |
|------|----------|------|
| t_admin | FR-001~007 (管理员认证) | [x] 已比对 |
| t_questionnaire | FR-008~015, FR-022~026 (问卷管理与生命周期) | [x] 已比对 |
| t_question | FR-016~021 (题目管理) | [x] 已比对 |
| t_question_option | FR-016~020 (选项管理) | [x] 已比对 |
| t_response | FR-027~035 (答卷记录) | [x] 已比对 |
| t_answer | FR-028, FR-036~038 (答案数据) | [x] 已比对 |
| t_export_task | FR-039~041 (导出任务) | [x] 已比对 |

---

## 五、覆盖率统计

| 维度 | 总数 | 已覆盖 | 覆盖率 |
|------|------|--------|--------|
| 功能需求 (FR) | 42 | 42 | 100% |
| 业务流程 (BF) | 5 | 5 | 100% |
| 用户角色 (ROLE) | 2 | 2 | 100% |
| API接口 | 28 | 28 | 100% |
| 数据表 | 7 | 7 | 100% |
| **测试用例总数** | **110** | - | - |
