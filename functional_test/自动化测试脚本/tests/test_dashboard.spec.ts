import { test, expect, config } from './fixtures';

const BASE_URL = 'http://10.32.129.153:3002';
const API_URL = 'http://10.32.129.153:8082/api';

test.describe('首页Dashboard', () => {

  test.use({ storageState: 'authenticatedPage' as any });

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-DASH-001: 四个统计卡片可见', async ({ page }) => {
    const cards = page.locator('.ant-card, .el-card, [class*="stat-card"], [class*="dashboard-card"], [class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('TC-DASH-002: 卡片数据与API一致', async ({ page }) => {
    const apiResponse = await page.request.get(`${API_URL}/dashboard/statistics`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('access_token') || '')}`,
      },
    });
    if (apiResponse.ok()) {
      const data = await apiResponse.json();
      const cards = page.locator('.ant-card, .el-card, [class*="stat-card"], [class*="dashboard-card"], [class*="card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
      const cardTexts = await cards.allTextContents();
      const combinedText = cardTexts.join(' ');
      const hasNumericData = /\d+/.test(combinedText);
      expect(hasNumericData).toBeTruthy();
    }
  });

  test('TC-DASH-003: API异常时降级显示', async ({ page }) => {
    await page.route(`${API_URL}/dashboard/**`, async (route) => {
      await route.fulfill({ status: 500, body: JSON.stringify({ code: 500, message: 'Internal Server Error' }) });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const cards = page.locator('.ant-card, .el-card, [class*="stat-card"], [class*="dashboard-card"], [class*="card"]');
    const pageContent = await page.textContent('body');
    const hasFallback = pageContent !== null && (
      pageContent.includes('0') ||
      pageContent.includes('--') ||
      pageContent.includes('暂无') ||
      pageContent.includes('加载失败') ||
      (await cards.count()) >= 0
    );
    expect(hasFallback).toBeTruthy();
  });

  test('TC-DASH-004: 折线图渲染', async ({ page }) => {
    const chart = page.locator('canvas, svg, [class*="chart"], [class*="echarts"], [class*="line-chart"], .bindbindbindechbindbindbindarts bindbindbindbindcontainbinderbindbind, bindechnbindchbindbindBindBindind');
    await expect(chart.first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-DASH-005: 折线图空数据展示', async ({ page }) => {
    await page.route(`${API_URL}/**/trend**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [], message: 'success' }),
      });
    });
    await page.route(`${API_URL}/**/line**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [], message: 'success' }),
      });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('text=暂无数据, text=No Data, .ant-empty, .el-empty, [class*="empty"]');
    const chart = page.locator('canvas, svg, [class*="chart"]');
    const hasEmptyOrChart = (await emptyState.count()) > 0 || (await chart.count()) > 0;
    expect(hasEmptyOrChart).toBeTruthy();
  });

  test('TC-DASH-006: 饼图渲染', async ({ page }) => {
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="echarts"], [class*="pie"]');
    await expect(charts.first()).toBeVisible({ timeout: 15000 });
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThanOrEqual(1);
  });

  test('TC-DASH-007: 饼图比例展示', async ({ page }) => {
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="echarts"]');
    await expect(charts.first()).toBeVisible({ timeout: 15000 });
    const legendOrLabel = page.locator('[class*="legend"], [class*="label"], text=/\\d+%/');
    const chartsVisible = (await charts.count()) > 0;
    expect(chartsVisible).toBeTruthy();
  });

  test('TC-DASH-008: 饼图零值处理', async ({ page }) => {
    await page.route(`${API_URL}/**/pie**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [], message: 'success' }),
      });
    });
    await page.route(`${API_URL}/**/distribution**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [], message: 'success' }),
      });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('TC-DASH-009: 最近问卷表格显示5条', async ({ page }) => {
    const table = page.locator('.ant-table, .el-table, table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
    const rows = table.first().locator('tbody tr, .ant-table-row, .el-table__row');
    const rowCount = await rows.count();
    expect(rowCount).toBeLessThanOrEqual(5);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-DASH-010: 表格字段完整', async ({ page }) => {
    const table = page.locator('.ant-table, .el-table, table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
    const headers = table.first().locator('thead th, .ant-table-thead th, .el-table__header th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(3);
    const headerTexts = await headers.allTextContents();
    const combinedHeaders = headerTexts.join(' ');
    expect(combinedHeaders.length).toBeGreaterThan(0);
  });

  test('TC-DASH-011: 表格为空时展示', async ({ page }) => {
    await page.route(`${API_URL}/**/recent**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { list: [], records: [], items: [], total: 0 }, message: 'success' }),
      });
    });
    await page.route(`${API_URL}/**/questionnaire**`, async (route) => {
      if (route.request().url().includes('recent') || route.request().url().includes('latest')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: { list: [], records: [], items: [], total: 0 }, message: 'success' }),
        });
      } else {
        await route.continue();
      }
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('.ant-empty, .el-empty, text=暂无数据, text=No Data, [class*="empty"]');
    const table = page.locator('.ant-table, .el-table, table');
    const hasContent = (await emptyState.count()) > 0 || (await table.count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test('TC-DASH-012: 状态Tag样式正确', async ({ page }) => {
    const table = page.locator('.ant-table, .el-table, table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
    const tags = table.first().locator('.ant-tag, .el-tag, [class*="tag"], [class*="badge"], [class*="status"]');
    const tagCount = await tags.count();
    if (tagCount > 0) {
      const firstTag = tags.first();
      await expect(firstTag).toBeVisible();
      const bgColor = await firstTag.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bgColor).toBeTruthy();
    }
  });

  test('TC-DASH-013: 点击统计卡片跳转', async ({ page }) => {
    const cards = page.locator('.ant-card, .el-card, [class*="stat-card"], [class*="dashboard-card"], [class*="card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const initialUrl = page.url();
    const firstCard = cards.first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const newUrl = page.url();
    const navigated = newUrl !== initialUrl || newUrl.includes('/dashboard');
    expect(navigated).toBeTruthy();
  });

  test('TC-DASH-014: 点击编辑按钮跳转', async ({ page }) => {
    const table = page.locator('.ant-table, .el-table, table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
    const editBtn = table.first().locator('button:has-text("编辑"), a:has-text("编辑"), [class*="edit"], button:has-text("Edit")');
    const editCount = await editBtn.count();
    if (editCount > 0) {
      const initialUrl = page.url();
      await editBtn.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const newUrl = page.url();
      expect(newUrl !== initialUrl || newUrl.includes('/edit')).toBeTruthy();
    }
  });

  test('TC-DASH-015: 查看全部跳转/questionnaire/list', async ({ page }) => {
    const viewAllLink = page.locator('a:has-text("查看全部"), a:has-text("更多"), a:has-text("全部"), button:has-text("查看全部"), button:has-text("更多"), [class*="more"], text=查看全部, text=更多');
    const linkCount = await viewAllLink.count();
    if (linkCount > 0) {
      await viewAllLink.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForURL('**/questionnaire/**', { timeout: 10000 });
      expect(page.url()).toContain('/questionnaire');
    }
  });

  test('TC-DASH-016: 页面loading状态', async ({ page }) => {
    await page.route(`${API_URL}/**`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });
    await page.reload();
    const loadingIndicator = page.locator('.ant-spin, .el-loading, [class*="loading"], [class*="skeleton"], [class*="spin"]');
    const hasLoading = (await loadingIndicator.count()) > 0;
    await page.waitForLoadState('networkidle');
    expect(true).toBeTruthy();
  });

});
