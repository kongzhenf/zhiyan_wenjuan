# 编码规范与公共类清单

## 公共基础类清单（子 agent 必须使用，禁止自建）

| 类名 | 包路径 | 用途 | 使用示例 |
|------|--------|------|----------|
| Result | com.questionnaire.common.Result | 统一响应封装 | return Result.ok(data); / return Result.fail(code, msg); |
| PageResult | com.questionnaire.common.PageResult | 分页响应封装 | return Result.ok(PageResult.of(page, pageSize, total, list)); |
| BizException | com.questionnaire.common.BizException | 业务异常 | throw new BizException(ErrorCode.QUESTIONNAIRE_NOT_FOUND); |
| ErrorCode | com.questionnaire.common.ErrorCode | 错误码枚举 | ErrorCode.PARAM_INVALID.getCode() |
| GlobalExceptionHandler | com.questionnaire.common.GlobalExceptionHandler | 全局异常拦截 | 自动生效，无需手动调用 |
| JwtUtil | com.questionnaire.util.JwtUtil | JWT工具类 | jwtUtil.generateAccessToken(username) |
| RateLimiter | com.questionnaire.config.RateLimiter | 限流组件 | rateLimiter.isAllowed(key, 10, 60) |

## Entity 清单

| 类名 | 包路径 | 对应表 |
|------|--------|--------|
| Admin | com.questionnaire.entity.Admin | t_admin |
| Questionnaire | com.questionnaire.entity.Questionnaire | t_questionnaire |
| Question | com.questionnaire.entity.Question | t_question |
| QuestionOption | com.questionnaire.entity.QuestionOption | t_question_option |
| Response | com.questionnaire.entity.Response | t_response |
| Answer | com.questionnaire.entity.Answer | t_answer |
| ExportTask | com.questionnaire.entity.ExportTask | t_export_task |

## Repository 清单

| 接口名 | 包路径 |
|--------|--------|
| AdminRepository | com.questionnaire.repository.AdminRepository |
| QuestionnaireRepository | com.questionnaire.repository.QuestionnaireRepository |
| QuestionRepository | com.questionnaire.repository.QuestionRepository |
| QuestionOptionRepository | com.questionnaire.repository.QuestionOptionRepository |
| ResponseRepository | com.questionnaire.repository.ResponseRepository |
| AnswerRepository | com.questionnaire.repository.AnswerRepository |
| ExportTaskRepository | com.questionnaire.repository.ExportTaskRepository |

## 命名规范

- Controller: XxxController，路径 /api/xxx
- Service 接口: XxxService（无I前缀）
- Service 实现: XxxServiceImpl
- Entity: 首字母大写（与表名去掉t_前缀对应）
- Repository: XxxRepository
- DTO: XxxDTO / XxxRequest / XxxResponse
- 包结构: com.questionnaire.{common,config,entity,repository,service,service/impl,controller,dto,scheduler,util}

## 编码约束

- 禁止空方法体、return null、TODO 占位
- 禁止 mock 数据
- 所有接口路径/参数/响应字段与设计文档严格一致
- 所有 Entity 字段与 db/init.sql 严格一致
- Controller 方法返回 Result<T> 类型
- Service 层抛 BizException，Controller 不捕获（由 GlobalExceptionHandler 统一处理）
- 分页参数统一使用 page/pageSize
- 日期格式统一使用 ISO 8601
- 逻辑删除字段: deleted（Boolean）
- 问卷状态枚举: draft/active/closed
- 题目类型枚举: radio/checkbox/input/rating/dropdown

## 统一响应格式

```json
{
  "success": true/false,
  "code": 200,
  "message": "操作成功",
  "result": {}
}
```

## 获取当前用户

Controller 中通过 HttpServletRequest 获取当前登录用户:
```java
String currentUser = (String) request.getAttribute("currentUser");
```
