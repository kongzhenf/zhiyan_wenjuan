# 编码规范与公共类清单

## 技术栈
- Vue 3 + TypeScript
- Element Plus (UI组件库)
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP请求)
- ECharts (图表)
- vuedraggable (拖拽排序)
- dayjs (日期处理)
- Vite (构建工具)
- SCSS (样式预处理)

## 公共基础类清单（子agent必须使用，禁止自建）

| 文件路径 | 用途 | 使用示例 |
|----------|------|----------|
| src/api/request.ts | Axios实例封装，含Token拦截器和自动刷新 | `import request from '@/api/request'` |
| src/api/request.ts → ApiResponse<T> | 统一响应类型 | `Promise<ApiResponse<LoginResult>>` |
| src/api/request.ts → PaginatedResult<T> | 分页响应类型 | `PaginatedResult<QuestionnaireListItem>` |
| src/api/auth.ts | 认证API（login/refresh/logout） | `import { loginApi } from '@/api/auth'` |
| src/api/questionnaire.ts | 问卷管理API（CRUD/发布/关闭/复制等） | `import { getQuestionnairesApi } from '@/api/questionnaire'` |
| src/api/statistics.ts | 统计API（概览/逐题统计/导出） | `import { getStatisticsOverviewApi } from '@/api/statistics'` |
| src/stores/auth.ts | 认证状态管理（token/username） | `const authStore = useAuthStore()` |
| src/router/index.ts | 路由配置，含导航守卫 | 已自动注入 |
| src/components/layout/MainLayout.vue | 主布局（Header+Sidebar+Main） | 路由自动加载 |
| src/styles/variables.scss | 全局CSS变量（与原型design-system.css完全一致） | 已自动引入 |
| src/styles/global.scss | 全局样式（reset+公共class） | 已自动引入 |

## 统一响应格式

所有API返回格式: `{ success: boolean, code: number, message: string, result: T }`

分页返回格式（管理后台）:
```typescript
{
  result: {
    list: T[],
    pagination: { page: number, pageSize: number, total: number, totalPages: number }
  }
}
```

## 命名规范

- 组件名: PascalCase（如 `QuestionnaireList.vue`）
- 页面组件路径: `src/views/{模块名}/{PageName}.vue`
- API函数: camelCase + Api后缀（如 `getQuestionnairesApi`）
- Store: use + 名称 + Store（如 `useAuthStore`）
- CSS变量: 使用 variables.scss 中定义的变量，禁止硬编码色值
- 路由路径: kebab-case（如 `/questionnaire/list`）

## 编码约束

1. 禁止空方法体、return null、TODO占位
2. 禁止mock数据 — 所有数据必须通过API请求获取
3. 所有接口路径/参数/响应字段必须与设计文档严格一致
4. 使用Element Plus组件，不要自行实现基础UI组件
5. 图表使用ECharts，通过vue-echarts组件渲染
6. 样式优先使用CSS变量（variables.scss），禁止硬编码色值
7. 列表页必须实现分页、筛选、搜索功能
8. 表单页必须实现表单验证
9. 所有操作需有loading状态和错误提示
10. 删除等危险操作需确认弹窗

## 页面实现要求

每个页面组件必须包含：
1. 完整的 `<template>` — 按原型还原UI结构
2. 完整的 `<script setup lang="ts">` — 包含所有交互逻辑和API调用
3. 完整的 `<style scoped lang="scss">` — 使用CSS变量
4. Loading / Empty / Error 状态处理

## API调用模式

```typescript
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const data = ref<SomeType[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await someApi(params)
    data.value = res.result.list
  } catch (err: any) {
    ElMessage.error(err.message || '请求失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchData() })
```
