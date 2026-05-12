# -*- coding: utf-8 -*-
import pytest
import requests
from config import (
    ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT,
    Endpoints, API_BASE
)


@pytest.fixture(scope="session")
def base_url():
    return API_BASE


@pytest.fixture(scope="session")
def admin_token():
    resp = requests.post(
        Endpoints.AUTH_LOGIN,
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=REQUEST_TIMEOUT
    )
    data = resp.json()
    assert resp.status_code == 200, f"Login failed: {data}"
    return data["result"]["accessToken"]


@pytest.fixture(scope="session")
def admin_refresh_token():
    resp = requests.post(
        Endpoints.AUTH_LOGIN,
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=REQUEST_TIMEOUT
    )
    data = resp.json()
    assert resp.status_code == 200, f"Login failed: {data}"
    return data["result"]["refreshToken"]


@pytest.fixture
def auth_headers(admin_token):
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture
def create_questionnaire(auth_headers):
    """Create a draft questionnaire and return its ID. Cleanup after test."""
    created_ids = []

    def _create(title="测试问卷", description="自动化测试创建"):
        resp = requests.post(
            Endpoints.QUESTIONNAIRES,
            headers=auth_headers,
            json={"title": title, "description": description},
            timeout=REQUEST_TIMEOUT
        )
        assert resp.status_code == 200, f"Create questionnaire failed: {resp.text}"
        qid = resp.json()["result"]["id"]
        created_ids.append(qid)
        return qid

    yield _create

    for qid in created_ids:
        try:
            requests.delete(
                Endpoints.questionnaire_detail(qid),
                headers=auth_headers,
                params={"confirm": "true"},
                timeout=REQUEST_TIMEOUT
            )
        except Exception:
            pass


@pytest.fixture
def create_questionnaire_with_questions(auth_headers, create_questionnaire):
    """Create a questionnaire with sample questions and return (qid, question_ids)."""

    def _create():
        qid = create_questionnaire("含题目的测试问卷", "带题目的自动化测试问卷")
        questions = [
            {
                "type": "radio",
                "title": "单选测试题",
                "required": True,
                "options": [{"content": "选项A"}, {"content": "选项B"}, {"content": "选项C"}]
            },
            {
                "type": "checkbox",
                "title": "多选测试题",
                "required": False,
                "options": [{"content": "多选A"}, {"content": "多选B"}, {"content": "多选C"}]
            },
            {
                "type": "input",
                "title": "填空测试题",
                "required": False
            }
        ]
        question_ids = []
        for q in questions:
            resp = requests.post(
                Endpoints.questionnaire_questions(qid),
                headers=auth_headers,
                json=q,
                timeout=REQUEST_TIMEOUT
            )
            assert resp.status_code == 200, f"Add question failed: {resp.text}"
            question_ids.append(resp.json()["result"]["id"])
        return qid, question_ids

    return _create


@pytest.fixture
def published_questionnaire(auth_headers, create_questionnaire_with_questions):
    """Create and publish a questionnaire, return (qid, access_code, question_ids)."""
    qid, question_ids = create_questionnaire_with_questions()
    resp = requests.post(
        Endpoints.questionnaire_publish(qid),
        headers=auth_headers,
        json={},
        timeout=REQUEST_TIMEOUT
    )
    assert resp.status_code == 200, f"Publish failed: {resp.text}"
    result = resp.json().get("result", resp.json().get("data", {}))
    access_code = result.get("accessCode", "")
    if not access_code:
        link_resp = requests.get(
            Endpoints.questionnaire_link(qid),
            headers=auth_headers,
            timeout=REQUEST_TIMEOUT
        )
        if link_resp.status_code == 200:
            link_data = link_resp.json().get("result", link_resp.json().get("data", {}))
            access_code = link_data.get("accessCode", "")
    return qid, access_code, question_ids
