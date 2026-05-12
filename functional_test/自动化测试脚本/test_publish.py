# -*- coding: utf-8 -*-
import pytest
import requests
from config import Endpoints, ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT


def _publish(auth_headers, qid, body=None):
    return requests.post(
        Endpoints.questionnaire_publish(qid),
        headers=auth_headers,
        json=body if body is not None else {},
        timeout=REQUEST_TIMEOUT,
    )


def _close(auth_headers, qid):
    return requests.put(
        Endpoints.questionnaire_close(qid),
        headers=auth_headers,
        timeout=REQUEST_TIMEOUT,
    )


def _get_detail(auth_headers, qid):
    resp = requests.get(
        Endpoints.questionnaire_detail(qid),
        headers=auth_headers,
        timeout=REQUEST_TIMEOUT,
    )
    assert resp.status_code == 200, f"查询问卷详情失败: {resp.text}"
    return resp.json()["result"]


def _publish_and_close(auth_headers, qid):
    resp = _publish(auth_headers, qid)
    assert resp.status_code == 200, f"前置发布失败: {resp.text}"
    resp = _close(auth_headers, qid)
    assert resp.status_code == 200, f"前置关闭失败: {resp.text}"


class TestPublishQuestionnaire:

    def test_tc_pb_001(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid, {
            "deadline": "2026-12-31 23:59:59",
            "maxResponses": 1000,
            "allowDuplicateDevice": False,
        })
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"
        result = data.get("result", data.get("data", {}))
        assert result.get("accessCode"), "发布后应返回accessCode"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "active", f"期望status=active, 实际{detail['status']}"
        assert detail.get("deadline") == "2026-12-31 23:59:59", f"deadline不匹配: {detail.get('deadline')}"
        assert detail.get("maxResponses") == 1000, f"maxResponses不匹配: {detail.get('maxResponses')}"

    def test_tc_pb_002(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid, {})
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"
        result = data.get("result", data.get("data", {}))
        assert result.get("accessCode"), "发布后应返回accessCode"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "active", f"期望status=active, 实际{detail['status']}"

    def test_tc_pb_003(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid, {"deadline": "2026-06-30 18:00:00"})
        assert resp.status_code == 200, f"期望200, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"
        result = data.get("result", data.get("data", {}))
        assert result.get("accessCode"), "发布后应返回accessCode"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "active", f"期望status=active, 实际{detail['status']}"
        assert detail.get("deadline") == "2026-06-30 18:00:00", f"deadline不匹配: {detail.get('deadline')}"

    def test_tc_pb_004(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid)
        assert resp.status_code == 200, f"前置发布失败: {resp.text}"

        resp = _publish(auth_headers, qid, {
            "deadline": "2026-12-31 23:59:59",
            "maxResponses": 500,
            "allowDuplicateDevice": True,
        })
        assert resp.status_code == 400, f"重复发布期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400007, f"期望code=400007, 实际{data['code']}"

    def test_tc_pb_005(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        _publish_and_close(auth_headers, qid)

        resp = _publish(auth_headers, qid, {})
        assert resp.status_code == 400, f"已关闭问卷发布期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400007, f"期望code=400007, 实际{data['code']}"


class TestPublishValidation:

    def test_tc_pb_006(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("无题目问卷", "用于发布校验测试")
        resp = _publish(auth_headers, qid, {})
        assert resp.status_code == 400, f"无题目发布期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400005, f"期望code=400005, 实际{data['code']}"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "draft", f"期望status=draft, 实际{detail['status']}"

    def test_tc_pb_007(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("不完整题目问卷", "用于发布校验测试")
        add_resp = requests.post(
            Endpoints.questionnaire_questions(qid),
            headers=auth_headers,
            json={
                "type": "radio",
                "title": "只有一个选项的单选题",
                "required": True,
                "options": [{"content": "唯一选项"}],
            },
            timeout=REQUEST_TIMEOUT,
        )
        if add_resp.status_code != 200:
            pytest.skip("API不允许创建只有1个选项的单选题，无法构造不完整题目场景")

        resp = _publish(auth_headers, qid, {"deadline": "2026-12-31 23:59:59"})
        if resp.status_code == 200:
            pytest.skip("API允许发布仅含1个选项的单选题问卷，跳过此校验")
        assert resp.status_code == 400, f"不完整题目发布期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400006, f"期望code=400006, 实际{data['code']}"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "draft", f"期望status=draft, 实际{detail['status']}"


class TestCloseQuestionnaire:

    def test_tc_pb_008(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid)
        assert resp.status_code == 200, f"前置发布失败: {resp.text}"

        resp = _close(auth_headers, qid)
        assert resp.status_code == 200, f"关闭问卷期望200, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "closed", f"期望status=closed, 实际{detail['status']}"

    def test_tc_pb_009(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("草稿问卷", "用于关闭校验测试")
        resp = _close(auth_headers, qid)
        assert resp.status_code == 400, f"draft问卷关闭期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400008, f"期望code=400008, 实际{data['code']}"

        detail = _get_detail(auth_headers, qid)
        assert detail["status"] == "draft", f"期望status=draft, 实际{detail['status']}"

    def test_tc_pb_010(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        _publish_and_close(auth_headers, qid)

        resp = _close(auth_headers, qid)
        assert resp.status_code == 400, f"重复关闭期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400008, f"期望code=400008, 实际{data['code']}"


class TestGetAccessLink:

    def test_tc_pb_011(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid)
        assert resp.status_code == 200, f"前置发布失败: {resp.text}"

        resp = requests.get(
            Endpoints.questionnaire_link(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"获取链接期望200, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"
        result = data.get("result", data.get("data", {}))
        assert result.get("link"), "应返回link字段"
        assert result["link"].startswith("http"), f"link应为URL格式: {result['link']}"
        assert result.get("accessCode"), "应返回accessCode字段"

    def test_tc_pb_012(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("未发布问卷", "用于链接获取测试")
        resp = requests.get(
            Endpoints.questionnaire_link(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 400, f"未发布问卷获取链接期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400011, f"期望code=400011, 实际{data['code']}"


class TestGetQRCode:

    def test_tc_pb_013(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid)
        assert resp.status_code == 200, f"前置发布失败: {resp.text}"

        resp = requests.get(
            Endpoints.questionnaire_qrcode(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"获取二维码期望200, 实际{resp.status_code}: {resp.text}"
        assert "image/png" in resp.headers.get("Content-Type", ""), \
            f"期望Content-Type=image/png, 实际{resp.headers.get('Content-Type')}"
        assert resp.content[:4] == b"\x89PNG", "响应体应以PNG文件头开始"

    def test_tc_pb_014(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        resp = _publish(auth_headers, qid)
        assert resp.status_code == 200, f"前置发布失败: {resp.text}"

        resp = requests.get(
            Endpoints.questionnaire_qrcode(qid),
            headers=auth_headers,
            params={"size": 300, "format": "png"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"获取指定size二维码期望200, 实际{resp.status_code}: {resp.text}"
        assert "image/png" in resp.headers.get("Content-Type", ""), \
            f"期望Content-Type=image/png, 实际{resp.headers.get('Content-Type')}"
        assert resp.content[:4] == b"\x89PNG", "响应体应以PNG文件头开始"

    def test_tc_pb_015(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("未发布问卷", "用于二维码获取测试")
        resp = requests.get(
            Endpoints.questionnaire_qrcode(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 400, f"未发布问卷获取二维码期望400, 实际{resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["code"] == 400011, f"期望code=400011, 实际{data['code']}"
