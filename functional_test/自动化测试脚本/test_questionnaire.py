# -*- coding: utf-8 -*-
import requests
import pytest
from config import Endpoints, ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT


class TestCreateQuestionnaire:

    def test_tc_qn_001(self, auth_headers):
        resp = requests.post(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            json={"title": "员工满意度调查", "description": "2024年度员工满意度调查问卷"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        assert data["success"] is True
        assert data["code"] == 200
        result = data["result"]
        assert result["id"] is not None
        assert result["title"] == "员工满意度调查"
        assert result["status"] == "draft"

        requests.delete(
            Endpoints.questionnaire_detail(result["id"]),
            headers=auth_headers,
            params={"confirm": "true"},
            timeout=REQUEST_TIMEOUT,
        )

    def test_tc_qn_002(self, auth_headers):
        resp = requests.post(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            json={"title": "", "description": "测试描述"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 400
        assert data["success"] is False

    def test_tc_qn_003(self, auth_headers):
        title = "测" * 101
        resp = requests.post(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            json={"title": title, "description": "超长标题测试"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 400
        assert data["success"] is False

    def test_tc_qn_004(self, auth_headers):
        title = "测" * 100
        resp = requests.post(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            json={"title": title, "description": "边界值标题测试"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        assert data["success"] is True

        requests.delete(
            Endpoints.questionnaire_detail(data["result"]["id"]),
            headers=auth_headers,
            params={"confirm": "true"},
            timeout=REQUEST_TIMEOUT,
        )


class TestListQuestionnaire:

    def test_tc_qn_005(self, auth_headers):
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        result = data["result"]
        assert "page" in result
        assert "pageSize" in result
        assert "total" in result
        assert "list" in result

    def test_tc_qn_006(self, auth_headers, create_questionnaire):
        create_questionnaire("草稿状态筛选测试", "用于状态筛选")
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            params={"status": "draft"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        for item in data["result"]["list"]:
            assert item["status"] == "draft"

    def test_tc_qn_007(self, auth_headers, create_questionnaire):
        create_questionnaire("满意度专项调查", "关键字搜索测试")
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            params={"keyword": "满意度"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        assert len(data["result"]["list"]) > 0
        for item in data["result"]["list"]:
            match = "满意度" in item.get("title", "") or "满意度" in item.get("description", "")
            assert match

    def test_tc_qn_008(self, auth_headers):
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            params={"sortBy": "createdAt", "sortOrder": "asc"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        items = data["result"]["list"]
        if len(items) >= 2:
            for i in range(len(items) - 1):
                assert items[i]["createdAt"] <= items[i + 1]["createdAt"]

    def test_tc_qn_009(self, auth_headers):
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            params={"page": 2, "pageSize": 5},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        result = data["result"]
        assert result["page"] == 2
        assert result["pageSize"] == 5
        assert len(result["list"]) <= 5


class TestGetQuestionnaire:

    def test_tc_qn_010(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("详情查询测试", "测试获取问卷详情")
        resp = requests.get(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        result = data["result"]
        assert result["id"] == qid
        assert "title" in result
        assert "description" in result
        assert "status" in result
        assert "createdAt" in result

    def test_tc_qn_011(self, auth_headers):
        resp = requests.get(
            Endpoints.questionnaire_detail(999999999),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404
        assert data["code"] == 404001


class TestUpdateQuestionnaire:

    def test_tc_qn_012(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("更新前标题", "更新前描述")
        resp = requests.put(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            json={"title": "更新后标题", "description": "更新后描述"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200

        get_resp = requests.get(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        result = get_resp.json()["result"]
        assert result["title"] == "更新后标题"
        assert result["description"] == "更新后描述"

    def test_tc_qn_013(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("空标题更新测试", "测试描述")
        resp = requests.put(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            json={"title": "", "description": "更新描述"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 400
        assert data["success"] is False

    def test_tc_qn_014(self, auth_headers):
        resp = requests.put(
            Endpoints.questionnaire_detail(999999999),
            headers=auth_headers,
            json={"title": "不存在的问卷", "description": "测试"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404
        assert data["code"] == 404001


class TestDeleteQuestionnaire:

    def test_tc_qn_015(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("删除测试问卷", "无回收数据删除")
        resp = requests.delete(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            params={"confirm": "false"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200

        get_resp = requests.get(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert get_resp.status_code == 404

    def _create_questionnaire_with_response(self, auth_headers):
        create_resp = requests.post(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            json={"title": "有回收数据的问卷", "description": "删除测试"},
            timeout=REQUEST_TIMEOUT,
        )
        assert create_resp.status_code == 200
        qid = create_resp.json()["result"]["id"]

        q_resp = requests.post(
            Endpoints.questionnaire_questions(qid),
            headers=auth_headers,
            json={
                "type": "radio",
                "title": "测试单选题",
                "required": True,
                "options": [{"content": "选项A"}, {"content": "选项B"}],
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert q_resp.status_code == 200
        question_id = q_resp.json()["result"]["id"]

        option_resp = requests.get(
            Endpoints.questionnaire_question_detail(qid, question_id),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        if option_resp.status_code == 200:
            q_data = option_resp.json()["result"]
            options = q_data.get("options", [])
            first_option_id = options[0]["id"] if options else None
        else:
            first_option_id = None

        pub_resp = requests.post(
            Endpoints.questionnaire_publish(qid),
            headers=auth_headers,
            json={},
            timeout=REQUEST_TIMEOUT,
        )
        assert pub_resp.status_code == 200

        pub_result = pub_resp.json().get("result", {})
        access_code = pub_result.get("accessCode", "")
        if not access_code:
            link_resp = requests.get(
                Endpoints.questionnaire_link(qid),
                headers=auth_headers,
                timeout=REQUEST_TIMEOUT,
            )
            if link_resp.status_code == 200:
                access_code = link_resp.json().get("result", {}).get("accessCode", "")

        fill_resp = requests.get(
            Endpoints.fill_get(access_code),
            timeout=REQUEST_TIMEOUT,
        )
        assert fill_resp.status_code == 200
        fill_data = fill_resp.json()["result"]
        fill_questions = fill_data.get("questions", [])

        if fill_questions and first_option_id is None:
            first_q = fill_questions[0]
            opts = first_q.get("options", [])
            if opts:
                first_option_id = opts[0]["id"]

        answers = [{"questionId": question_id, "type": "radio", "answer": {"optionIds": [first_option_id]}}]
        submit_resp = requests.post(
            Endpoints.fill_submit(access_code),
            json={"answers": answers},
            timeout=REQUEST_TIMEOUT,
        )
        assert submit_resp.status_code == 200

        return qid

    def test_tc_qn_016(self, auth_headers):
        qid = self._create_questionnaire_with_response(auth_headers)
        try:
            resp = requests.delete(
                Endpoints.questionnaire_detail(qid),
                headers=auth_headers,
                params={"confirm": "false"},
                timeout=REQUEST_TIMEOUT,
            )
            data = resp.json()
            assert resp.status_code == 400
            assert data["code"] == 400010
        finally:
            requests.delete(
                Endpoints.questionnaire_detail(qid),
                headers=auth_headers,
                params={"confirm": "true"},
                timeout=REQUEST_TIMEOUT,
            )

    def test_tc_qn_017(self, auth_headers):
        qid = self._create_questionnaire_with_response(auth_headers)
        resp = requests.delete(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            params={"confirm": "true"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200

        get_resp = requests.get(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert get_resp.status_code == 404

    def test_tc_qn_018(self, auth_headers):
        resp = requests.delete(
            Endpoints.questionnaire_detail(999999999),
            headers=auth_headers,
            params={"confirm": "false"},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404
        assert data["code"] == 404001


class TestCopyQuestionnaire:

    def test_tc_qn_019(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = requests.post(
            Endpoints.questionnaire_copy(qid),
            headers=auth_headers,
            json={},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        assert data["result"]["id"] != qid
        assert data["result"]["status"] == "draft"

        requests.delete(
            Endpoints.questionnaire_detail(data["result"]["id"]),
            headers=auth_headers,
            params={"confirm": "true"},
            timeout=REQUEST_TIMEOUT,
        )

    def test_tc_qn_020(self, auth_headers):
        resp = requests.post(
            Endpoints.questionnaire_copy(999999999),
            headers=auth_headers,
            json={},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404
        assert data["code"] == 404001


class TestDraftQuestionnaire:

    def test_tc_qn_021(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("草稿保存测试", "含题目的草稿保存")
        questions = [
            {
                "type": "radio",
                "title": "草稿单选题",
                "required": True,
                "options": [{"content": "选项1"}, {"content": "选项2"}],
            },
            {
                "type": "input",
                "title": "草稿填空题",
                "required": False,
            },
        ]
        resp = requests.put(
            Endpoints.questionnaire_draft(qid),
            headers=auth_headers,
            json={"title": "草稿保存测试", "description": "含题目的草稿保存", "questions": questions},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200

        detail_resp = requests.get(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        detail = detail_resp.json()["result"]
        assert detail.get("questions") is not None or detail.get("questionCount", 0) > 0

    def test_tc_qn_022(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()

        pub_resp = requests.post(
            Endpoints.questionnaire_publish(qid),
            headers=auth_headers,
            json={},
            timeout=REQUEST_TIMEOUT,
        )
        assert pub_resp.status_code == 200

        resp = requests.put(
            Endpoints.questionnaire_draft(qid),
            headers=auth_headers,
            json={"title": "已发布问卷保存草稿", "description": "应失败", "questions": []},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 400
        assert data["code"] == 400009

    def test_tc_qn_023(self, auth_headers):
        resp = requests.put(
            Endpoints.questionnaire_draft(999999999),
            headers=auth_headers,
            json={"title": "不存在", "description": "不存在", "questions": []},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404
        assert data["code"] == 404001

    def test_tc_qn_024(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("仅基本信息草稿", "无题目保存")
        resp = requests.put(
            Endpoints.questionnaire_draft(qid),
            headers=auth_headers,
            json={"title": "仅基本信息草稿", "description": "无题目保存", "questions": []},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200


class TestPreviewQuestionnaire:

    def test_tc_qn_025(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = requests.get(
            Endpoints.questionnaire_preview(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        result = data["result"]
        assert "title" in result
        assert "description" in result
        assert "questions" in result
        assert len(result["questions"]) > 0

    def test_tc_qn_026(self, auth_headers):
        resp = requests.get(
            Endpoints.questionnaire_preview(999999999),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404
        assert data["code"] == 404001


class TestAuthRequired:

    def test_tc_qn_027(self):
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401

    def test_tc_qn_028(self):
        resp = requests.get(
            Endpoints.QUESTIONNAIRES,
            headers={"Authorization": "Bearer invalid_token_abc123"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401
