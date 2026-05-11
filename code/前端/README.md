# 问卷调查平台 - 管理后台前端

基于 Vue 3 + TypeScript + Element Plus 的问卷调查管理后台，提供问卷创建编排、生命周期管理、回收数据统计与导出功能。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP请求**: Axios（含Token自动刷新）
- **图表**: ECharts 5 + vue-echarts
- **拖拽排序**: vuedraggable
- **构建工具**: Vite 5
- **样式**: SCSS + CSS变量（对齐UI原型设计系统）

## 功能模块

| 模块 | 页面 | 说明 |
|------|------|------|
| 认证 | 登录页 | 账号密码登录，JWT Token鉴权 |
| 首页 | 概览面板 | 统计卡片、趋势图、最近问卷 |
| 问卷管理 | 问卷列表 | 筛选/搜索/分页，发布/关闭/复制/删除操作 |
| 问卷管理 | 问卷编辑器 | 三栏布局，拖拽排序，6种题型，自动保存 |
| 数据统计 | 统计概览 | 回收量/趋势折线图，时间筛选 |
| 数据统计 | 逐题统计 | 饼图/柱状图/进度条，填空题原文分页 |
| 数据统计 | 数据导出 | Excel/CSV导出，导出历史管理 |

## 安装与启动

```bash
# 安装依赖
npm install

# 开发模式（默认端口3000）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 环境配置

复制 `.env.example` 为 `.env.local` 并修改配置：

```bash
cp .env.example .env.local
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| VITE_API_BASE_URL | 后端API地址 | http://localhost:8080/api |
| VITE_H5_BASE_URL | H5问卷填写端地址 | http://localhost:3001 |
| VITE_APP_TITLE | 应用标题 | 问卷调查平台 |

## Docker 部署

```bash
# 构建镜像
docker build -t questionnaire-admin .

# 运行容器
docker run -d -p 80:80 questionnaire-admin
```

Nginx 配置已包含：API反向代理、gzip压缩、静态资源缓存、SPA路由兜底。

## 项目结构

```
src/
├── api/                    # API请求封装
│   ├── request.ts          # Axios实例（拦截器/Token刷新）
│   ├── auth.ts             # 认证接口
│   ├── questionnaire.ts    # 问卷管理接口
│   └── statistics.ts       # 统计导出接口
├── components/
│   └── layout/
│       └── MainLayout.vue  # 主布局（Header+Sidebar+Main）
├── router/
│   └── index.ts            # 路由配置（含导航守卫）
├── stores/
│   └── auth.ts             # 认证状态管理
├── styles/
│   ├── variables.scss      # CSS变量（对齐原型设计系统）
│   └── global.scss         # 全局样式
├── views/
│   ├── login/
│   │   └── LoginView.vue   # 登录页
│   ├── dashboard/
│   │   └── DashboardView.vue # 首页概览
│   ├── questionnaire/
│   │   ├── QuestionnaireList.vue # 问卷列表
│   │   └── QuestionnaireEdit.vue # 问卷编辑器
│   └── statistics/
│       ├── StatisticsOverview.vue # 统计概览
│       ├── StatisticsDetail.vue   # 逐题统计
│       └── DataExport.vue         # 数据导出
├── App.vue
└── main.ts
```

## 接口对接

所有API接口路径和参数严格按照《问卷调查平台软件设计说明》第4章接口设计实现，统一响应格式：

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "result": {}
}
```

默认管理员账号：admin / admin123
