# 问卷调查平台 - 后端API服务

基于 Spring Boot 3.2 构建的问卷调查平台后端RESTful API服务，提供问卷创建/编排、H5端无登录填写、回收数据统计与导出等功能。

## 技术栈

- Java 17
- Spring Boot 3.2.5
- Spring Data JPA + MySQL 8.0
- Spring Data Redis 7.x
- JWT (jjwt 0.12.5)
- EasyExcel 3.3.4 (数据导出)
- ZXing 3.5.3 (二维码生成)
- Lombok

## 快速启动

### 环境要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 7.x+

### 方式一：Docker Compose（推荐）

```bash
# docker compose V2
docker compose up -d

# 或 docker-compose V1
docker-compose up -d
```

服务启动后会自动初始化数据库和默认管理员账号。

### 方式二：本地开发

1. 创建数据库并执行初始化脚本：

```bash
mysql -u root -p < db/init.sql
```

2. 配置环境变量（或修改 `application.yml`）：

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=questionnaire_db
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=your_password
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your-256-bit-secret-key-change-in-production
export H5_BASE_URL=http://localhost:3000/s
```

3. 编译并启动：

```bash
mvn clean package -DskipTests
java -jar target/questionnaire-platform-1.0.0.jar
```

### 默认管理员账号

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |

> 生产环境部署后请立即修改密码

## API概览

| 模块 | 路径前缀 | 鉴权 | 说明 |
|------|----------|------|------|
| 认证 | /api/auth | 登录/刷新免鉴权 | 登录、Token刷新、退出 |
| 问卷管理 | /api/questionnaires | 需要JWT | 问卷CRUD、题目编排、发布/关闭 |
| 问卷填写 | /api/fill | 免鉴权 | H5端获取问卷、提交答卷 |
| 数据统计 | /api/statistics | 需要JWT | 统计概览、逐题统计、数据导出 |

## 项目结构

```
src/main/java/com/questionnaire/
├── QuestionnaireApplication.java    # 启动类
├── common/                          # 公共组件
│   ├── Result.java                  # 统一响应封装
│   ├── PageResult.java              # 分页响应
│   ├── BizException.java            # 业务异常
│   ├── ErrorCode.java               # 错误码枚举
│   └── GlobalExceptionHandler.java  # 全局异常处理
├── config/                          # 配置类
│   ├── JwtAuthFilter.java           # JWT认证过滤器
│   ├── CorsConfig.java              # 跨域配置
│   ├── RateLimiter.java             # Redis限流组件
│   ├── RedisConfig.java             # Redis配置
│   └── WebConfig.java               # Web过滤器注册
├── entity/                          # JPA实体
├── repository/                      # 数据访问层
├── service/                         # 业务逻辑层
│   └── impl/                        # 服务实现
├── controller/                      # REST控制器
├── dto/                             # 数据传输对象
├── scheduler/                       # 定时任务
└── util/                            # 工具类
```

## 配置说明

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| 服务端口 | SERVER_PORT | 8080 | HTTP服务端口 |
| 数据库地址 | MYSQL_HOST | localhost | MySQL主机 |
| 数据库端口 | MYSQL_PORT | 3306 | MySQL端口 |
| 数据库名 | MYSQL_DATABASE | questionnaire_db | 数据库名称 |
| Redis地址 | REDIS_HOST | localhost | Redis主机 |
| JWT密钥 | JWT_SECRET | (开发用默认值) | 生产环境必须修改 |
| JWT有效期 | JWT_ACCESS_EXPIRATION | 28800 | accessToken秒数(8h) |
| H5基础URL | H5_BASE_URL | http://localhost:3000/s | 问卷H5访问链接前缀 |
| 导出路径 | EXPORT_PATH | ./exports | 导出文件存储目录 |

## Docker部署

```bash
docker build -t questionnaire-platform .
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/questionnaire_db \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e SPRING_DATA_REDIS_HOST=redis \
  -e JWT_SECRET=your-production-secret-key \
  questionnaire-platform
```
