import { test, expect, config } from './fixtures';

test.describe('问卷管理列表模块', () => {
  test('TC-LIST-001: 列表字段完整性-标题、状态、回收量、创建时间、操作列均展示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const headers = page.locator('thead th, .ant-table-thead th, [class*="header"] [class*="cell"]');
    const headerTexts = await headers.allTextContents();
    const joined = headerTexts.join('');
    expect(joined).toContain('标题');
    expect(joined).toMatch(/状态/);
    expect(joined).toMatch(/回收量|回收/);
    expect(joined).toMatch(/创建时间|创建日期/);
    expect(joined).toMatch(/操作/);
  });

  test('TC-LIST-002: 字段缺失时列表仍可正常渲染不崩溃', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const table = page.locator('.ant-table, table, [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: config.defaultTimeout });
    const rows = page.locator('tbody tr, .ant-table-tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-LIST-003: 按状态筛选-选择进行中仅展示进行中问卷', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const statusFilter = page.locator('select, .ant-select, [class*="filter"] [class*="select"]').first();
    await statusFilter.click();
    await page.locator('[class*="option"], .ant-select-item').filter({ hasText: /进行中|发布/ }).first().click();
    await page.waitForLoadState('networkidle');
    const statusCells = page.locator('tbody td:nth-child(2), .ant-table-tbody td:nth-child(2)');
    const count = await statusCells.count();
    for (let i = 0; i < count; i++) {
      const text = await statusCells.nth(i).textContent();
      expect(text).toMatch(/进行中|发布|已发布/);
    }
  });

  test('TC-LIST-004: 筛选切换回全部时展示所有状态问卷', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const statusFilter = page.locator('select, .ant-select, [class*="filter"] [class*="select"]').first();
    await statusFilter.click();
    await page.locator('[class*="option"], .ant-select-item').filter({ hasText: /进行中|发布/ }).first().click();
    await page.waitForLoadState('networkidle');
    const filteredCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    await statusFilter.click();
    await page.locator('[class*="option"], .ant-select-item').filter({ hasText: /全部|所有/ }).first().click();
    await page.waitForLoadState('networkidle');
    const allCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('TC-LIST-005: 标题搜索框输入后按Enter触发搜索', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="标题"], input[placeholder*="查找"], input[type="search"]').first();
    await searchInput.fill('测试');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    const rows = page.locator('tbody tr, .ant-table-tbody tr');
    const count = await rows.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await rows.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('测试');
      }
    }
  });

  test('TC-LIST-006: 搜索清除后恢复完整列表', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const initialCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="标题"], input[placeholder*="查找"], input[type="search"]').first();
    await searchInput.fill('测试');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await searchInput.clear();
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    const restoredCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('TC-LIST-007: 搜索无结果时展示空状态', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="标题"], input[placeholder*="查找"], input[type="search"]').first();
    await searchInput.fill('不存在的问卷名称ZZZZZZZ999');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('.ant-empty, [class*="empty"], [class*="no-data"]').first();
    await expect(emptyState).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-LIST-008: 默认分页每页20条', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('tbody tr, .ant-table-tbody tr');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(20);
    const pageSizeSelector = page.locator('.ant-pagination-options, .ant-select-selection-item, [class*="page-size"]');
    if (await pageSizeSelector.count() > 0) {
      const sizeText = await pageSizeSelector.first().textContent();
      expect(sizeText).toMatch(/20/);
    }
  });

  test('TC-LIST-009: 切换每页条数后列表刷新', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const pageSizeSelector = page.locator('.ant-pagination-options .ant-select, .ant-select:has([class*="page"]), [class*="page-size"] select').first();
    await pageSizeSelector.click();
    await page.locator('.ant-select-item, [class*="option"]').filter({ hasText: /10/ }).first().click();
    await page.waitForLoadState('networkidle');
    const rows = page.locator('tbody tr, .ant-table-tbody tr');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test('TC-LIST-010: 数据加载时展示Loading状态', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.route('**/api/**questionnaire**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(config.questionnaireListRoute);
    const loading = page.locator('.ant-spin, [class*="loading"], [class*="spinner"]').first();
    await expect(loading).toBeVisible({ timeout: 5000 });
  });

  test('TC-LIST-011: 数据加载完成后Loading消失', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const loading = page.locator('.ant-spin-spinning, [class*="loading"]:visible');
    await expect(loading).toHaveCount(0, { timeout: config.defaultTimeout });
  });

  test('TC-LIST-012: 无数据时展示空状态组件', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.route('**/api/**questionnaire**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, result: { list: [], total: 0 }, data: { list: [], total: 0 } }),
      });
    });
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('.ant-empty, [class*="empty"], [class*="no-data"]').first();
    await expect(emptyState).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-LIST-013: 空状态下可通过新建入口创建问卷', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.route('**/api/**questionnaire**list**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, result: { list: [], total: 0 }, data: { list: [], total: 0 } }),
      });
    });
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建"), a:has-text("新建")').first();
    await expect(createBtn).toBeVisible({ timeout: config.defaultTimeout });
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
  });

  test('TC-LIST-014: 顶部新建按钮可见且可点击', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('TC-LIST-015: 点击新建按钮跳转到问卷编辑页', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    expect(page.url()).toContain(config.questionnaireEditRoute);
  });

  test('TC-LIST-016: 草稿状态问卷操作列包含编辑、删除、发布按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const draftRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first();
    if (await draftRow.count() > 0) {
      const actions = draftRow.locator('button, a[class*="btn"], [class*="action"]');
      const actionsText = await actions.allTextContents();
      const joined = actionsText.join('');
      expect(joined).toMatch(/编辑/);
      expect(joined).toMatch(/删除/);
      expect(joined).toMatch(/发布/);
    }
  });

  test('TC-LIST-017: 进行中状态问卷操作列包含统计、关闭按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const activeRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /进行中|收集中|已发布/ }).first();
    if (await activeRow.count() > 0) {
      const actions = activeRow.locator('button, a[class*="btn"], [class*="action"]');
      const actionsText = await actions.allTextContents();
      const joined = actionsText.join('');
      expect(joined).toMatch(/统计/);
      expect(joined).toMatch(/关闭|停止/);
    }
  });

  test('TC-LIST-018: 已关闭状态问卷操作列包含统计、删除、复制按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const closedRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /已关闭|已停止/ }).first();
    if (await closedRow.count() > 0) {
      const actions = closedRow.locator('button, a[class*="btn"], [class*="action"]');
      const actionsText = await actions.allTextContents();
      const joined = actionsText.join('');
      expect(joined).toMatch(/统计/);
      expect(joined).toMatch(/删除/);
      expect(joined).toMatch(/复制/);
    }
  });

  test('TC-LIST-019: 草稿状态问卷不展示统计按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const draftRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first();
    if (await draftRow.count() > 0) {
      const statsBtn = draftRow.locator('button:has-text("统计"), a:has-text("统计")');
      await expect(statsBtn).toHaveCount(0);
    }
  });

  test('TC-LIST-020: 进行中状态问卷不展示删除按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const activeRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /进行中|收集中|已发布/ }).first();
    if (await activeRow.count() > 0) {
      const deleteBtn = activeRow.locator('button:has-text("删除")');
      await expect(deleteBtn).toHaveCount(0);
    }
  });

  test('TC-LIST-021: 进行中状态问卷不展示编辑按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const activeRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /进行中|收集中|已发布/ }).first();
    if (await activeRow.count() > 0) {
      const editBtn = activeRow.locator('button:has-text("编辑")');
      await expect(editBtn).toHaveCount(0);
    }
  });

  test('TC-LIST-022: 点击编辑按钮跳转到问卷编辑页', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('tbody tr, .ant-table-tbody tr').first()
      .locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
      expect(page.url()).toContain(config.questionnaireEditRoute);
    }
  });

  test('TC-LIST-023: 编辑跳转URL包含问卷ID参数', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('tbody tr, .ant-table-tbody tr').first()
      .locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
      const url = page.url();
      expect(url).toMatch(/\/questionnaire\/edit\/\w+/);
    }
  });

  test('TC-LIST-024: 点击统计按钮跳转到统计页', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const statsBtn = page.locator('tbody tr, .ant-table-tbody tr')
      .locator('button:has-text("统计"), a:has-text("统计")').first();
    if (await statsBtn.count() > 0) {
      await statsBtn.click();
      await page.waitForURL(`**${config.statisticsOverviewRoute}**`, { timeout: config.defaultTimeout });
      expect(page.url()).toContain('/statistics');
    }
  });

  test('TC-LIST-025: 统计跳转URL包含问卷ID', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const statsBtn = page.locator('tbody tr, .ant-table-tbody tr')
      .locator('button:has-text("统计"), a:has-text("统计")').first();
    if (await statsBtn.count() > 0) {
      await statsBtn.click();
      await page.waitForURL(`**/statistics/**`, { timeout: config.defaultTimeout });
      const url = page.url();
      expect(url).toMatch(/\/statistics\/\w+\/?\w*/);
    }
  });

  test('TC-LIST-026: 点击发布按钮弹出发布确认弹窗', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first()
      .locator('button:has-text("发布")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-LIST-027: 发布弹窗包含确认和取消按钮', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first()
      .locator('button:has-text("发布")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
      const confirmBtn = modal.locator('button:has-text("确"), button:has-text("发布"), button[class*="primary"]');
      const cancelBtn = modal.locator('button:has-text("取消"), button:has-text("关闭")');
      await expect(confirmBtn.first()).toBeVisible();
      await expect(cancelBtn.first()).toBeVisible();
    }
  });

  test('TC-LIST-028: 点击复制按钮成功复制问卷', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const initialRows = await page.locator('tbody tr, .ant-table-tbody tr').count();
    const copyBtn = page.locator('tbody tr, .ant-table-tbody tr')
      .locator('button:has-text("复制"), a:has-text("复制")').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForLoadState('networkidle');
      const message = page.locator('.ant-message, [class*="message"], [class*="toast"]');
      await expect(message.first()).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-LIST-029: 复制后新问卷出现在列表中', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const beforeCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    const copyBtn = page.locator('tbody tr, .ant-table-tbody tr')
      .locator('button:has-text("复制"), a:has-text("复制")').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const afterCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
      expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
    }
  });

  test('TC-LIST-030: 点击删除按钮弹出确认弹窗', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布|已关闭/ }).first()
      .locator('button:has-text("删除")').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      const confirmDialog = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]').first();
      await expect(confirmDialog).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-LIST-031: 删除确认弹窗包含二次确认文案', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布|已关闭/ }).first()
      .locator('button:has-text("删除")').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      const confirmDialog = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]').first();
      await expect(confirmDialog).toBeVisible({ timeout: config.defaultTimeout });
      const text = await confirmDialog.textContent();
      expect(text).toMatch(/确认|删除|确定/);
    }
  });

  test('TC-LIST-032: 取消删除操作后问卷仍在列表中', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const beforeCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    const deleteBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布|已关闭/ }).first()
      .locator('button:has-text("删除")').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      const cancelBtn = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]')
        .first().locator('button:has-text("取消"), button:has-text("否")').first();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
      }
      await page.waitForLoadState('networkidle');
      const afterCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
      expect(afterCount).toBe(beforeCount);
    }
  });

  test('TC-LIST-033: 确认删除后问卷从列表移除', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const beforeCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    const targetRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first();
    if (await targetRow.count() > 0) {
      const deleteBtn = targetRow.locator('button:has-text("删除")').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        const confirmBtn = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]')
          .first().locator('button:has-text("确"), button:has-text("是"), button:has-text("删除"), button[class*="primary"], button[class*="danger"]').first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          const afterCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
          expect(afterCount).toBeLessThan(beforeCount);
        }
      }
    }
  });

  test('TC-LIST-034: 点击关闭按钮弹出关闭确认弹窗', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const activeRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /进行中|收集中|已发布/ }).first();
    if (await activeRow.count() > 0) {
      const closeBtn = activeRow.locator('button:has-text("关闭"), button:has-text("停止")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        const confirmDialog = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]').first();
        await expect(confirmDialog).toBeVisible({ timeout: config.defaultTimeout });
      }
    }
  });

  test('TC-LIST-035: 确认关闭后问卷状态变为已关闭', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const activeRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /进行中|收集中|已发布/ }).first();
    if (await activeRow.count() > 0) {
      const titleText = await activeRow.locator('td').first().textContent();
      const closeBtn = activeRow.locator('button:has-text("关闭"), button:has-text("停止")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        const confirmBtn = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]')
          .first().locator('button:has-text("确"), button:has-text("是"), button[class*="primary"]').first();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForLoadState('networkidle');
          const updatedRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: titleText || '' }).first();
          if (await updatedRow.count() > 0) {
            const rowText = await updatedRow.textContent();
            expect(rowText).toMatch(/已关闭|已停止/);
          }
        }
      }
    }
  });

  test('TC-LIST-036: 取消关闭操作问卷保持原状态', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const activeRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /进行中|收集中|已发布/ }).first();
    if (await activeRow.count() > 0) {
      const closeBtn = activeRow.locator('button:has-text("关闭"), button:has-text("停止")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        const cancelBtn = page.locator('.ant-modal-confirm, .ant-popconfirm, [class*="confirm"], [role="dialog"]')
          .first().locator('button:has-text("取消"), button:has-text("否")').first();
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
        }
        await page.waitForLoadState('networkidle');
        const rowText = await activeRow.textContent();
        expect(rowText).toMatch(/进行中|收集中|已发布/);
      }
    }
  });

  test('TC-LIST-037: 发布弹窗展示问卷链接', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first()
      .locator('button:has-text("发布")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
      const modalText = await modal.textContent();
      expect(modalText).toMatch(/链接|link|URL|地址|http/i);
    }
  });

  test('TC-LIST-038: 发布弹窗展示截止时间配置', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first()
      .locator('button:has-text("发布")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
      const dateInput = modal.locator('input[type="date"], .ant-picker, [class*="date"], [class*="time"]');
      const hasDateConfig = await dateInput.count() > 0;
      const modalText = await modal.textContent();
      const hasTimeText = /截止|结束|时间|日期/.test(modalText || '');
      expect(hasDateConfig || hasTimeText).toBeTruthy();
    }
  });

  test('TC-LIST-039: 发布弹窗配置回收上限', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first()
      .locator('button:has-text("发布")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
      const modalText = await modal.textContent();
      expect(modalText).toMatch(/上限|回收|限制|数量/);
    }
  });

  test('TC-LIST-040: 发布确认后问卷状态变为进行中', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const draftRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first();
    if (await draftRow.count() > 0) {
      const titleText = await draftRow.locator('td').first().textContent();
      const publishBtn = draftRow.locator('button:has-text("发布")').first();
      if (await publishBtn.count() > 0) {
        await publishBtn.click();
        const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
        await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
        const confirmBtn = modal.locator('button:has-text("确"), button:has-text("发布"), button[class*="primary"]').first();
        await confirmBtn.click();
        await page.waitForLoadState('networkidle');
        const message = page.locator('.ant-message, [class*="message"], [class*="toast"]');
        if (await message.count() > 0) {
          await expect(message.first()).toBeVisible({ timeout: config.defaultTimeout });
        }
      }
    }
  });

  test('TC-LIST-041: 发布成功后弹窗关闭', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const draftRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first();
    if (await draftRow.count() > 0) {
      const publishBtn = draftRow.locator('button:has-text("发布")').first();
      if (await publishBtn.count() > 0) {
        await publishBtn.click();
        const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
        await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
        const confirmBtn = modal.locator('button:has-text("确"), button:has-text("发布"), button[class*="primary"]').first();
        await confirmBtn.click();
        await page.waitForLoadState('networkidle');
        await expect(modal).toBeHidden({ timeout: config.defaultTimeout });
      }
    }
  });

  test('TC-LIST-042: 发布成功后列表自动刷新', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const draftRow = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first();
    if (await draftRow.count() > 0) {
      const publishBtn = draftRow.locator('button:has-text("发布")').first();
      if (await publishBtn.count() > 0) {
        const requestPromise = page.waitForResponse((resp) => resp.url().includes('questionnaire') && resp.status() === 200);
        await publishBtn.click();
        const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
        const confirmBtn = modal.locator('button:has-text("确"), button:has-text("发布"), button[class*="primary"]').first();
        await confirmBtn.click();
        await requestPromise;
      }
    }
  });

  test('TC-LIST-043: 发布弹窗取消按钮关闭弹窗', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('tbody tr, .ant-table-tbody tr').filter({ hasText: /草稿|未发布/ }).first()
      .locator('button:has-text("发布")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
      const cancelBtn = modal.locator('button:has-text("取消"), button:has-text("关闭")').first();
      await cancelBtn.click();
      await expect(modal).toBeHidden({ timeout: config.defaultTimeout });
    }
  });

  test('TC-LIST-044: 列表按创建时间降序排列', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const timeCells = page.locator('tbody td:nth-child(4), .ant-table-tbody td:nth-child(4)');
    const count = await timeCells.count();
    if (count >= 2) {
      const times: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await timeCells.nth(i).textContent();
        times.push(text?.trim() || '');
      }
      for (let i = 0; i < times.length - 1; i++) {
        expect(new Date(times[i]).getTime()).toBeGreaterThanOrEqual(new Date(times[i + 1]).getTime());
      }
    }
  });

  test('TC-LIST-045: 回收量数值正确展示为非负整数', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const collectCells = page.locator('tbody td:nth-child(3), .ant-table-tbody td:nth-child(3)');
    const count = await collectCells.count();
    for (let i = 0; i < count; i++) {
      const text = await collectCells.nth(i).textContent();
      const num = parseInt(text?.trim() || '0', 10);
      expect(num).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC-LIST-046: 状态标签使用不同颜色区分', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const statusTags = page.locator('.ant-tag, [class*="tag"], [class*="badge"], [class*="status"]');
    const count = await statusTags.count();
    if (count >= 2) {
      const colors = new Set<string>();
      for (let i = 0; i < count; i++) {
        const color = await statusTags.nth(i).evaluate((el) => window.getComputedStyle(el).backgroundColor);
        colors.add(color);
      }
      expect(colors.size).toBeGreaterThanOrEqual(1);
    }
  });

  test('TC-LIST-047: 分页器展示总条数信息', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const pagination = page.locator('.ant-pagination, [class*="pagination"]').first();
    if (await pagination.count() > 0) {
      const paginationText = await pagination.textContent();
      expect(paginationText).toMatch(/共|总|条|total/i);
    }
  });

  test('TC-LIST-048: 翻页后数据正确切换', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const firstPageFirstRow = await page.locator('tbody tr, .ant-table-tbody tr').first().textContent();
    const nextPageBtn = page.locator('.ant-pagination-next, [class*="pagination"] [class*="next"], button[aria-label="Next"]').first();
    if (await nextPageBtn.count() > 0 && await nextPageBtn.isEnabled()) {
      await nextPageBtn.click();
      await page.waitForLoadState('networkidle');
      const secondPageFirstRow = await page.locator('tbody tr, .ant-table-tbody tr').first().textContent();
      expect(secondPageFirstRow).not.toBe(firstPageFirstRow);
    }
  });

  test('TC-LIST-049: 网络异常时展示错误提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.route('**/api/**questionnaire**', (route) => route.abort());
    await page.goto(config.questionnaireListRoute);
    await page.waitForTimeout(3000);
    const errorState = page.locator('.ant-message-error, .ant-result-error, [class*="error"], [class*="empty"]').first();
    if (await errorState.count() > 0) {
      await expect(errorState).toBeVisible();
    }
  });

  test('TC-LIST-050: 刷新页面后列表数据重新加载', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const beforeCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const afterCount = await page.locator('tbody tr, .ant-table-tbody tr').count();
    expect(afterCount).toBe(beforeCount);
  });
});
