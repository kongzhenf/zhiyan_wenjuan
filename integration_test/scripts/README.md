# Integration Test Scripts

## 执行方式

```bash
bash /data/documents/2052921194065797121/integration_test/scripts/test_integration_all.sh
```

## 前提条件

- Docker 容器全部运行中 (`docker-compose ps` 确认所有服务 Up)
- 后端已初始化数据库 (admin 用户存在)

## 脚本说明

| 脚本 | 覆盖范围 | 用例数 |
|------|----------|--------|
| test_integration_all.sh | 全量集成测试 (INT-001~028 + DF-001~007) | ~50 |

## 测试通过标准

- 所有用例 PASS
- 退出码为 0
