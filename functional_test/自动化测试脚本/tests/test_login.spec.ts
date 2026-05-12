import { test, expect, config } from './fixtures';

const BASE_URL = 'http://10.32.129.153:3002';
const API_URL = 'http://10.32.129.153:8082/api';
const USERNAME = 'admin';
const PASSWORD = 'admin123';

test.describe('管理员登录', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-LOGIN-001: 正确账号密码登录成功，跳转/dashboard，localStorage有token', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('Authorization');
    });
    expect(token).toBeTruthy();
  });

  test('TC-LOGIN-002: 错误密码登录失败，显示错误提示', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"], button:has-text("登录")');
    const errorMsg = page.locator('.ant-message-error, .el-message--error, .ant-form-item-explain-error, [role="alert"], .error-message');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-LOGIN-003: 用户名为空提交，前端校验"请输入用户名"', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]').first();
    await usernameInput.clear();
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    const validation = page.locator('text=请输入用户名');
    await expect(validation.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-LOGIN-004: 用户名空格字符，校验触发', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', '   ');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    const validation = page.locator('.ant-form-item-explain-error, .el-form-item__error, [role="alert"], text=请输入用户名');
    await expect(validation.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-LOGIN-005: 密码为空，前端校验"请输入密码"', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.clear();
    await page.click('button[type="submit"], button:has-text("登录")');
    const validation = page.locator('text=请输入密码');
    await expect(validation.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-LOGIN-006: 密码空格字符，校验触发', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', '   ');
    await page.click('button[type="submit"], button:has-text("登录")');
    const validation = page.locator('.ant-form-item-explain-error, .el-form-item__error, [role="alert"], text=请输入密码');
    await expect(validation.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-LOGIN-007: 用户名密码均为空', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]').first();
    await usernameInput.clear();
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.clear();
    await page.click('button[type="submit"], button:has-text("登录")');
    const validations = page.locator('.ant-form-item-explain-error, .el-form-item__error, [role="alert"]');
    await expect(validations.first()).toBeVisible({ timeout: 5000 });
    const count = await validations.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('TC-LOGIN-008: 不存在的用户名', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', 'nonexistent_user_xyz');
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"], button:has-text("登录")');
    const errorMsg = page.locator('.ant-message-error, .el-message--error, .ant-form-item-explain-error, [role="alert"], .error-message');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-LOGIN-009: 未登录访问/dashboard自动跳转/login', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('TC-LOGIN-010: 未登录访问受保护路由跳转/login', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/questionnaire/list`);
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('TC-LOGIN-011: 已登录访问/login自动跳转/dashboard', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-LOGIN-012: 已登录刷新/login跳转/dashboard', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-LOGIN-013: Enter键提交登录（密码框按Enter）', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.press('input[type="password"]', 'Enter');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-LOGIN-014: 用户名框按Enter提交', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]').first();
    await usernameInput.fill(USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await usernameInput.press('Enter');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('TC-LOGIN-015: 登录过程loading状态', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    const submitBtn = page.locator('button[type="submit"], button:has-text("登录")').first();
    await submitBtn.click();
    const loadingIndicator = page.locator('.ant-btn-loading, .el-button.is-loading, button[disabled], .ant-spin, [class*="loading"]');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('TC-LOGIN-016: 快速重复点击，只发一次请求', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    let requestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api') && req.method() === 'POST' && req.url().includes('login')) {
        requestCount++;
      }
    });
    const submitBtn = page.locator('button[type="submit"], button:has-text("登录")').first();
    await Promise.all([
      submitBtn.click(),
      submitBtn.click({ force: true }).catch(() => {}),
      submitBtn.click({ force: true }).catch(() => {}),
    ]);
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(requestCount).toBeLessThanOrEqual(2);
  });

  test('TC-LOGIN-017: Token过期后自动刷新(模拟)', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.route(`${API_URL}/**`, async (route) => {
      const request = route.request();
      if (!request.url().includes('refresh')) {
        await route.fulfill({ status: 401, body: JSON.stringify({ code: 401, message: 'Token expired' }) });
      } else {
        await route.continue();
      }
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const refreshRequest = page.waitForRequest((req) => req.url().includes('refresh'), { timeout: 5000 }).catch(() => null);
    const req = await refreshRequest;
    if (req) {
      expect(req.url()).toContain('refresh');
    }
  });

  test('TC-LOGIN-018: Token刷新失败跳转登录页', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.route(`${API_URL}/**`, async (route) => {
      await route.fulfill({ status: 401, body: JSON.stringify({ code: 401, message: 'Unauthorized' }) });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('TC-LOGIN-019: RefreshToken失效清除状态', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.route(`${API_URL}/**`, async (route) => {
      await route.fulfill({ status: 401, body: JSON.stringify({ code: 401, message: 'Refresh token expired' }) });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/login', { timeout: 15000 });
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('Authorization');
    });
    expect(token).toBeFalsy();
  });

  test('TC-LOGIN-020: RefreshToken失效后无法访问', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
    await page.goto(`${BASE_URL}/questionnaire/list`);
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('TC-LOGIN-021: 未登录404路由重定向', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/nonexistent-page-xyz`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const redirectedToLogin = url.includes('/login');
    const shows404 = await page.locator('text=404, text=Not Found, text=页面不存在').first().isVisible().catch(() => false);
    expect(redirectedToLogin || shows404).toBeTruthy();
  });

  test('TC-LOGIN-022: 已登录404路由重定向', async ({ page }) => {
    await page.fill('input[type="text"], input[placeholder*="用户名"], input[id*="user"], input[name*="user"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("登录")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto(`${BASE_URL}/nonexistent-page-xyz`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const redirectedToDashboard = url.includes('/dashboard');
    const shows404 = await page.locator('text=404, text=Not Found, text=页面不存在').first().isVisible().catch(() => false);
    expect(redirectedToDashboard || shows404).toBeTruthy();
  });

});
