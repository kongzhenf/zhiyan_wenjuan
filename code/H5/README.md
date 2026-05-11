# 问卷调查平台 H5 移动端

基于 Vue 3 + TypeScript + Vant 4 的问卷调查 H5 移动端应用，面向受访者提供无需登录的问卷填写体验。

## 功能特性

- 无需登录，通过链接/二维码直接访问问卷
- 支持 6 种题型：单选、多选、单行填空、多行填空、评分、下拉选择
- 必填项校验，错误提示滚动定位
- 同一设备重复提交检测
- 提交成功/问卷关闭/不存在等状态页
- 填写进度实时显示
- 骨架屏加载优化
- 适配移动端各尺寸屏幕及微信内置浏览器

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4 | 前端框架 |
| TypeScript | 5.4 | 类型安全 |
| Vite | 5.2 | 构建工具 |
| Vant | 4.8 | 移动端 UI 组件 |
| Pinia | 2.1 | 状态管理 |
| Vue Router | 4.3 | 路由管理 |
| Axios | 1.6 | HTTP 请求 |

## 项目结构

```
├── src/
│   ├── components/          # 公共组件
│   │   ├── QuestionCard.vue       # 题目卡片容器
│   │   ├── RadioQuestion.vue      # 单选题
│   │   ├── CheckboxQuestion.vue   # 多选题
│   │   ├── InputQuestion.vue      # 填空题
│   │   ├── RatingQuestion.vue     # 评分题
│   │   ├── DropdownQuestion.vue   # 下拉选择题
│   │   ├── StatusPage.vue         # 状态页
│   │   └── SkeletonLoading.vue    # 骨架屏
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 状态管理
│   ├── styles/              # 全局样式和设计变量
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── views/               # 页面视图
│   ├── App.vue              # 根组件
│   └── main.ts             # 入口文件
├── db/                      # 数据库脚本
├── package.json
├── Dockerfile
├── nginx.conf
├── vite.config.ts
└── tsconfig.json
```

## 安装与启动

### 环境要求

- Node.js >= 18
- npm >= 9

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器默认运行在 http://localhost:5173

### 环境配置

复制 `.env.example` 为 `.env.local`，修改 API 地址：

```
VITE_API_BASE_URL=http://your-api-server:8080/api
```

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### Docker 部署

```bash
# 构建镜像
docker build -t questionnaire-h5 .

# 运行容器
docker run -d -p 80:80 questionnaire-h5
```

## API 对接

H5 端调用以下后端接口（无需鉴权）：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/fill/{linkId} | 获取问卷内容 |
| POST | /api/fill/{linkId}/submit | 提交答卷 |
| GET | /api/fill/{linkId}/status | 检查问卷状态 |

## 数据库初始化

执行 `db/init.sql` 创建数据库表结构及初始管理员账号（admin / admin123）。

## 浏览器兼容性

- iOS Safari 12+
- Android Chrome 61+
- 微信内置浏览器
- 主流移动端浏览器
