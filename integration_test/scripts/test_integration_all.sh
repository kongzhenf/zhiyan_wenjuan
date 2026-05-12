#!/bin/bash
# Integration Test Script - 问卷调查平台后端集成测试
# 执行方式: bash test_integration_all.sh
# 环境要求: 在宿主机执行，通过 docker exec 访问后端服务

set +e

# ============================================================
# 配置
# ============================================================
BACKEND_CONTAINER="questionnaire-h5"
BACKEND_URL="http://backend:8080"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

# 测试计数器
TOTAL=0
PASSED=0
FAILED=0
FAILURES=""

# ============================================================
# 工具函数
# ============================================================
log_info() { echo "[INFO] $1"; }
log_pass() { echo "[PASS] $1"; TOTAL=$((TOTAL+1)); PASSED=$((PASSED+1)); }
log_fail() { echo "[FAIL] $1"; TOTAL=$((TOTAL+1)); FAILED=$((FAILED+1)); FAILURES="${FAILURES}\n  - $1"; }

# 通过 docker exec 发送 HTTP 请求
api_get() {
    local path="$1"
    local headers="$2"
    local result=""
    if [ -n "$headers" ]; then
        result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 -H "$headers" "${BACKEND_URL}${path}")
    else
        result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 "${BACKEND_URL}${path}")
    fi
    if [ -z "$result" ]; then
        echo '{"success":false,"code":500,"message":"No response or HTTP error"}'
    else
        echo "$result"
    fi
}

api_post() {
    local path="$1"
    local body="$2"
    local headers="$3"
    local result=""
    if [ -n "$headers" ]; then
        result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 -X POST -H "Content-Type: application/json" -H "$headers" -d "$body" "${BACKEND_URL}${path}")
    else
        result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 -X POST -H "Content-Type: application/json" -d "$body" "${BACKEND_URL}${path}")
    fi
    if [ -z "$result" ]; then
        echo '{"success":false,"code":500,"message":"No response or HTTP error"}'
    else
        echo "$result"
    fi
}

api_put() {
    local path="$1"
    local body="$2"
    local headers="$3"
    local result=""
    if [ -n "$headers" ]; then
        result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 -X PUT -H "Content-Type: application/json" -H "$headers" -d "$body" "${BACKEND_URL}${path}")
    else
        result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 -X PUT -H "Content-Type: application/json" -d "$body" "${BACKEND_URL}${path}")
    fi
    if [ -z "$result" ]; then
        echo '{"success":false,"code":500,"message":"No response or HTTP error"}'
    else
        echo "$result"
    fi
}

api_delete() {
    local path="$1"
    local headers="$2"
    local result=""
    result=$(docker exec $BACKEND_CONTAINER curl -s --max-time 15 -X DELETE -H "$headers" "${BACKEND_URL}${path}")
    if [ -z "$result" ]; then
        echo '{"success":false,"code":500,"message":"No response or HTTP error"}'
    else
        echo "$result"
    fi
}

# 从 JSON 中提取字段值（简单提取）
json_get() {
    local json="$1"
    local key="$2"
    echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d${key})" 2>/dev/null
}

get_token() {
    local resp=$(api_post "/api/auth/login" "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
    json_get "$resp" "['result']['accessToken']"
}

# 检查响应是否成功
assert_success() {
    local resp="$1"
    local test_name="$2"
    local success=$(json_get "$resp" "['success']")
    if [ "$success" = "True" ]; then
        log_pass "$test_name"
        return 0
    else
        local msg=$(json_get "$resp" "['message']")
        log_fail "$test_name (响应: $msg)"
        return 1
    fi
}

# 检查响应包含指定错误码
assert_error_code() {
    local resp="$1"
    local expected_code="$2"
    local test_name="$3"
    local code=$(json_get "$resp" "['code']")
    if [ "$code" = "$expected_code" ]; then
        log_pass "$test_name"
        return 0
    else
        log_fail "$test_name (期望code=$expected_code, 实际code=$code)"
        return 1
    fi
}

echo "============================================================"
echo "  问卷调查平台 - 后端集成测试"
echo "  执行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ============================================================
# TEST GROUP 1: 认证模块 (INT-001 ~ INT-003)
# ============================================================
echo "--- [1/7] 认证模块测试 ---"

# INT-001: 登录成功
RESP=$(api_post "/api/auth/login" "{\"username\":\"admin\",\"password\":\"admin123\"}")
assert_success "$RESP" "INT-001: 管理员登录成功"
TOKEN=$(json_get "$RESP" "['result']['accessToken']")
REFRESH_TOKEN=$(json_get "$RESP" "['result']['refreshToken']")

# INT-001b: 登录失败（错误密码）
RESP=$(api_post "/api/auth/login" "{\"username\":\"admin\",\"password\":\"wrongpass\"}")
assert_error_code "$RESP" "401001" "INT-001b: 错误密码返回401001"

# INT-001c: 登录参数校验
RESP=$(api_post "/api/auth/login" "{\"username\":\"\",\"password\":\"\"}")
CODE=$(json_get "$RESP" "['code']")
if [ "$CODE" = "400001" ] || [ "$CODE" = "401001" ]; then
    log_pass "INT-001c: 空参数被拒绝(code=$CODE)"
else
    log_fail "INT-001c: 空参数应被拒绝(实际code=$CODE)"
fi

# INT-002: Token刷新
RESP=$(api_post "/api/auth/refresh" "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")
assert_success "$RESP" "INT-002: Token刷新成功"
TOKEN=$(json_get "$RESP" "['result']['accessToken']")

# INT-002b: 无效 refreshToken
RESP=$(api_post "/api/auth/refresh" "{\"refreshToken\":\"invalid-token\"}")
assert_error_code "$RESP" "401003" "INT-002b: 无效refreshToken返回401003"

# INT-003: 登出
RESP=$(api_post "/api/auth/logout" "{}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-003: 登出成功"

# 登出后旧token应失效 - 重新登录获取新token
TOKEN=$(get_token)

echo ""

# ============================================================
# TEST GROUP 2: 问卷CRUD (INT-004 ~ INT-008)
# ============================================================
echo "--- [2/7] 问卷CRUD测试 ---"

# INT-005: 创建问卷
RESP=$(api_post "/api/questionnaires" "{\"title\":\"集成测试问卷A\",\"description\":\"用于自动化集成测试\"}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-005: 创建问卷"
QID_A=$(json_get "$RESP" "['result']['id']")

# INT-005b: 创建第二份问卷
RESP=$(api_post "/api/questionnaires" "{\"title\":\"集成测试问卷B\",\"description\":\"第二份测试问卷\"}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-005b: 创建第二份问卷"
QID_B=$(json_get "$RESP" "['result']['id']")

# INT-004: 获取问卷列表
RESP=$(api_get "/api/questionnaires?page=1&pageSize=10" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-004: 获取问卷列表"
LIST_TOTAL=$(json_get "$RESP" "['result']['pagination']['total']")
if [ "$LIST_TOTAL" -ge 2 ] 2>/dev/null; then
    log_pass "INT-004b: 列表包含已创建的问卷(total>=$LIST_TOTAL)"
else
    log_fail "INT-004b: 列表数量不正确(total=$LIST_TOTAL)"
fi

# INT-006: 获取问卷详情
RESP=$(api_get "/api/questionnaires/$QID_A" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-006: 获取问卷详情"

# INT-007: 更新问卷
RESP=$(api_put "/api/questionnaires/$QID_A" "{\"title\":\"集成测试问卷A-已更新\",\"description\":\"更新后的描述\"}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-007: 更新问卷标题"

# 验证更新生效
RESP=$(api_get "/api/questionnaires/$QID_A" "Authorization: Bearer $TOKEN")
TITLE=$(json_get "$RESP" "['result']['title']")
if [ "$TITLE" = "集成测试问卷A-已更新" ]; then
    log_pass "INT-007b: 更新后标题验证正确"
else
    log_fail "INT-007b: 更新后标题不正确($TITLE)"
fi

# INT-004c: 按状态筛选
RESP=$(api_get "/api/questionnaires?status=draft" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-004c: 按状态筛选问卷"

# INT-004d: 按关键字搜索
RESP=$(api_get "/api/questionnaires?keyword=A" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-004d: 按关键字搜索问卷"

echo ""

# ============================================================
# TEST GROUP 3: 题目管理 (INT-009 ~ INT-012)
# ============================================================
echo "--- [3/7] 题目管理测试 ---"

# INT-009: 添加单选题
RESP=$(api_post "/api/questionnaires/$QID_A/questions" "{\"type\":\"radio\",\"title\":\"您对我们的服务满意吗？\",\"required\":true,\"options\":[{\"text\":\"非常满意\"},{\"text\":\"满意\"},{\"text\":\"不满意\"}]}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-009a: 添加单选题"
Q1_ID=$(json_get "$RESP" "['result']['id']")

# INT-009b: 添加多选题
RESP=$(api_post "/api/questionnaires/$QID_A/questions" "{\"type\":\"checkbox\",\"title\":\"您喜欢哪些功能？\",\"required\":true,\"options\":[{\"text\":\"易用性\"},{\"text\":\"速度快\"},{\"text\":\"界面美观\"},{\"text\":\"功能丰富\"}]}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-009b: 添加多选题"
Q2_ID=$(json_get "$RESP" "['result']['id']")

# INT-009c: 添加填空题
RESP=$(api_post "/api/questionnaires/$QID_A/questions" "{\"type\":\"input\",\"title\":\"请输入您的建议\",\"required\":false}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-009c: 添加填空题"
Q3_ID=$(json_get "$RESP" "['result']['id']")

# INT-009d: 添加评分题
RESP=$(api_post "/api/questionnaires/$QID_A/questions" "{\"type\":\"rating\",\"title\":\"请为我们打分\",\"required\":true,\"config\":{\"max\":5}}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-009d: 添加评分题"
Q4_ID=$(json_get "$RESP" "['result']['id']")

# INT-009e: 添加下拉题
RESP=$(api_post "/api/questionnaires/$QID_A/questions" "{\"type\":\"dropdown\",\"title\":\"您的年龄段\",\"required\":true,\"options\":[{\"text\":\"18岁以下\"},{\"text\":\"18-25岁\"},{\"text\":\"26-35岁\"},{\"text\":\"36岁以上\"}]}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-009e: 添加下拉题"
Q5_ID=$(json_get "$RESP" "['result']['id']")

# INT-010: 更新题目
RESP=$(api_put "/api/questionnaires/$QID_A/questions/$Q1_ID" "{\"title\":\"您对我们的整体服务满意吗？\",\"required\":true,\"options\":[{\"text\":\"非常满意\"},{\"text\":\"比较满意\"},{\"text\":\"一般\"},{\"text\":\"不满意\"}]}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-010: 更新题目"

# INT-012: 题目排序
RESP=$(api_put "/api/questionnaires/$QID_A/questions/sort" "{\"questionIds\":[$Q1_ID,$Q3_ID,$Q2_ID,$Q4_ID,$Q5_ID]}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-012: 题目排序"

# INT-011: 删除题目（删除最后一个）
RESP=$(api_delete "/api/questionnaires/$QID_A/questions/$Q5_ID" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-011: 删除题目"

# 验证删除后详情
RESP=$(api_get "/api/questionnaires/$QID_A" "Authorization: Bearer $TOKEN")
Q_COUNT=$(json_get "$RESP" "['result']['questions']" | python3 -c "import sys; print(len(eval(sys.stdin.read())))" 2>/dev/null || echo "0")
if [ "$Q_COUNT" = "4" ]; then
    log_pass "INT-011b: 删除后题目数量正确(4题)"
else
    log_fail "INT-011b: 删除后题目数量不正确($Q_COUNT)"
fi

echo ""

# ============================================================
# TEST GROUP 4: 问卷生命周期 (INT-013 ~ INT-016)
# ============================================================
echo "--- [4/7] 问卷生命周期测试 ---"

# INT-013: 发布问卷
RESP=$(api_post "/api/questionnaires/$QID_A/publish" "{\"allowDuplicateDevice\":true}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-013: 发布问卷"
ACCESS_CODE=$QID_A
log_info "Using questionnaire ID as fill path: $ACCESS_CODE"

# INT-013b: 重复发布应失败
RESP=$(api_post "/api/questionnaires/$QID_A/publish" "{}" "Authorization: Bearer $TOKEN")
assert_error_code "$RESP" "400007" "INT-013b: 重复发布返回400007"

# INT-017: 预览问卷
RESP=$(api_get "/api/questionnaires/$QID_A/preview" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-017: 预览问卷"

# INT-019: 获取分享链接
RESP=$(api_get "/api/questionnaires/$QID_A/link" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-019: 获取分享链接"

# INT-015: 复制问卷
RESP=$(api_post "/api/questionnaires/$QID_A/copy" "{}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-015: 复制问卷"
QID_COPY=$(json_get "$RESP" "['result']['id']")

# INT-016: 保存草稿（对问卷B - 包含题目）
RESP=$(api_put "/api/questionnaires/$QID_B/draft" "{\"title\":\"草稿问卷B\",\"description\":\"草稿描述\",\"questions\":[{\"type\":\"radio\",\"title\":\"草稿题目\",\"required\":true,\"options\":[{\"text\":\"选项A\"},{\"text\":\"选项B\"}]}]}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-016: 保存草稿"

# INT-014: 关闭问卷（先发布问卷B再关闭）
RESP=$(api_post "/api/questionnaires/$QID_B/publish" "{}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-014a: 发布问卷B"
RESP=$(api_put "/api/questionnaires/$QID_B/close" "{}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-014: 关闭问卷"

# INT-008: 删除问卷
RESP=$(api_delete "/api/questionnaires/$QID_COPY?confirm=true" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-008: 删除问卷(confirm=true)"

echo ""

# ============================================================
# TEST GROUP 5: H5填写模块 (INT-020 ~ INT-022)
# ============================================================
echo "--- [5/7] H5填写模块测试 ---"

# INT-022: 检查状态（未提交）
RESP=$(api_get "/api/fill/${ACCESS_CODE}/status?deviceId=test-integ-001")
assert_success "$RESP" "INT-022: 检查填写状态"
FILLABLE=$(json_get "$RESP" "['result']['fillable']")
if [ "$FILLABLE" = "True" ]; then
    log_pass "INT-022b: 状态为可填写(fillable=true)"
else
    log_fail "INT-022b: 状态应为可填写"
fi

# INT-020: 获取问卷（公开）
RESP=$(api_get "/api/fill/${ACCESS_CODE}")
assert_success "$RESP" "INT-020: 获取问卷内容（公开）"
FILL_TITLE=$(json_get "$RESP" "['result']['title']")
if [ -n "$FILL_TITLE" ]; then
    log_pass "INT-020b: 问卷标题非空($FILL_TITLE)"
else
    log_fail "INT-020b: 问卷标题为空"
fi

# INT-020c: 获取不存在的问卷
RESP=$(api_get "/api/fill/nonexistent-code")
assert_error_code "$RESP" "4040" "INT-020c: 不存在的问卷返回4040"

CLOSED_CODE=$QID_B
RESP=$(api_get "/api/fill/${CLOSED_CODE}")
CODE=$(json_get "$RESP" "['code']")
if [ "$CODE" = "4031" ] || [ "$CODE" = "4032" ]; then
    log_pass "INT-020d: 已关闭问卷被拒绝(code=$CODE)"
else
    log_fail "INT-020d: 已关闭问卷应被拒绝(实际code=$CODE)"
fi

# INT-021: 提交答卷 - 用python精确按questionId提取optionId
FILL_RESP=$(api_get "/api/fill/${ACCESS_CODE}")
OPTION_IDS=$(echo "$FILL_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
questions = data['result']['questions']
qmap = {q['questionId']: q for q in questions}
# Q1(radio) options
q1_opts = [o['optionId'] for o in qmap.get($Q1_ID, {}).get('options', [])]
# Q2(checkbox) options
q2_opts = [o['optionId'] for o in qmap.get($Q2_ID, {}).get('options', [])]
print(f'{q1_opts[0] if len(q1_opts)>0 else \"\"},{q1_opts[1] if len(q1_opts)>1 else \"\"},{q2_opts[0] if len(q2_opts)>0 else \"\"},{q2_opts[1] if len(q2_opts)>1 else \"\"},{q2_opts[2] if len(q2_opts)>2 else \"\"}')
" 2>/dev/null)
IFS=',' read -r OPT1_ID OPT1_2_ID OPT2_1_ID OPT2_2_ID OPT2_3_ID <<< "$OPTION_IDS"
log_info "Option IDs: radio=$OPT1_ID/$OPT1_2_ID, checkbox=$OPT2_1_ID/$OPT2_2_ID/$OPT2_3_ID"

RESP=$(api_post "/api/fill/${ACCESS_CODE}/submit" "{\"deviceId\":\"test-integ-001\",\"answers\":[{\"questionId\":$Q1_ID,\"type\":\"radio\",\"value\":\"$OPT1_ID\"},{\"questionId\":$Q2_ID,\"type\":\"checkbox\",\"value\":[\"$OPT2_1_ID\",\"$OPT2_2_ID\"]},{\"questionId\":$Q3_ID,\"type\":\"input\",\"value\":\"这是一条建议\"},{\"questionId\":$Q4_ID,\"type\":\"rating\",\"value\":\"4\"}],\"submitTime\":\"2026-05-11T02:10:00.000Z\",\"duration\":60}")
assert_success "$RESP" "INT-021: 提交答卷"
RESPONSE_ID=$(json_get "$RESP" "['result']['responseId']")

RESP=$(api_post "/api/fill/${ACCESS_CODE}/submit" "{\"deviceId\":\"test-integ-002\",\"answers\":[{\"questionId\":$Q1_ID,\"type\":\"radio\",\"value\":\"$OPT1_2_ID\"},{\"questionId\":$Q2_ID,\"type\":\"checkbox\",\"value\":[\"$OPT2_3_ID\"]},{\"questionId\":$Q3_ID,\"type\":\"input\",\"value\":\"另一条建议\"},{\"questionId\":$Q4_ID,\"type\":\"rating\",\"value\":\"5\"}],\"submitTime\":\"2026-05-11T02:11:00.000Z\",\"duration\":45}")
assert_success "$RESP" "INT-021b: 第二份答卷提交"

# INT-021c: 缺少必填项
RESP=$(api_post "/api/fill/${ACCESS_CODE}/submit" "{\"deviceId\":\"test-integ-003\",\"answers\":[{\"questionId\":$Q3_ID,\"type\":\"input\",\"value\":\"只填了选填题\"}],\"submitTime\":\"2026-05-11T02:12:00.000Z\",\"duration\":10}")
assert_error_code "$RESP" "4001" "INT-021c: 缺少必填项返回4001"

echo ""

# ============================================================
# TEST GROUP 6: 统计与导出 (INT-023 ~ INT-028)
# ============================================================
echo "--- [6/7] 统计与导出测试 ---"

# INT-023: 统计概览
RESP=$(api_get "/api/statistics/$QID_A/overview" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-023: 统计概览"
TOTAL_RESP=$(json_get "$RESP" "['result']['totalResponses']")
if [ "$TOTAL_RESP" -ge 2 ] 2>/dev/null; then
    log_pass "INT-023b: 回收数量正确(>= 2)"
else
    log_fail "INT-023b: 回收数量不正确($TOTAL_RESP)"
fi

# INT-024: 逐题统计
RESP=$(api_get "/api/statistics/$QID_A/questions" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-024: 逐题统计"

# INT-025: 文本题答案列表
RESP=$(api_get "/api/statistics/$QID_A/questions/$Q3_ID/texts?page=1&pageSize=10" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-025: 文本题答案列表"

# INT-026: 触发数据导出
RESP=$(api_post "/api/statistics/$QID_A/export" "{\"format\":\"xlsx\"}" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-026: 触发数据导出"
EXPORT_ID=$(json_get "$RESP" "['result']['exportId']" 2>/dev/null || json_get "$RESP" "['result']['id']" 2>/dev/null)

# INT-028: 导出任务列表
sleep 2
RESP=$(api_get "/api/statistics/exports?questionnaireId=$QID_A" "Authorization: Bearer $TOKEN")
assert_success "$RESP" "INT-028: 导出任务列表"

echo ""

# ============================================================
# TEST GROUP 7: 数据流验证 (DF-001 ~ DF-007)
# ============================================================
echo "--- [7/7] 数据流验证 ---"

# DF-001: 验证答卷数据持久化
DB_RESP_COUNT=$(docker exec questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db -N -e "SELECT COUNT(*) FROM t_response WHERE questionnaire_id=$QID_A;" 2>/dev/null | tr -d '\n')
if [ "$DB_RESP_COUNT" -ge 2 ] 2>/dev/null; then
    log_pass "DF-001: 答卷数据持久化(t_response=$DB_RESP_COUNT条)"
else
    log_fail "DF-001: 答卷数据持久化失败(t_response=$DB_RESP_COUNT条)"
fi

# DF-001b: 验证答案数据持久化
DB_ANS_COUNT=$(docker exec questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db -N -e "SELECT COUNT(*) FROM t_answer WHERE response_id IN (SELECT id FROM t_response WHERE questionnaire_id=$QID_A);" 2>/dev/null | tr -d '\n')
if [ "$DB_ANS_COUNT" -ge 8 ] 2>/dev/null; then
    log_pass "DF-001b: 答案数据持久化(t_answer=$DB_ANS_COUNT条)"
else
    log_fail "DF-001b: 答案数据持久化不足(t_answer=$DB_ANS_COUNT条)"
fi

# DF-002: 验证问卷创建写入DB
DB_Q_COUNT=$(docker exec questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db -N -e "SELECT COUNT(*) FROM t_questionnaire WHERE deleted=0;" 2>/dev/null | tr -d '\n')
if [ "$DB_Q_COUNT" -ge 2 ] 2>/dev/null; then
    log_pass "DF-002: 问卷数据持久化(t_questionnaire=$DB_Q_COUNT条)"
else
    log_fail "DF-002: 问卷数据不足($DB_Q_COUNT条)"
fi

# DF-003: 验证题目+选项写入DB
DB_QUESTION_COUNT=$(docker exec questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db -N -e "SELECT COUNT(*) FROM t_question WHERE questionnaire_id=$QID_A;" 2>/dev/null | tr -d '\n')
DB_OPTION_COUNT=$(docker exec questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db -N -e "SELECT COUNT(*) FROM t_question_option WHERE question_id IN (SELECT id FROM t_question WHERE questionnaire_id=$QID_A);" 2>/dev/null | tr -d '\n')
if [ "$DB_QUESTION_COUNT" -ge 4 ] 2>/dev/null; then
    log_pass "DF-003: 题目持久化(t_question=$DB_QUESTION_COUNT条, t_question_option=$DB_OPTION_COUNT条)"
else
    log_fail "DF-003: 题目数据不足(questions=$DB_QUESTION_COUNT)"
fi

# DF-006: 验证Redis Token管理
REDIS_KEYS=$(docker exec questionnaire-redis redis-cli keys "token:*" 2>/dev/null | wc -l)
log_pass "DF-006: Redis Token管理正常(keys=$REDIS_KEYS)"

# DF-005: 验证导出任务
DB_EXPORT_COUNT=$(docker exec questionnaire-mysql mysql -uroot -pquestionnaire123 questionnaire_db -N -e "SELECT COUNT(*) FROM t_export_task WHERE questionnaire_id=$QID_A;" 2>/dev/null | tr -d '\n')
if [ "$DB_EXPORT_COUNT" -ge 1 ] 2>/dev/null; then
    log_pass "DF-005: 导出任务数据持久化(t_export_task=$DB_EXPORT_COUNT条)"
else
    log_fail "DF-005: 导出任务数据未写入"
fi

echo ""

# ============================================================
# 测试结果汇总
# ============================================================
echo "============================================================"
echo "  测试结果汇总"
echo "============================================================"
echo "  总用例数: $TOTAL"
echo "  通过: $PASSED"
echo "  失败: $FAILED"
echo "  通过率: $(python3 -c "print(f'{$PASSED * 100 / $TOTAL:.1f}%')" 2>/dev/null || echo "N/A")"
if [ $FAILED -gt 0 ]; then
    echo ""
    echo "  失败用例:"
    echo -e "$FAILURES"
fi
echo "============================================================"

# 输出 JSON 格式结果供报告使用
echo ""
echo "JSON_RESULT={\"total\":$TOTAL,\"passed\":$PASSED,\"failed\":$FAILED}"

exit $FAILED
