# 前端部署脚本

## 目录结构

```
/opt/deploy/questionnaire-frontend/
├── docker-compose.yml
├── frontend/          # 前端(Admin)源码
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
└── h5/                # H5移动端源码
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
```

## 部署

```bash
bash deploy.sh
```

## 回滚

```bash
bash rollback.sh
```

## 端口

| 服务 | 端口 |
|------|------|
| 前端Admin | 3002 |
| H5移动端 | 3003 |
| 后端API | 8082 (已部署) |
