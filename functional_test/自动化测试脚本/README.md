# 小型问卷调查平台 - 前端功能自动化测试脚本

## 环境要求

- Node.js >= 18.x
- npm >= 9.x

## 安装依赖

```bash
npm install
npx playwright install chromium
```

## 测试目标地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 Admin | http://10.32.129.153:3002 | Vue 3 管理后台 |
| 前端 H5 | http://10.32.129.153:3003 | Vue 3 + Vant 移动端 |
| 后端 API | http://10.32.129.153:8082 | Spring Boot API，基础路径 /api |

## 测试账号

- 用户名: `admin`
- 密码: `admin123`

## 运行全部测试

```bash
npm test
```

## 运行单模块测试

```bash
npm run test:login              # 管理员登录模块
npm run test:dashboard          # 首页概览模块
npm run test:questionnaire-list # 问卷管理列表模块
npm run test:questionnaire-edit # 问卷编辑模块
npm run test:statistics         # 数据统计模块
npm run test:h5-fill            # H5问卷填写模块
npm run test:auth-api           # 认证管理API模块
npm run test:questionnaire-api  # 问卷管理API模块
npm run test:question-api       # 题目管理API模块
npm run test:publish-api        # 问卷发布与生命周期API模块
npm run test:route-nav          # 路由导航模块
```

## 带界面运行（调试用）

```bash
npm run test:headed
npm run test:debug
npm run test:ui
```

## 查看测试报告

```bash
npm run report
```

测试完成后会在 `playwright-report/` 目录生成 HTML 报告，在 `test-results.json` 生成 JSON 格式结果。

## 项目结构

```
自动化测试脚本/
├── config/
│   └── index.ts              # 环境配置（地址、账号、路由）
├── tests/
│   ├── fixtures.ts           # 公共 fixtures（登录态、API上下文、Token）
│   ├── test_login.spec.ts    # 管理员登录模块 (TC-LOGIN-001~022)
│   ├── test_dashboard.spec.ts # 首页概览模块 (TC-DASH-001~016)
│   ├── test_questionnaire_list.spec.ts # 问卷管理列表 (TC-LIST-001~050)
│   ├── test_questionnaire_edit.spec.ts # 问卷编辑 (TC-EDIT-001~059)
│   ├── test_statistics.spec.ts # 数据统计 (TC-STAT-001~066)
│   ├── test_h5_fill.spec.ts  # H5问卷填写 (TC-FILL-001~026)
│   ├── test_auth_api.spec.ts # 认证管理API (TC-AUTH-001~014)
│   ├── test_questionnaire_api.spec.ts # 问卷管理API (TC-QN-001~028)
│   ├── test_question_api.spec.ts # 题目管理API (TC-QS-001~020)
│   ├── test_publish_api.spec.ts # 发布与生命周期API (TC-PB-001~020)
│   └── test_route_nav.spec.ts # 路由导航 (TC-NAV-001~003)
├── playwright.config.ts      # Playwright 配置
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 本文件
```

## 测试框架

- **Playwright Test** (TypeScript)
- 浏览器: Chromium
- 截图: 每个测试步骤自动截图
- 视频: 失败用例保留录屏
- 追踪: 首次重试时生成 trace

## 测试用例覆盖统计

| 模块 | 用例编号范围 | 数量 |
|------|-------------|------|
| 管理员登录 | TC-LOGIN-001~022 | 22 |
| 首页概览 | TC-DASH-001~016 | 16 |
| 问卷管理列表 | TC-LIST-001~050 | 50 |
| 问卷编辑 | TC-EDIT-001~059 | 59 |
| 数据统计 | TC-STAT-001~066 | 66 |
| H5问卷填写 | TC-FILL-001~026 | 26 |
| 认证管理API | TC-AUTH-001~014 | 14 |
| 问卷管理API | TC-QN-001~028 | 28 |
| 题目管理API | TC-QS-001~020 | 20 |
| 发布与生命周期 | TC-PB-001~020 | 20 |
| 路由导航 | TC-NAV-001~003 | 3 |
| **合计** | | **324** |
