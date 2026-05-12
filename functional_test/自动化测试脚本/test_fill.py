# -*- coding: utf-8 -*-
import time
import uuid
import requests
import pytest
from config import Endpoints, ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT, RATE_LIMIT_WAIT


def _unique_device_id(prefix="dev"):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _publish_questionnaire(auth_headers, qid, **publish_opts):
    resp = requests.post(
        Endpoints.questionnaire_publish(qid),
        headers=auth_headers,
        json=publish_opts,
        timeout=REQUEST_TIMEOUT,
    )
    assert resp.status_code == 200, f"Publish failed: {resp.text}"
    result = resp.json().get("result", {})
    access_code = result.get("accessCode", "")
    if not access_code:
        link_resp = requests.get(
            Endpoints.questionnaire_link(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        if link_resp.status_code == 200:
            link_data = link_resp.json().get("result", {})
            access_code = link_data.get("accessCode", "")
    assert access_code, "accessCode不应为空"
    return access_code


def _close_questionnaire(auth_headers, qid):
    resp = requests.post(
        Endpoints.questionnaire_close(qid),
        headers=auth_headers,
        json={},
        timeout=REQUEST_TIMEOUT,
    )
    assert resp.status_code == 200, f"Close failed: {resp.text}"


def _get_fill_questions(access_code):
    resp = requests.get(Endpoints.fill_get(access_code), timeout=REQUEST_TIMEOUT)
    assert resp.status_code == 200, f"获取问卷内容失败: {resp.text}"
    return resp.json()["result"].get("questions", [])


def _build_answers_for_questions(questions):
    answers = []
    for q in questions:
        q_type = q.get("type", "")
        q_id = q.get("questionId") or q.get("id")
        options = q.get("options", [])
        if q_type == "radio" and options:
            answers.append({
                "questionId": q_id,
                "type": "radio",
                "answer": {"optionIds": [options[0]["id"]]},
            })
        elif q_type == "checkbox" and options:
            answers.append({
                "questionId": q_id,
                "type": "checkbox",
                "answer": {"optionIds": [o["id"] for o in options[:2]]},
            })
        elif q_type == "input":
            answers.append({
                "questionId": q_id,
                "type": "input",
                "answer": {"value": "自动化测试填写内容"},
            })
        elif q_type == "rating":
            answers.append({
                "questionId": q_id,
                "type": "rating",
                "answer": {"value": 5},
            })
        elif q_type == "dropdown" and options:
            answers.append({
                "questionId": q_id,
                "type": "dropdown",
                "answer": {"optionIds": [options[0]["id"]]},
            })
        else:
            answers.append({
                "questionId": q_id,
                "type": q_type,
                "answer": {"value": "自动化测试默认回答"},
            })
    return answers


def _submit_fill(access_code, answers, device_id=None, submit_time="2026-05-11 12:00:00", duration=120):
    body = {
        "answers": answers,
        "submitTime": submit_time,
        "duration": duration,
    }
    if device_id is not None:
        body["deviceId"] = device_id
    return requests.post(
        Endpoints.fill_submit(access_code),
        json=body,
        timeout=REQUEST_TIMEOUT,
    )


def _create_publish_with_options(auth_headers, create_questionnaire, **publish_opts):
    qid = create_questionnaire("设备限制测试问卷", "自动化测试")
    questions_payload = [
        {
            "type": "radio",
            "title": "设备限制单选题",
            "required": False,
            "options": [{"content": "选项A"}, {"content": "选项B"}],
        },
        {
            "type": "input",
            "title": "设备限制填空题",
            "required": False,
        },
    ]
    question_ids = []
    for q in questions_payload:
        resp = requests.post(
            Endpoints.questionnaire_questions(qid),
            headers=auth_headers,
            json=q,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"Add question failed: {resp.text}"
        question_ids.append(resp.json()["result"]["id"])
    access_code = _publish_questionnaire(auth_headers, qid, **publish_opts)
    return qid, access_code, question_ids


class TestFillGetContent:

    def test_tc_fill_001(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        resp = requests.get(
            Endpoints.fill_get(access_code),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        assert data["code"] == 200
        result = data["result"]
        assert "title" in result
        assert "questions" in result
        assert isinstance(result["questions"], list)

    def test_tc_fill_002(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        resp = requests.get(
            Endpoints.fill_get(access_code),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        questions = data["result"]["questions"]
        assert len(questions) >= 3
        for q in questions:
            assert "questionId" in q or "id" in q
            assert "type" in q
            assert "title" in q
            assert "required" in q
        for q in questions:
            if q["type"] in ("radio", "checkbox", "dropdown"):
                assert "options" in q
                assert isinstance(q["options"], list)
                assert len(q["options"]) > 0

    def test_tc_fill_003(self):
        resp = requests.get(
            Endpoints.fill_get("INVALID_NONEXIST_LINK_XYZ"),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") == 4040 or resp.status_code == 404
        if data.get("message"):
            assert "问卷不存在" in data["message"]

    def test_tc_fill_010(self):
        resp = requests.get(
            Endpoints.fill_get("NOTEXIST_LINK_999"),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") == 4040 or resp.status_code == 404

    def test_tc_fill_023(self):
        resp = requests.get(
            Endpoints.fill_get(""),
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code in (404, 405)


class TestFillSubmit:

    def test_tc_fill_004(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        device_id = _unique_device_id("tc004")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert resp.status_code == 200
        assert data.get("success") is True or data.get("code") == 200

    def test_tc_fill_005(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        questions = _get_fill_questions(access_code)
        non_required = [q for q in questions if not q.get("required", False)]
        if non_required:
            answers = _build_answers_for_questions(non_required[:1])
        else:
            answers = _build_answers_for_questions(questions[:1])
        device_id = _unique_device_id("tc005")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert resp.status_code == 200
        assert data.get("success") is True or data.get("code") == 200

    def test_tc_fill_006(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        device_id = _unique_device_id("tc006")
        resp = _submit_fill(access_code, [], device_id=device_id)
        data = resp.json()
        has_required = False
        questions = _get_fill_questions(access_code)
        for q in questions:
            if q.get("required", False):
                has_required = True
                break
        if has_required:
            assert data.get("code") in (4001, 400) or resp.status_code == 400
        else:
            assert resp.status_code == 200

    def test_tc_fill_007(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        body = {
            "answers": answers,
            "submitTime": "2026-05-11 12:00:00",
            "duration": 60,
        }
        resp = requests.post(
            Endpoints.fill_submit(access_code),
            json=body,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") in (4001, 400) or resp.status_code == 400

    def test_tc_fill_011(self):
        device_id = _unique_device_id("tc011")
        answers = [{"questionId": 1, "type": "input", "answer": {"value": "test"}}]
        resp = _submit_fill("NOTEXIST_LINK_999", answers, device_id=device_id)
        data = resp.json()
        assert data.get("code") == 4040 or resp.status_code == 404

    def test_tc_fill_024(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        questions = _get_fill_questions(access_code)
        radio_q = None
        for q in questions:
            if q["type"] == "radio":
                radio_q = q
                break
        if radio_q is None:
            pytest.skip("问卷中无单选题，跳过类型不匹配测试")
        q_id = radio_q.get("questionId") or radio_q.get("id")
        answers = [{
            "questionId": q_id,
            "type": "radio",
            "answer": {"value": ["这是一个数组而不是字符串"]},
        }]
        device_id = _unique_device_id("tc024")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert data.get("code") in (4001, 400, 4002) or resp.status_code == 400

    def test_tc_fill_025(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        questions = _get_fill_questions(access_code)
        rating_q = None
        for q in questions:
            if q["type"] == "rating":
                rating_q = q
                break
        if rating_q is None:
            pytest.skip("问卷中无评分题，跳过评分范围测试")
        q_id = rating_q.get("questionId") or rating_q.get("id")
        answers = [{
            "questionId": q_id,
            "type": "rating",
            "answer": {"value": -1},
        }]
        device_id = _unique_device_id("tc025")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert data.get("code") in (4001, 400, 4002) or resp.status_code == 400


class TestFillClosedQuestionnaire:

    def test_tc_fill_008(self, auth_headers, create_questionnaire_with_questions):
        qid, question_ids = create_questionnaire_with_questions()
        access_code = _publish_questionnaire(auth_headers, qid)
        _close_questionnaire(auth_headers, qid)
        resp = requests.get(
            Endpoints.fill_get(access_code),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") == 4031 or resp.status_code == 403
        if data.get("message"):
            assert "已结束" in data["message"] or "已关闭" in data["message"]

    def test_tc_fill_009(self, auth_headers, create_questionnaire_with_questions):
        qid, question_ids = create_questionnaire_with_questions()
        access_code = _publish_questionnaire(auth_headers, qid)
        questions = _get_fill_questions(access_code)
        _close_questionnaire(auth_headers, qid)
        answers = _build_answers_for_questions(questions)
        device_id = _unique_device_id("tc009")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert data.get("code") == 4031 or resp.status_code == 403


class TestFillDeviceRestriction:

    def test_tc_fill_012(self, auth_headers, create_questionnaire):
        qid, access_code, _ = _create_publish_with_options(
            auth_headers, create_questionnaire, allowDuplicateDevice=False,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        device_id = _unique_device_id("tc012_dup")
        resp1 = _submit_fill(access_code, answers, device_id=device_id)
        data1 = resp1.json()
        assert resp1.status_code == 200
        assert data1.get("success") is True or data1.get("code") == 200
        resp2 = _submit_fill(access_code, answers, device_id=device_id)
        data2 = resp2.json()
        assert data2.get("code") == 4091 or resp2.status_code == 409

    def test_tc_fill_013(self, auth_headers, create_questionnaire):
        qid, access_code, _ = _create_publish_with_options(
            auth_headers, create_questionnaire, allowDuplicateDevice=True,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        device_id = _unique_device_id("tc013_dup")
        resp1 = _submit_fill(access_code, answers, device_id=device_id)
        data1 = resp1.json()
        assert resp1.status_code == 200
        assert data1.get("success") is True or data1.get("code") == 200
        resp2 = _submit_fill(access_code, answers, device_id=device_id)
        data2 = resp2.json()
        assert resp2.status_code == 200
        assert data2.get("success") is True or data2.get("code") == 200


class TestFillDeviceStatus:

    def test_tc_fill_014(self, auth_headers, create_questionnaire):
        qid, access_code, _ = _create_publish_with_options(
            auth_headers, create_questionnaire,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        device_id = _unique_device_id("tc014")
        submit_resp = _submit_fill(access_code, answers, device_id=device_id)
        assert submit_resp.status_code == 200
        resp = requests.get(
            Endpoints.fill_status(access_code),
            params={"deviceId": device_id},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        result = data.get("result", data)
        assert result.get("submitted") is True or result.get("hasSubmitted") is True

    def test_tc_fill_015(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        device_id = _unique_device_id("tc015_never_submitted")
        resp = requests.get(
            Endpoints.fill_status(access_code),
            params={"deviceId": device_id},
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 200
        result = data.get("result", data)
        assert result.get("submitted") is False or result.get("hasSubmitted") is False

    def test_tc_fill_016(self, published_questionnaire):
        _, access_code, _ = published_questionnaire
        resp = requests.get(
            Endpoints.fill_status(access_code),
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code in (400, 422) or resp.json().get("code") in (4001, 400)


class TestFillRequiredValidation:

    def _create_required_questionnaire(self, auth_headers, create_questionnaire):
        qid = create_questionnaire("必填题测试问卷", "含必填题的测试")
        questions_payload = [
            {
                "type": "radio",
                "title": "必填单选题",
                "required": True,
                "options": [{"content": "选项A"}, {"content": "选项B"}],
            },
            {
                "type": "input",
                "title": "非必填填空题",
                "required": False,
            },
        ]
        question_ids = []
        for q in questions_payload:
            resp = requests.post(
                Endpoints.questionnaire_questions(qid),
                headers=auth_headers,
                json=q,
                timeout=REQUEST_TIMEOUT,
            )
            assert resp.status_code == 200, f"Add question failed: {resp.text}"
            question_ids.append(resp.json()["result"]["id"])
        access_code = _publish_questionnaire(auth_headers, qid)
        return qid, access_code, question_ids

    def test_tc_fill_017(self, auth_headers, create_questionnaire):
        qid, access_code, question_ids = self._create_required_questionnaire(
            auth_headers, create_questionnaire,
        )
        questions = _get_fill_questions(access_code)
        non_required = [q for q in questions if not q.get("required", False)]
        answers = _build_answers_for_questions(non_required) if non_required else []
        device_id = _unique_device_id("tc017")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert data.get("code") in (4001, 400) or resp.status_code == 400

    def test_tc_fill_018(self, auth_headers, create_questionnaire):
        qid, access_code, question_ids = self._create_required_questionnaire(
            auth_headers, create_questionnaire,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        device_id = _unique_device_id("tc018")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert resp.status_code == 200
        assert data.get("success") is True or data.get("code") == 200


class TestFillMaxResponses:

    def test_tc_fill_019(self, auth_headers, create_questionnaire):
        qid, access_code, _ = _create_publish_with_options(
            auth_headers, create_questionnaire, maxResponses=2,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        for i in range(2):
            device_id = _unique_device_id(f"tc019_sub{i}")
            resp = _submit_fill(access_code, answers, device_id=device_id)
            data = resp.json()
            assert resp.status_code == 200, f"第{i+1}次提交应成功: {resp.text}"
            assert data.get("success") is True or data.get("code") == 200
        device_id = _unique_device_id("tc019_sub3")
        resp = _submit_fill(access_code, answers, device_id=device_id)
        data = resp.json()
        assert data.get("code") in (4031, 4032) or resp.status_code == 403

    def test_tc_fill_020(self, auth_headers, create_questionnaire):
        qid, access_code, _ = _create_publish_with_options(
            auth_headers, create_questionnaire, maxResponses=2,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        for i in range(2):
            device_id = _unique_device_id(f"tc020_sub{i}")
            resp = _submit_fill(access_code, answers, device_id=device_id)
            assert resp.status_code == 200
        resp = requests.get(
            Endpoints.fill_get(access_code),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") == 4031 or resp.status_code == 403


class TestFillRateLimit:

    @pytest.mark.slow
    def test_tc_fill_021(self, auth_headers, create_questionnaire):
        qid, access_code, _ = _create_publish_with_options(
            auth_headers, create_questionnaire, allowDuplicateDevice=True,
        )
        questions = _get_fill_questions(access_code)
        answers = _build_answers_for_questions(questions)
        results = []
        for i in range(11):
            device_id = _unique_device_id(f"tc021_rate{i}")
            resp = _submit_fill(access_code, answers, device_id=device_id)
            results.append((resp.status_code, resp.json().get("code")))
        last_status, last_code = results[-1]
        assert last_code == 4290 or last_status == 429

    @pytest.mark.skip(reason="需要等待60秒限流窗口重置")
    def test_tc_fill_022(self):
        pass


class TestFillUnpublished:

    def test_tc_fill_026(self, auth_headers, create_questionnaire_with_questions):
        qid, _ = create_questionnaire_with_questions()
        detail_resp = requests.get(
            Endpoints.questionnaire_detail(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        detail = detail_resp.json().get("result", {})
        assert detail.get("status") == "draft"
        fake_code = f"draft_{qid}_nonexist"
        resp = requests.get(
            Endpoints.fill_get(fake_code),
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") in (4040, 4031) or resp.status_code in (404, 403)
