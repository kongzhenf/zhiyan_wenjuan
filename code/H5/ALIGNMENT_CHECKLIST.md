# ALIGNMENT_CHECKLIST - 问卷调查平台 H5 移动端

## 接口清单（H5端使用的API）

- [x] API-001 GET /api/fill/{linkId} 获取问卷内容 | 来源：设计文档#4.3.1
- [x] API-002 POST /api/fill/{linkId}/submit 提交答卷 | 来源：设计文档#4.3.2
- [x] API-003 GET /api/fill/{linkId}/status 检查问卷状态 | 来源：设计文档#4.3.3

## 数据模型清单（前端涉及的数据结构）

- [x] DB-001 Questionnaire（问卷）：id, title, description, status | 来源：设计文档#3.2.2
- [x] DB-002 Question（题目）：id, type, title/content, sortOrder, required, config, options | 来源：设计文档#3.2.3
- [x] DB-003 QuestionOption（选项）：id, content, sortOrder | 来源：设计文档#3.2.4
- [x] DB-004 Answer（答案）：questionId, type, value | 来源：设计文档#4.3.2请求体

## 页面清单

- [x] PAGE-001 加载状态页（骨架屏） / 路由：/s/:linkId（初始状态） | 来源：UI原型#page-loading
- [x] PAGE-002 问卷填写页 / 路由：/s/:linkId（正常状态） | 来源：UI原型#page-survey-form
- [x] PAGE-003 提交成功页 / 路由：/s/:linkId（提交后） | 来源：UI原型#page-submit-success
- [x] PAGE-004 问卷已结束页 / 路由：/s/:linkId（已关闭） | 来源：UI原型#page-survey-closed
- [x] PAGE-005 问卷不存在页 / 路由：/s/:linkId（404） | 来源：UI原型#page-not-found
- [x] PAGE-006 已重复提交页 / 路由：/s/:linkId（重复提交） | 来源：UI原型#page-already-submitted

## 业务规则清单

- [x] BIZ-001 无需登录直接填写问卷 | 来源：需求文档#故事一
- [x] BIZ-002 必填项未填时提交触发校验提示，滚动至首个未填题目 | 来源：需求文档#功能一/错误处理
- [x] BIZ-003 同一设备重复提交检测（deviceId指纹） | 来源：需求文档#功能一/边界、设计文档#4.3.2
- [x] BIZ-004 问卷状态校验：草稿/已结束不可作答 | 来源：需求文档#功能一/边界
- [x] BIZ-005 提交成功后展示完成页（感谢语） | 来源：需求文档#C端子功能3
- [x] BIZ-006 网络异常提交失败提示，保留已填内容 | 来源：需求文档#功能一/错误处理
- [x] BIZ-007 题型支持：单选(radio)/多选(checkbox)/单行填空(text)/多行填空(textarea)/评分(rating)/下拉(dropdown) | 来源：需求文档#C端子功能2
- [x] BIZ-008 提交按钮loading状态防重复点击 | 来源：需求文档#C端子功能3
- [x] BIZ-009 页面加载骨架屏占位 | 来源：需求文档#加载状态
- [x] BIZ-010 填写进度条显示 | 来源：需求文档#C端页面布局
- [x] BIZ-011 多行填空题字符计数显示 | 来源：需求文档#C端子功能2
- [x] BIZ-012 问卷达回收上限展示提示 | 来源：设计文档#4.3.2(code 4032)

## 错误码清单（H5端涉及）

- [x] ERR-001 4001 提交校验失败（必填项缺失） | 来源：设计文档#4.3.2
- [x] ERR-002 4031 问卷已结束/已关闭 | 来源：设计文档#4.3.1/4.3.2
- [x] ERR-003 4032 问卷未发布/已达回收上限 | 来源：设计文档#4.3.1/4.3.2
- [x] ERR-004 4040 问卷不存在 | 来源：设计文档#4.3.1/4.3.2/4.3.3
- [x] ERR-005 4091 同一设备重复提交 | 来源：设计文档#4.3.2
- [x] ERR-006 4290 提交频率超限 | 来源：设计文档#4.3.2

## 验收报告

| 检查项 | 首次结论 | 修复轮次 | 最终结论 |
|--------|----------|----------|----------|
| C1-清单完成度 | PASS | 0 | PASS |
| C2-接口路径 | PASS | 0 | PASS |
| C3-数据模型 | PASS | 0 | PASS |
| C4-UI原型对齐 | FAIL | 1 | PASS |
| C5-Mock扫描 | PASS | 0 | PASS |
| C6-无中生有 | PASS | 0 | PASS |

### 备注
- C4首次FAIL原因：6项样式偏差（题号徽章、状态页图标尺寸、Header对齐、进度条渐变色、indicator尺寸、状态页文字）
- C4修复内容：已全部按原型修正，详见 REVIEW_UI_ALIGNMENT.md
- 设计文档存在内部不一致：题型枚举表写`select`但JSON示例写`dropdown`，代码采用`dropdown`与JSON示例对齐
