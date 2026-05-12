# -*- coding: utf-8 -*-
import re
import time
import pytest
import requests
from config import Endpoints, ADMIN_USERNAME, ADMIN_PASSWORD, REQUEST_TIMEOUT, ACCOUNT_LOCK_WAIT


def _login(username=ADMIN_USERNAME, password=ADMIN_PASSWORD):
    return requests.post(
        Endpoints.AUTH_LOGIN,
        json={"username": username, "password": password},
        timeout=REQUEST_TIMEOUT,
    )


def _login_and_extract():
    resp = _login()
    data = resp.json()
    assert resp.status_code == 200, f"前置登录失败: {data}"
    result = data["result"]
    return result["accessToken"], result["refreshToken"]


class TestAuthLogin:

    def test_tc_auth_001(self):
        resp = _login()
        assert resp.status_code == 200, f"期望状态码200, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is True, "期望success=true"
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"
        result = data["result"]
        assert result["accessToken"], "accessToken不应为空"
        assert result["refreshToken"], "refreshToken不应为空"
        assert result["expiresIn"] == 28800, f"期望expiresIn=28800, 实际{result['expiresIn']}"
        assert result["tokenType"] == "Bearer", f"期望tokenType=Bearer, 实际{result['tokenType']}"
        assert result["username"] == "admin", f"期望username=admin, 实际{result['username']}"

    def test_tc_auth_002(self):
        access_token, _ = _login_and_extract()
        resp = requests.post(
            Endpoints.AUTH_LOGOUT,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"使用accessToken调用logout期望200, 实际{resp.status_code}"

    def test_tc_auth_003(self):
        resp = _login()
        data = resp.json()
        result = data["result"]
        assert result["tokenType"] == "Bearer", f"期望tokenType=Bearer, 实际{result['tokenType']}"
        assert result["expiresIn"] == 28800, f"期望expiresIn=28800(8小时), 实际{result['expiresIn']}"
        jwt_pattern = re.compile(r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")
        assert jwt_pattern.match(result["accessToken"]), "accessToken不符合JWT格式(三段base64用点分隔)"


class TestAuthLoginValidation:

    def test_tc_auth_004(self):
        resp = _login(username="", password=ADMIN_PASSWORD)
        assert resp.status_code == 400, f"用户名为空期望400, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 400001, f"期望code=400001, 实际{data['code']}"

    def test_tc_auth_005(self):
        resp = _login(username=ADMIN_USERNAME, password="")
        assert resp.status_code == 400, f"密码为空期望400, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 400001, f"期望code=400001, 实际{data['code']}"

    def test_tc_auth_006(self):
        resp = _login(username="", password="")
        assert resp.status_code == 400, f"用户名和密码均为空期望400, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 400001, f"期望code=400001, 实际{data['code']}"


class TestAuthLoginFailure:

    def test_tc_auth_007(self):
        resp = _login(username=ADMIN_USERNAME, password="wrongpassword")
        assert resp.status_code == 401, f"密码错误期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 401001, f"期望code=401001, 实际{data['code']}"
        result = data.get("result") or {}
        assert "accessToken" not in result, "密码错误时不应返回accessToken"
        assert "refreshToken" not in result, "密码错误时不应返回refreshToken"

    def test_tc_auth_008(self):
        resp = _login(username="nonexistentuser", password=ADMIN_PASSWORD)
        assert resp.status_code == 401, f"用户名不存在期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 401001, f"期望code=401001, 实际{data['code']}"


class TestAuthAccountLock:

    @pytest.mark.skip(reason="会导致admin账号锁定10分钟，影响其他测试")
    def test_tc_auth_009(self):
        for i in range(5):
            resp = _login(username=ADMIN_USERNAME, password="wrongpassword")
            assert resp.status_code == 401, f"第{i+1}次错误登录期望401, 实际{resp.status_code}"

        resp = _login(username=ADMIN_USERNAME, password=ADMIN_PASSWORD)
        assert resp.status_code == 401, f"账号锁定后正确密码期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["code"] == 401002, f"期望code=401002(账号已锁定), 实际{data['code']}"

    @pytest.mark.skip(reason="需要等待10分钟，仅手动执行")
    def test_tc_auth_010(self):
        for i in range(5):
            _login(username=ADMIN_USERNAME, password="wrongpassword")

        resp_locked = _login(username=ADMIN_USERNAME, password=ADMIN_PASSWORD)
        assert resp_locked.status_code == 401, "锁定验证失败"

        time.sleep(ACCOUNT_LOCK_WAIT)

        resp_unlocked = _login(username=ADMIN_USERNAME, password=ADMIN_PASSWORD)
        assert resp_unlocked.status_code == 200, f"锁定到期后期望200, 实际{resp_unlocked.status_code}"
        data = resp_unlocked.json()
        assert data["success"] is True, "解锁后期望success=true"


class TestAuthTokenRefresh:

    def test_tc_auth_011(self):
        _, refresh_token = _login_and_extract()
        resp = requests.post(
            Endpoints.AUTH_REFRESH,
            json={"refreshToken": refresh_token},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"刷新Token期望200, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is True, "期望success=true"
        result = data["result"]
        assert result["accessToken"], "刷新后accessToken不应为空"
        assert result["expiresIn"] == 28800, f"期望expiresIn=28800, 实际{result['expiresIn']}"

    def test_tc_auth_012(self):
        resp = requests.post(
            Endpoints.AUTH_REFRESH,
            json={"refreshToken": "invalid_refresh_token_string_12345"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401, f"无效refreshToken期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 401003, f"期望code=401003, 实际{data['code']}"

    def test_tc_auth_013(self):
        resp = requests.post(
            Endpoints.AUTH_REFRESH,
            json={"refreshToken": ""},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 400, f"空refreshToken期望400, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 400001, f"期望code=400001, 实际{data['code']}"


class TestAuthLogout:

    def test_tc_auth_014(self):
        access_token, _ = _login_and_extract()
        resp = requests.post(
            Endpoints.AUTH_LOGOUT,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 200, f"退出登录期望200, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is True, "期望success=true"
        assert data["code"] == 200, f"期望code=200, 实际{data['code']}"

    def test_tc_auth_015(self):
        access_token, _ = _login_and_extract()
        resp_logout = requests.post(
            Endpoints.AUTH_LOGOUT,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp_logout.status_code == 200, "首次退出登录失败"

        resp_again = requests.post(
            Endpoints.AUTH_LOGOUT,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp_again.status_code == 401, f"已退出Token再次使用期望401, 实际{resp_again.status_code}"
        data = resp_again.json()
        assert data["code"] == 401000, f"期望code=401000, 实际{data['code']}"


class TestAuthJWT:

    def test_tc_auth_016(self):
        resp = requests.post(
            Endpoints.AUTH_LOGOUT,
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401, f"未携带Token期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 401000, f"期望code=401000, 实际{data['code']}"

    def test_tc_auth_017(self):
        resp = requests.post(
            Endpoints.AUTH_LOGOUT,
            headers={"Authorization": "Bearer fake.invalid.token123"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401, f"伪造Token期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 401000, f"期望code=401000, 实际{data['code']}"

    def test_tc_auth_018(self):
        _, refresh_token = _login_and_extract()
        resp = requests.post(
            Endpoints.AUTH_LOGOUT,
            headers={"Authorization": f"Bearer {refresh_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        assert resp.status_code == 401, f"使用refreshToken代替accessToken期望401, 实际{resp.status_code}"
        data = resp.json()
        assert data["success"] is False, "期望success=false"
        assert data["code"] == 401000, f"期望code=401000, 实际{data['code']}"
