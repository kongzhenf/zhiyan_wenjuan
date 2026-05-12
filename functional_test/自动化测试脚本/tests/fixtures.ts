import { test as base, expect, Page, APIRequestContext } from '@playwright/test';
import { config } from '../config';

type TestFixtures = {
  authenticatedPage: Page;
  apiContext: APIRequestContext;
  accessToken: string;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto(config.loginRoute);
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[placeholder*="账号"]').first().fill(config.adminUsername);
    await page.locator('input[type="password"]').first().fill(config.adminPassword);
    await page.locator('button[type="submit"], button:has-text("登录")').first().click();
    await page.waitForURL(`**${config.dashboardRoute}**`, { timeout: config.pageLoadTimeout });
    await use(page);
  },

  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });
    await use(context);
    await context.dispose();
  },

  accessToken: async ({ apiContext }, use) => {
    const response = await apiContext.post(`${config.apiPath}/auth/login`, {
      data: {
        username: config.adminUsername,
        password: config.adminPassword,
      },
    });
    const body = await response.json();
    const token = body.result?.accessToken || body.data?.accessToken || '';
    await use(token);
  },
});

export { expect };
export { config };
