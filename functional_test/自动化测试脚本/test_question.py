# -*- coding: utf-8 -*-
import pytest
import requests
from config import Endpoints, ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT


def _add_question(auth_headers, qnr_id, payload):
    resp = requests.post(
        Endpoints.questionnaire_questions(qnr_id),
        headers=auth_headers,
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )
    return resp


def _add_simple_input(auth_headers, qnr_id, title="填空题"):
    return _add_question(auth_headers, qnr_id, {
        "type": "input",
        "title": title,
        "required": False,
    })


def _get_questionnaire(auth_headers, qnr_id):
    return requests.get(
        Endpoints.questionnaire_detail(qnr_id),
        headers=auth_headers,
        timeout=REQUEST_TIMEOUT,
    )


class TestAddQuestion:

    def test_tc_qs_001(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "radio",
            "title": "您的性别是？",
            "required": True,
            "options": [
                {"content": "男"},
                {"content": "女"},
                {"content": "保密"},
            ],
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        result = data["result"]
        assert result["id"], "题目ID不应为空"
        assert result["type"] == "radio"
        assert result["title"] == "您的性别是？"
        assert result["required"] is True
        assert len(result["options"]) == 3
        for opt in result["options"]:
            assert "id" in opt
            assert "content" in opt

        detail = _get_questionnaire(auth_headers, qnr_id).json()
        question_ids = [q["id"] for q in detail["result"]["questions"]]
        assert result["id"] in question_ids

    def test_tc_qs_002(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "checkbox",
            "title": "您喜欢以下哪些编程语言？（至少选2项，最多选4项）",
            "required": True,
            "options": [
                {"content": "Java"},
                {"content": "Python"},
                {"content": "JavaScript"},
                {"content": "Go"},
                {"content": "Rust"},
            ],
            "config": {"minSelect": 2, "maxSelect": 4},
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        result = resp.json()["result"]
        assert result["type"] == "checkbox"
        assert len(result["options"]) == 5
        assert result["config"]["minSelect"] == 2
        assert result["config"]["maxSelect"] == 4

    def test_tc_qs_003(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "input",
            "title": "请简述您的工作经历",
            "required": False,
            "config": {"maxLength": 1000},
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        result = resp.json()["result"]
        assert result["type"] == "input"
        assert result["title"] == "请简述您的工作经历"
        assert result["required"] is False
        assert result["config"]["maxLength"] == 1000
        assert not result.get("options") or len(result["options"]) == 0

    def test_tc_qs_004(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "rating",
            "title": "请对本次服务进行评分",
            "required": True,
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        result = resp.json()["result"]
        assert result["type"] == "rating"
        assert result["title"] == "请对本次服务进行评分"
        assert result["config"]["maxRating"] == 5

    def test_tc_qs_005(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "dropdown",
            "title": "请选择您所在的城市",
            "required": True,
            "options": [
                {"content": "北京"},
                {"content": "上海"},
                {"content": "广州"},
                {"content": "深圳"},
            ],
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        result = resp.json()["result"]
        assert result["type"] == "dropdown"
        assert result["title"] == "请选择您所在的城市"
        assert len(result["options"]) == 4
        contents = [o["content"] for o in result["options"]]
        assert contents == ["北京", "上海", "广州", "深圳"]

    def test_tc_qs_006(self, auth_headers):
        resp = _add_question(auth_headers, 999999, {
            "type": "radio",
            "title": "测试题目",
            "required": True,
            "options": [
                {"content": "选项A"},
                {"content": "选项B"},
            ],
        })
        assert resp.status_code == 404, f"期望404, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 404001


class TestUpdateQuestion:

    def test_tc_qs_007(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        add_resp = _add_question(auth_headers, qnr_id, {
            "type": "radio",
            "title": "您的性别是？",
            "required": True,
            "options": [
                {"content": "男"},
                {"content": "女"},
                {"content": "保密"},
            ],
        })
        assert add_resp.status_code == 200
        q_id = add_resp.json()["result"]["id"]

        update_resp = requests.put(
            Endpoints.questionnaire_question_detail(qnr_id, q_id),
            headers=auth_headers,
            json={
                "title": "您的年龄段是？（修改后）",
                "required": False,
                "options": [
                    {"content": "18岁以下"},
                    {"content": "18-25岁"},
                    {"content": "26-35岁"},
                    {"content": "36岁以上"},
                ],
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert update_resp.status_code == 200, f"期望200, 实际{update_resp.status_code}: {update_resp.text}"
        result = update_resp.json()["result"]
        assert result["title"] == "您的年龄段是？（修改后）"
        assert result["required"] is False
        assert len(result["options"]) == 4

        detail = _get_questionnaire(auth_headers, qnr_id).json()
        q = next(q for q in detail["result"]["questions"] if q["id"] == q_id)
        assert q["title"] == "您的年龄段是？（修改后）"

    def test_tc_qs_008(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        add_resp = _add_question(auth_headers, qnr_id, {
            "type": "checkbox",
            "title": "您喜欢以下哪些编程语言？（至少选2项，最多选4项）",
            "required": True,
            "options": [
                {"content": "Java"},
                {"content": "Python"},
                {"content": "JavaScript"},
                {"content": "Go"},
                {"content": "Rust"},
            ],
            "config": {"minSelect": 2, "maxSelect": 4},
        })
        assert add_resp.status_code == 200
        q_id = add_resp.json()["result"]["id"]

        update_resp = requests.put(
            Endpoints.questionnaire_question_detail(qnr_id, q_id),
            headers=auth_headers,
            json={
                "title": "您喜欢以下哪些编程语言？（至少选1项，最多选3项）",
                "required": True,
                "options": [
                    {"content": "Java"},
                    {"content": "Python"},
                    {"content": "JavaScript"},
                    {"content": "Go"},
                    {"content": "Rust"},
                    {"content": "C++"},
                ],
                "config": {"minSelect": 1, "maxSelect": 3},
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert update_resp.status_code == 200, f"期望200, 实际{update_resp.status_code}: {update_resp.text}"
        result = update_resp.json()["result"]
        assert result["config"]["minSelect"] == 1
        assert result["config"]["maxSelect"] == 3
        assert len(result["options"]) == 6

    def test_tc_qs_009(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = requests.put(
            Endpoints.questionnaire_question_detail(qnr_id, 999999),
            headers=auth_headers,
            json={"title": "不存在的题目", "required": True},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 404, f"期望404, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 404002


class TestDeleteQuestion:

    def test_tc_qs_010(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        add_resp = _add_question(auth_headers, qnr_id, {
            "type": "radio",
            "title": "待删除题目",
            "required": True,
            "options": [
                {"content": "选项A"},
                {"content": "选项B"},
            ],
        })
        assert add_resp.status_code == 200
        q_id = add_resp.json()["result"]["id"]

        del_resp = requests.delete(
            Endpoints.questionnaire_question_detail(qnr_id, q_id),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert del_resp.status_code == 200, f"期望200, 实际{del_resp.status_code}: {del_resp.text}"

        detail = _get_questionnaire(auth_headers, qnr_id).json()
        question_ids = [q["id"] for q in detail["result"].get("questions", [])]
        assert q_id not in question_ids

    def test_tc_qs_011(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = requests.delete(
            Endpoints.questionnaire_question_detail(qnr_id, 999999),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 404, f"期望404, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 404002


class TestSortQuestions:

    def _create_3_questions(self, auth_headers, qnr_id):
        ids = []
        for i in range(1, 4):
            resp = _add_simple_input(auth_headers, qnr_id, f"排序测试题{i}")
            assert resp.status_code == 200, f"创建第{i}题失败: {resp.text}"
            ids.append(resp.json()["result"]["id"])
        return ids

    def test_tc_qs_012(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        q1, q2, q3 = self._create_3_questions(auth_headers, qnr_id)

        sort_resp = requests.put(
            Endpoints.questionnaire_questions_sort(qnr_id),
            headers=auth_headers,
            json={"questionIds": [q3, q1, q2]},
            timeout=REQUEST_TIMEOUT,
        )
        assert sort_resp.status_code == 200, f"期望200, 实际{sort_resp.status_code}: {sort_resp.text}"

        detail = _get_questionnaire(auth_headers, qnr_id).json()
        ordered_ids = [q["id"] for q in detail["result"]["questions"]]
        assert ordered_ids == [q3, q1, q2]

    def test_tc_qs_013(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        q1, q2, q3 = self._create_3_questions(auth_headers, qnr_id)

        resp = requests.put(
            Endpoints.questionnaire_questions_sort(qnr_id),
            headers=auth_headers,
            json={"questionIds": [q1, q2]},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 400, f"期望400, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 400004

    def test_tc_qs_014(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        q1_resp = _add_simple_input(auth_headers, qnr_id, "排序题1")
        q2_resp = _add_simple_input(auth_headers, qnr_id, "排序题2")
        assert q1_resp.status_code == 200
        assert q2_resp.status_code == 200
        q1 = q1_resp.json()["result"]["id"]
        q2 = q2_resp.json()["result"]["id"]

        resp = requests.put(
            Endpoints.questionnaire_questions_sort(qnr_id),
            headers=auth_headers,
            json={"questionIds": [q1, q2, 999999]},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 400, f"期望400, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 400004


class TestOptionCountValidation:

    def test_tc_qs_015(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "radio",
            "title": "只有一个选项的单选题",
            "required": True,
            "options": [{"content": "唯一选项"}],
        })
        assert resp.status_code == 400, f"期望400, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 400002

    def test_tc_qs_016(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        options = [{"content": f"选项{i}"} for i in range(1, 22)]
        resp = _add_question(auth_headers, qnr_id, {
            "type": "checkbox",
            "title": "选项过多的多选题",
            "required": True,
            "options": options,
        })
        assert resp.status_code == 400, f"期望400, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 400002

    def test_tc_qs_017(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        resp = _add_question(auth_headers, qnr_id, {
            "type": "radio",
            "title": "恰好两个选项的单选题",
            "required": True,
            "options": [
                {"content": "是"},
                {"content": "否"},
            ],
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        assert len(resp.json()["result"]["options"]) == 2


class TestQuestionCountLimit:

    @pytest.mark.slow
    def test_tc_qs_018(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        for i in range(1, 51):
            r = _add_simple_input(auth_headers, qnr_id, f"批量题目{i}")
            assert r.status_code == 200, f"添加第{i}题失败: {r.text}"

        detail = _get_questionnaire(auth_headers, qnr_id).json()
        assert len(detail["result"]["questions"]) == 50

        resp = _add_simple_input(auth_headers, qnr_id, "第51题-应被拒绝")
        assert resp.status_code == 400, f"期望400, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["code"] == 400003

    @pytest.mark.slow
    def test_tc_qs_019(self, auth_headers, create_questionnaire):
        qnr_id = create_questionnaire()
        for i in range(1, 50):
            r = _add_simple_input(auth_headers, qnr_id, f"批量题目{i}")
            assert r.status_code == 200, f"添加第{i}题失败: {r.text}"

        resp = _add_simple_input(auth_headers, qnr_id, "第50题-恰好达到上限")
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        assert resp.json()["result"]["title"] == "第50题-恰好达到上限"

        detail = _get_questionnaire(auth_headers, qnr_id).json()
        assert len(detail["result"]["questions"]) == 50
