import { test, expect, config } from './fixtures';

const API = '/api';

test.describe('认证管理', () => {
  test('TC-AUTH-001: POST /api/auth/login 正确凭证登录成功', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(body).toHaveProperty('expiresIn');
    expect(body).toHaveProperty('tokenType');
    expect(body).toHaveProperty('username');
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(typeof body.expiresIn).toBe('number');
    expect(body.tokenType).toBeTruthy();
    expect(body.username).toBe('admin');
  });

  test('TC-AUTH-002: accessToken可用于鉴权接口', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
  });

  test('TC-AUTH-003: 错误密码登录失败', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'wrong_password' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test('TC-AUTH-004: 用户名为空登录失败', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/auth/login`, {
      data: { username: '', password: 'admin123' },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('TC-AUTH-005: 密码为空登录失败', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'admin', password: '' },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('TC-AUTH-006: 不存在用户名登录失败', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'nonexistent_user_xyz', password: 'admin123' },
    });
    expect([400, 401, 404]).toContain(res.status());
  });

  test('TC-AUTH-007: POST /api/auth/refresh 刷新token', async ({ apiContext }) => {
    const loginRes = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const refreshToken = loginBody.refreshToken;

    const res = await apiContext.post(`${API}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
  });

  test('TC-AUTH-008: 无效refreshToken刷新失败', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/auth/refresh`, {
      data: { refreshToken: 'invalid_refresh_token_value' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test('TC-AUTH-009: POST /api/auth/logout 登出', async ({ apiContext }) => {
    const loginRes = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });
    const { accessToken: token } = await loginRes.json();

    const res = await apiContext.post(`${API}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('TC-AUTH-010: 无Token访问受保护接口返回401', async ({ apiContext }) => {
    const res = await apiContext.get(`${API}/questionnaires`);
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-011: 无效Token访问受保护接口返回401', async ({ apiContext }) => {
    const res = await apiContext.get(`${API}/questionnaires`, {
      headers: { Authorization: 'Bearer invalid_token_abc123' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-012: 过期Token访问受保护接口', async ({ apiContext }) => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTAwMDAwMDAwMH0.fake_expired';
    const res = await apiContext.get(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-013: 登出后token失效', async ({ apiContext }) => {
    const loginRes = await apiContext.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });
    const { accessToken: token } = await loginRes.json();

    await apiContext.post(`${API}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await apiContext.get(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-AUTH-014: 并发登录token独立', async ({ apiContext }) => {
    const [loginRes1, loginRes2] = await Promise.all([
      apiContext.post(`${API}/auth/login`, {
        data: { username: 'admin', password: 'admin123' },
      }),
      apiContext.post(`${API}/auth/login`, {
        data: { username: 'admin', password: 'admin123' },
      }),
    ]);

    const body1 = await loginRes1.json();
    const body2 = await loginRes2.json();

    expect(body1.accessToken).toBeTruthy();
    expect(body2.accessToken).toBeTruthy();
    expect(body1.accessToken).not.toBe(body2.accessToken);

    const [res1, res2] = await Promise.all([
      apiContext.get(`${API}/questionnaires`, {
        headers: { Authorization: `Bearer ${body1.accessToken}` },
      }),
      apiContext.get(`${API}/questionnaires`, {
        headers: { Authorization: `Bearer ${body2.accessToken}` },
      }),
    ]);

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);
  });
});
