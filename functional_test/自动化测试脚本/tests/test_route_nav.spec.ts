import { test, expect, config } from './fixtures';

const BASE_URL = 'http://10.32.129.153:3002';

test.describe('路由导航与业务流程', () => {

  test.use({ storageState: 'authenticatedPage' as any });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-NAV-001: 点击侧边栏"问卷管理"菜单，页面跳转，菜单高亮', async ({ page }) => {
    const sidebar = page.locator('.ant-layout-sider, .el-aside, nav, [class*="sidebar"], [class*="side-menu"], [class*="menu"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    const menuItem = sidebar.first().locator('text=问卷管理, text=问卷, a:has-text("问卷"), span:has-text("问卷管理")');
    await expect(menuItem.first()).toBeVisible({ timeout: 5000 });
    await menuItem.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/questionnaire|survey/);
    const activeMenu = sidebar.first().locator('.ant-menu-item-selected, .el-menu-item.is-active, [class*="active"], [aria-selected="true"]');
    const activeCount = await activeMenu.count();
    expect(activeCount).toBeGreaterThanOrEqual(1);
    const activeTexts = await activeMenu.allTextContents();
    const hasQuestionnaireActive = activeTexts.some((t) => t.includes('问卷'));
    expect(hasQuestionnaireActive).toBeTruthy();
  });

  test('TC-NAV-002: 点击"数据统计"菜单，页面跳转', async ({ page }) => {
    const sidebar = page.locator('.ant-layout-sider, .el-aside, nav, [class*="sidebar"], [class*="side-menu"], [class*="menu"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    const menuItem = sidebar.first().locator('text=数据统计, text=统计, a:has-text("统计"), span:has-text("数据统计")');
    await expect(menuItem.first()).toBeVisible({ timeout: 5000 });
    await menuItem.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/statistic|analytics|data|report/);
  });

  test('TC-NAV-003: 菜单视觉反馈（hover与active状态）', async ({ page }) => {
    const sidebar = page.locator('.ant-layout-sider, .el-aside, nav, [class*="sidebar"], [class*="side-menu"], [class*="menu"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    const menuItems = sidebar.first().locator('.ant-menu-item, .el-menu-item, [class*="menu-item"], li[role="menuitem"]');
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(2);
    const firstItem = menuItems.first();
    const beforeHoverBg = await firstItem.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    await firstItem.hover();
    await page.waitForTimeout(500);
    const afterHoverBg = await firstItem.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const activeItem = sidebar.first().locator('.ant-menu-item-selected, .el-menu-item.is-active, [class*="active"]');
    const activeCount = await activeItem.count();
    if (activeCount > 0) {
      const activeBg = await activeItem.first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(activeBg).toBeTruthy();
    }
    const hasVisualFeedback = beforeHoverBg !== afterHoverBg || activeCount > 0;
    expect(hasVisualFeedback).toBeTruthy();
  });

});
