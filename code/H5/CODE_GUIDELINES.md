# 编码规范与公共类清单

## 技术栈
- Vue 3.4 + TypeScript 5.4
- Vite 5 构建
- Vant 4 移动端组件库
- Pinia 状态管理
- Vue Router 4
- Axios HTTP 客户端

## 公共基础类清单（子 agent 必须使用，禁止自建）

| 文件路径 | 用途 | 使用示例 |
|----------|------|----------|
| src/utils/request.ts | 统一 HTTP 请求封装 | `import { get, post } from '@/utils/request'` |
| src/utils/fingerprint.ts | 设备指纹生成 | `import { getDeviceId } from '@/utils/fingerprint'` |
| src/stores/survey.ts | 问卷全局状态管理 | `import { useSurveyStore } from '@/stores/survey'` |
| src/types/index.ts | 所有 TypeScript 类型定义 | `import type { Question, AnswerItem } from '@/types'` |
| src/styles/variables.css | CSS 设计变量 | 在组件 style 中直接使用 `var(--color-primary)` |
| src/styles/global.css | 全局基础样式 | 已在 main.ts 中导入 |
| src/router/index.ts | 路由配置 | 已在 main.ts 中注册 |

## 命名规范
- 组件文件: PascalCase（如 QuestionCard.vue）
- 页面文件: PascalCase（如 SurveyPage.vue）
- 工具文件: camelCase（如 request.ts）
- CSS 类名: BEM 命名法（如 question-card__title）
- Store: use + 名称 + Store（如 useSurveyStore）

## 编码约束
- 禁止空方法体、return null、TODO 占位
- 禁止 mock 数据（必须调真实 API）
- 所有接口路径/参数/响应字段与设计文档严格一致
- 使用 `<script setup lang="ts">` 语法
- 样式使用 scoped + CSS 变量引用
- 所有组件 props 必须有 TypeScript 类型定义
- 禁止 `as any`、`@ts-ignore`

## API 接口定义（H5端，无需鉴权）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/fill/{linkId} | 获取问卷内容 |
| POST | /api/fill/{linkId}/submit | 提交答卷 |
| GET | /api/fill/{linkId}/status?deviceId=xxx | 检查问卷状态 |

## 设计变量速查
- 主色: var(--color-primary) = #3D5AFE
- 危险色: var(--color-danger) = #F44336
- 成功色: var(--color-success) = #00C853
- 警告色: var(--color-warning) = #FFB300
- 卡片圆角: var(--radius-lg) = 12px
- 卡片阴影: var(--shadow-sm)
- 内容区内边距: var(--content-padding) = 16px
- Header 高度: var(--header-height) = 56px
- Footer 高度: var(--footer-height) = 72px
