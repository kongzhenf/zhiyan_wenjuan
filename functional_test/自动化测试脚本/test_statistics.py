# -*- coding: utf-8 -*-
import time
import requests
import pytest
from config import Endpoints, ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT


def _submit_answer(access_code, question_ids, auth_headers):
    fill_resp = requests.get(
        Endpoints.fill_get(access_code),
        timeout=REQUEST_TIMEOUT,
    )
    assert fill_resp.status_code == 200, f"获取填写页失败: {fill_resp.text}"
    fill_data = fill_resp.json()["result"]
    fill_questions = fill_data.get("questions", [])

    question_map = {}
    for fq in fill_questions:
        question_map[fq["id"]] = fq

    answers = []
    radio_qid = question_ids[0]
    checkbox_qid = question_ids[1]
    input_qid = question_ids[2]

    if radio_qid in question_map:
        opts = question_map[radio_qid].get("options", [])
        if opts:
            answers.append({
                "questionId": radio_qid,
                "type": "radio",
                "answer": {"optionIds": [opts[0]["id"]]}
            })
    else:
        q_detail = requests.get(
            Endpoints.questionnaire_question_detail(
                fill_data.get("id", ""), radio_qid
            ),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        if q_detail.status_code == 200:
            opts = q_detail.json()["result"].get("options", [])
            if opts:
                answers.append({
                    "questionId": radio_qid,
                    "type": "radio",
                    "answer": {"optionIds": [opts[0]["id"]]}
                })

    if checkbox_qid in question_map:
        opts = question_map[checkbox_qid].get("options", [])
        if len(opts) >= 2:
            answers.append({
                "questionId": checkbox_qid,
                "type": "checkbox",
                "answer": {"optionIds": [opts[0]["id"], opts[1]["id"]]}
            })

    answers.append({
        "questionId": input_qid,
        "type": "input",
        "answer": {"text": "这是测试填写的回答内容"}
    })

    submit_resp = requests.post(
        Endpoints.fill_submit(access_code),
        json={"answers": answers},
        timeout=REQUEST_TIMEOUT,
    )
    assert submit_resp.status_code == 200, f"提交回答失败: {submit_resp.text}"
    return submit_resp


@pytest.fixture
def questionnaire_with_response(published_questionnaire, auth_headers):
    qid, access_code, question_ids = published_questionnaire
    _submit_answer(access_code, question_ids, auth_headers)
    time.sleep(1)
    return qid, access_code, question_ids


class TestStatisticsOverview:

    def test_tc_stat_001(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        resp = requests.get(
            Endpoints.statistics_overview(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert result["totalCount"] >= 1
        assert result["todayCount"] >= 0
        assert isinstance(result.get("trend"), list)

    def test_tc_stat_002(self, auth_headers):
        resp = requests.get(
            Endpoints.statistics_overview(999999),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 404 or data.get("success") is False

    def test_tc_stat_003(self):
        resp = requests.get(
            Endpoints.statistics_overview(1),
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401


class TestStatisticsQuestions:

    def test_tc_stat_004(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        resp = requests.get(
            Endpoints.statistics_questions(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert isinstance(result, list)
        assert len(result) > 0
        choice_found = False
        for q_stat in result:
            if q_stat.get("type") in ("radio", "checkbox"):
                choice_found = True
                assert "options" in q_stat
                for opt in q_stat["options"]:
                    assert "count" in opt
                    assert "percentage" in opt
        assert choice_found

    def test_tc_stat_005(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        resp = requests.get(
            Endpoints.statistics_questions(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        input_found = False
        for q_stat in result:
            if q_stat.get("type") == "input":
                input_found = True
                assert "answerCount" in q_stat
        assert input_found

    def test_tc_stat_006(self, published_questionnaire, auth_headers):
        qid, _, _ = published_questionnaire
        resp = requests.get(
            Endpoints.statistics_questions(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert isinstance(result, list)
        for q_stat in result:
            if q_stat.get("type") in ("radio", "checkbox"):
                for opt in q_stat.get("options", []):
                    assert opt["count"] == 0
            elif q_stat.get("type") == "input":
                assert q_stat.get("answerCount", 0) == 0


class TestStatisticsQuestionTexts:

    def test_tc_stat_007(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        input_qid = question_ids[2]
        resp = requests.get(
            Endpoints.statistics_question_texts(qid, input_qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert "list" in result
        assert "total" in result
        assert "page" in result
        assert "pageSize" in result
        assert result["total"] >= 1

    def test_tc_stat_008(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        input_qid = question_ids[2]
        resp = requests.get(
            Endpoints.statistics_question_texts(qid, input_qid),
            headers=auth_headers,
            params={"keyword": "测试"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        for item in result.get("list", []):
            text = item.get("text", "") or item.get("answer", "") or item.get("content", "")
            assert "测试" in text

    def test_tc_stat_009(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        radio_qid = question_ids[0]
        resp = requests.get(
            Endpoints.statistics_question_texts(qid, radio_qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 400 or data.get("success") is False

    def test_tc_stat_010(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        input_qid = question_ids[2]
        resp = requests.get(
            Endpoints.statistics_question_texts(qid, input_qid),
            headers=auth_headers,
            params={"page": 9999, "pageSize": 20},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert len(result["list"]) == 0
        assert result["total"] >= 0


class TestStatisticsExport:

    def test_tc_stat_011(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        resp = requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "xlsx",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert "exportId" in result
        assert result.get("status") == "processing"

    def test_tc_stat_012(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        resp = requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "csv",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert "exportId" in result
        assert result.get("format") == "csv"

    def test_tc_stat_013(self, published_questionnaire, auth_headers):
        qid, _, _ = published_questionnaire
        resp = requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "xlsx",
                "startDate": "2020-01-01",
                "endDate": "2020-01-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert data.get("code") == 4003 or data.get("success") is False or resp.status_code in (400, 404)

    def test_tc_stat_014(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        resp = requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "pdf",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        data = resp.json()
        assert resp.status_code == 400 or data.get("success") is False


class TestStatisticsExportDownload:

    def test_tc_stat_015(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        export_resp = requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "xlsx",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert export_resp.status_code == 200
        export_id = export_resp.json()["result"]["exportId"]

        downloaded = False
        for _ in range(5):
            time.sleep(2)
            dl_resp = requests.get(
                Endpoints.statistics_export_download(export_id),
                headers=auth_headers,
                timeout=REQUEST_TIMEOUT,
            )
            if dl_resp.status_code == 200 and "octet-stream" in dl_resp.headers.get("Content-Type", ""):
                downloaded = True
                assert len(dl_resp.content) > 0
                break

        assert downloaded, "导出文件未在10秒内完成下载"

    def test_tc_stat_016(self, auth_headers):
        resp = requests.get(
            Endpoints.statistics_export_download(999999),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 404

    def test_tc_stat_017(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        export_resp = requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "xlsx",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        assert export_resp.status_code == 200
        export_id = export_resp.json()["result"]["exportId"]

        dl_resp = requests.get(
            Endpoints.statistics_export_download(export_id),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        data = dl_resp.json() if dl_resp.headers.get("Content-Type", "").startswith("application/json") else {}
        assert dl_resp.status_code in (409, 400) or data.get("code") == 4004 or data.get("success") is False

    @pytest.mark.skip(reason="需要数据库直接操作设置过期时间")
    def test_tc_stat_018(self, auth_headers):
        pass


class TestStatisticsExportList:

    def test_tc_stat_019(self, auth_headers):
        resp = requests.get(
            Endpoints.STATISTICS_EXPORTS,
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert "list" in result

    def test_tc_stat_020(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        requests.post(
            Endpoints.statistics_export(qid),
            headers=auth_headers,
            json={
                "format": "xlsx",
                "startDate": "2026-01-01",
                "endDate": "2026-12-31",
            },
            timeout=REQUEST_TIMEOUT,
        )
        time.sleep(3)

        resp = requests.get(
            Endpoints.STATISTICS_EXPORTS,
            headers=auth_headers,
            params={"status": "completed", "questionnaireId": qid},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert isinstance(result.get("list"), list)


class TestStatisticsTimeRange:

    def test_tc_stat_021(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        full_resp = requests.get(
            Endpoints.statistics_overview(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT,
        )
        assert full_resp.status_code == 200
        full_count = full_resp.json()["result"]["totalCount"]

        filtered_resp = requests.get(
            Endpoints.statistics_overview(qid),
            headers=auth_headers,
            params={"startDate": "2026-01-01", "endDate": "2026-03-31"},
            timeout=REQUEST_TIMEOUT,
        )
        assert filtered_resp.status_code == 200
        filtered_count = filtered_resp.json()["result"]["totalCount"]
        assert filtered_count <= full_count

    def test_tc_stat_022(self, questionnaire_with_response, auth_headers):
        qid, _, _ = questionnaire_with_response
        resp = requests.get(
            Endpoints.statistics_questions(qid),
            headers=auth_headers,
            params={"startDate": "2026-01-01", "endDate": "2026-01-31"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["result"], list)

    def test_tc_stat_023(self, questionnaire_with_response, auth_headers):
        qid, _, question_ids = questionnaire_with_response
        input_qid = question_ids[2]
        resp = requests.get(
            Endpoints.statistics_question_texts(qid, input_qid),
            headers=auth_headers,
            params={"startDate": "2026-01-01", "endDate": "2026-12-31"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200
        data = resp.json()
        result = data["result"]
        assert "list" in result
