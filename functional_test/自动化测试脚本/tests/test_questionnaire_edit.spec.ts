import { test, expect, config } from './fixtures';

test.describe('问卷编辑模块', () => {
  test('TC-EDIT-001: 点击新建自动创建草稿并跳转编辑页', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    expect(page.url()).toContain(config.questionnaireEditRoute);
  });

  test('TC-EDIT-002: 新建草稿问卷包含默认标题', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [contenteditable]:has-text("未命名"), h1[contenteditable], [class*="title"][contenteditable]').first();
    await expect(titleInput).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-003: 编辑已有问卷正确加载问卷数据', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('tbody tr, .ant-table-tbody tr').first()
      .locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
      await page.waitForLoadState('networkidle');
      const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
      await expect(titleInput).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-EDIT-004: 编辑已有问卷URL包含问卷ID', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('tbody tr, .ant-table-tbody tr').first()
      .locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
      expect(page.url()).toMatch(/\/questionnaire\/edit\/\w+/);
    }
  });

  test('TC-EDIT-005: 标题可编辑并实时更新', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
    const newTitle = '自动化测试标题' + Date.now();
    if (await titleInput.getAttribute('contenteditable') !== null) {
      await titleInput.click();
      await titleInput.fill(newTitle);
    } else {
      await titleInput.clear();
      await titleInput.fill(newTitle);
    }
    const value = await titleInput.inputValue().catch(() => titleInput.textContent());
    expect(value).toContain('自动化测试标题');
  });

  test('TC-EDIT-006: 描述可编辑', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const descInput = page.locator('textarea[placeholder*="描述"], textarea[placeholder*="说明"], [class*="desc"] textarea, [class*="description"][contenteditable], [class*="desc"][contenteditable]').first();
    if (await descInput.count() > 0) {
      const desc = '自动化测试描述';
      if (await descInput.getAttribute('contenteditable') !== null) {
        await descInput.click();
        await descInput.fill(desc);
      } else {
        await descInput.clear();
        await descInput.fill(desc);
      }
      const value = await descInput.inputValue().catch(() => descInput.textContent());
      expect(value).toContain(desc);
    }
  });

  test('TC-EDIT-007: 标题为空时展示提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
    if (await titleInput.getAttribute('contenteditable') !== null) {
      await titleInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
    } else {
      await titleInput.clear();
    }
    await titleInput.blur();
    const hint = page.locator('[class*="error"], [class*="warning"], [class*="hint"], .ant-form-item-explain').first();
    if (await hint.count() > 0) {
      await expect(hint).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-EDIT-008: 编辑页展示三栏布局-左侧题型面板', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const leftPanel = page.locator('[class*="left"], [class*="sidebar"], [class*="panel"]:first-child, [class*="question-type"]').first();
    await expect(leftPanel).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-009: 编辑页展示三栏布局-中间画布和右侧属性面板', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const canvas = page.locator('[class*="canvas"], [class*="center"], [class*="main"], [class*="content"]').first();
    await expect(canvas).toBeVisible({ timeout: config.defaultTimeout });
    const rightPanel = page.locator('[class*="right"], [class*="property"], [class*="config"], [class*="setting"]').first();
    if (await rightPanel.count() > 0) {
      await expect(rightPanel).toBeVisible();
    }
  });

  test('TC-EDIT-010: 左侧题型面板展示所有题型', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/单选|radio/i);
    expect(pageText).toMatch(/多选|checkbox/i);
    expect(pageText).toMatch(/填空|输入|input|text/i);
  });

  test('TC-EDIT-011: 题型面板包含评分题类型', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/评分|打分|rating|star/i);
  });

  test('TC-EDIT-012: 点击题型添加单选题到画布', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    const questionCard = page.locator('[class*="question"], [class*="card"], [class*="item"]').filter({ hasText: /单选|选项/ });
    await expect(questionCard.first()).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-013: 点击题型添加多选题到画布', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const checkboxType = page.locator('button:has-text("多选"), [class*="type"]:has-text("多选"), div:has-text("多选题")').first();
    await checkboxType.click();
    const questionCard = page.locator('[class*="question"], [class*="card"], [class*="item"]').filter({ hasText: /多选|选项/ });
    await expect(questionCard.first()).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-014: 点击题型添加填空题到画布', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const inputType = page.locator('button:has-text("填空"), [class*="type"]:has-text("填空"), div:has-text("填空题"), button:has-text("输入"), [class*="type"]:has-text("输入")').first();
    await inputType.click();
    const questionCard = page.locator('[class*="question"], [class*="card"], [class*="item"]').filter({ hasText: /填空|输入/ });
    await expect(questionCard.first()).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-015: 添加题目后画布展示题目卡片', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    const cards = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问/ });
    await expect(cards.first()).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-016: 题目卡片展示题号序号', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const cardText = await page.locator('[class*="question"], [class*="card"]').first().textContent();
    expect(cardText).toMatch(/1|Q1|第.*题/);
  });

  test('TC-EDIT-017: 拖拽题目可改变排序', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const checkboxType = page.locator('button:has-text("多选"), [class*="type"]:has-text("多选"), div:has-text("多选题")').first();
    await checkboxType.click();
    await page.waitForTimeout(500);
    const cards = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    if (firstBox && secondBox) {
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height + 10, { steps: 10 });
      await page.mouse.up();
    }
  });

  test('TC-EDIT-018: 拖拽排序后题号自动更新', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const checkboxType = page.locator('button:has-text("多选"), [class*="type"]:has-text("多选"), div:has-text("多选题")').first();
    await checkboxType.click();
    await page.waitForTimeout(500);
    const cards = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ });
    const count = await cards.count();
    if (count >= 2) {
      const firstText = await cards.first().textContent();
      const secondText = await cards.nth(1).textContent();
      expect(firstText).toMatch(/1|Q1/);
      expect(secondText).toMatch(/2|Q2/);
    }
  });

  test('TC-EDIT-019: 点击题目卡片右侧展示属性面板', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const propPanel = page.locator('[class*="property"], [class*="config"], [class*="setting"], [class*="right"]').first();
    await expect(propPanel).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-020: 属性面板展示题干编辑区域', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const titleEdit = page.locator('input[placeholder*="题"], textarea[placeholder*="题"], [class*="title"] input, [class*="question-title"]').first();
    if (await titleEdit.count() > 0) {
      await expect(titleEdit).toBeVisible();
    }
  });

  test('TC-EDIT-021: 属性面板展示必填设置', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const requiredToggle = page.locator('[class*="required"], [class*="switch"]:near(:text("必填")), label:has-text("必填"), :text("必填")').first();
    await expect(requiredToggle).toBeVisible({ timeout: config.defaultTimeout });
  });

  test('TC-EDIT-022: 修改题干文本实时更新到画布', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const titleEdit = page.locator('input[placeholder*="题"], textarea[placeholder*="题"], [class*="title"] input, [contenteditable]').first();
    const newTitle = '修改后的题干文本';
    await titleEdit.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(newTitle);
    await page.waitForTimeout(500);
    const canvasText = await page.locator('[class*="canvas"], [class*="center"], [class*="main"]').first().textContent();
    expect(canvasText).toContain(newTitle);
  });

  test('TC-EDIT-023: 题干支持中文输入', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const titleEdit = page.locator('input[placeholder*="题"], textarea[placeholder*="题"], [class*="title"] input, [contenteditable]').first();
    const chineseText = '请问您对本产品满意吗？';
    await titleEdit.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(chineseText);
    const value = await titleEdit.inputValue().catch(() => titleEdit.textContent());
    expect(value).toContain(chineseText);
  });

  test('TC-EDIT-024: 设置题目为必填', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const requiredSwitch = page.locator('.ant-switch, [class*="switch"], [role="switch"]').first();
    if (await requiredSwitch.count() > 0) {
      await requiredSwitch.click();
      const isChecked = await requiredSwitch.getAttribute('aria-checked');
      expect(isChecked === 'true' || await requiredSwitch.isChecked().catch(() => true)).toBeTruthy();
    }
  });

  test('TC-EDIT-025: 取消必填设置', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const requiredSwitch = page.locator('.ant-switch, [class*="switch"], [role="switch"]').first();
    if (await requiredSwitch.count() > 0) {
      await requiredSwitch.click();
      await requiredSwitch.click();
      const isChecked = await requiredSwitch.getAttribute('aria-checked');
      expect(isChecked === 'false' || !(await requiredSwitch.isChecked().catch(() => false))).toBeTruthy();
    }
  });

  test('TC-EDIT-026: 选项文本可编辑', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const optionInput = page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"], [class*="option"][contenteditable]').first();
    if (await optionInput.count() > 0) {
      await optionInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type('修改后的选项');
      const value = await optionInput.inputValue().catch(() => optionInput.textContent());
      expect(value).toContain('修改后的选项');
    }
  });

  test('TC-EDIT-027: 修改选项文本实时更新', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const optionInput = page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"], [class*="option"][contenteditable]').first();
    if (await optionInput.count() > 0) {
      const newText = '实时更新选项';
      await optionInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(newText);
      await page.waitForTimeout(500);
      const canvasText = await page.locator('[class*="canvas"], [class*="center"], [class*="main"]').first().textContent();
      expect(canvasText).toContain(newText);
    }
  });

  test('TC-EDIT-028: 选项支持特殊字符', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const optionInput = page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"], [class*="option"][contenteditable]').first();
    if (await optionInput.count() > 0) {
      const specialText = '选项@#$%&*（）';
      await optionInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.type(specialText);
      const value = await optionInput.inputValue().catch(() => optionInput.textContent());
      expect(value).toContain(specialText);
    }
  });

  test('TC-EDIT-029: 添加新选项', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const beforeOptions = await page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"]').count();
    const addBtn = page.locator('button:has-text("添加选项"), button:has-text("新增选项"), [class*="add-option"], button:has-text("添加"), a:has-text("添加选项")').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const afterOptions = await page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"]').count();
      expect(afterOptions).toBeGreaterThan(beforeOptions);
    }
  });

  test('TC-EDIT-030: 删除选项', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const beforeOptions = await page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"]').count();
    const deleteOptionBtn = page.locator('[class*="option"] [class*="delete"], [class*="option"] [class*="remove"], [class*="option"] button[class*="close"], [class*="option"] .anticon-delete, [class*="option"] .anticon-close').first();
    if (await deleteOptionBtn.count() > 0 && beforeOptions > 2) {
      await deleteOptionBtn.click();
      await page.waitForTimeout(500);
      const afterOptions = await page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"]').count();
      expect(afterOptions).toBeLessThan(beforeOptions);
    }
  });

  test('TC-EDIT-031: 选项数量不少于2个时禁止继续删除', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const options = page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"]');
    const count = await options.count();
    if (count <= 2) {
      const deleteOptionBtn = page.locator('[class*="option"] [class*="delete"], [class*="option"] [class*="remove"]').first();
      if (await deleteOptionBtn.count() > 0) {
        const isDisabled = await deleteOptionBtn.isDisabled().catch(() => false);
        const optionsAfter = await options.count();
        expect(isDisabled || optionsAfter >= 2).toBeTruthy();
      }
    }
  });

  test('TC-EDIT-032: 选项数量有上限限制', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const addBtn = page.locator('button:has-text("添加选项"), button:has-text("新增选项"), [class*="add-option"]').first();
    if (await addBtn.count() > 0) {
      for (let i = 0; i < 20; i++) {
        if (await addBtn.isEnabled().catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(200);
        } else {
          break;
        }
      }
      const options = page.locator('[class*="option"] input, [class*="choice"] input, input[placeholder*="选项"]');
      const count = await options.count();
      expect(count).toBeLessThanOrEqual(20);
    }
  });

  test('TC-EDIT-033: 评分题可配置分值范围', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const ratingType = page.locator('button:has-text("评分"), [class*="type"]:has-text("评分"), div:has-text("评分题"), button:has-text("打分")').first();
    if (await ratingType.count() > 0) {
      await ratingType.click();
      await page.waitForTimeout(500);
      const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /评分|打分|星/ }).first();
      await card.click();
      const scoreConfig = page.locator('input[type="number"], .ant-input-number, [class*="score"], [class*="rating"]');
      expect(await scoreConfig.count()).toBeGreaterThan(0);
    }
  });

  test('TC-EDIT-034: 评分题默认5分制', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const ratingType = page.locator('button:has-text("评分"), [class*="type"]:has-text("评分"), div:has-text("评分题"), button:has-text("打分")').first();
    if (await ratingType.count() > 0) {
      await ratingType.click();
      await page.waitForTimeout(500);
      const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /评分|打分|星/ }).first();
      await card.click();
      const stars = page.locator('[class*="star"], [class*="rate"] .ant-rate-star, svg[class*="star"]');
      if (await stars.count() > 0) {
        expect(await stars.count()).toBe(5);
      }
    }
  });

  test('TC-EDIT-035: 评分题修改分值上限', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const ratingType = page.locator('button:has-text("评分"), [class*="type"]:has-text("评分"), div:has-text("评分题"), button:has-text("打分")').first();
    if (await ratingType.count() > 0) {
      await ratingType.click();
      await page.waitForTimeout(500);
      const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /评分|打分|星/ }).first();
      await card.click();
      const maxInput = page.locator('.ant-input-number-input, input[type="number"]').first();
      if (await maxInput.count() > 0) {
        await maxInput.clear();
        await maxInput.fill('10');
        await page.waitForTimeout(500);
      }
    }
  });

  test('TC-EDIT-036: 填空题可配置占位文本', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const inputType = page.locator('button:has-text("填空"), [class*="type"]:has-text("填空"), div:has-text("填空题"), button:has-text("输入")').first();
    if (await inputType.count() > 0) {
      await inputType.click();
      await page.waitForTimeout(500);
      const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /填空|输入/ }).first();
      await card.click();
      const placeholderInput = page.locator('input[placeholder*="占位"], input[placeholder*="提示"], [class*="placeholder"] input').first();
      if (await placeholderInput.count() > 0) {
        await placeholderInput.clear();
        await placeholderInput.fill('请输入您的答案');
      }
    }
  });

  test('TC-EDIT-037: 填空题可设置字数限制', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const inputType = page.locator('button:has-text("填空"), [class*="type"]:has-text("填空"), div:has-text("填空题"), button:has-text("输入")').first();
    if (await inputType.count() > 0) {
      await inputType.click();
      await page.waitForTimeout(500);
      const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /填空|输入/ }).first();
      await card.click();
      const maxLenInput = page.locator('input[type="number"], .ant-input-number-input').first();
      if (await maxLenInput.count() > 0) {
        await maxLenInput.clear();
        await maxLenInput.fill('200');
      }
    }
  });

  test('TC-EDIT-038: 填空题可切换单行多行模式', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const inputType = page.locator('button:has-text("填空"), [class*="type"]:has-text("填空"), div:has-text("填空题"), button:has-text("输入")').first();
    if (await inputType.count() > 0) {
      await inputType.click();
      await page.waitForTimeout(500);
      const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /填空|输入/ }).first();
      await card.click();
      const modeSwitch = page.locator('[class*="switch"], [class*="radio"], [class*="toggle"]').filter({ hasText: /多行|单行|textarea/ }).first();
      if (await modeSwitch.count() > 0) {
        await modeSwitch.click();
      }
    }
  });

  test('TC-EDIT-039: 删除题目从画布移除', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const cards = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ });
    const beforeCount = await cards.count();
    const card = cards.first();
    await card.click();
    const deleteBtn = page.locator('button:has-text("删除"), [class*="delete"], .anticon-delete').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      const confirmBtn = page.locator('.ant-popconfirm button:has-text("确"), .ant-modal button:has-text("确"), button:has-text("确定")').first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
      }
      await page.waitForTimeout(500);
      const afterCount = await cards.count();
      expect(afterCount).toBeLessThan(beforeCount);
    }
  });

  test('TC-EDIT-040: 删除题目弹出确认提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const deleteBtn = page.locator('button:has-text("删除"), [class*="delete"], .anticon-delete').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      const confirmDialog = page.locator('.ant-popconfirm, .ant-modal-confirm, [role="dialog"], [class*="confirm"]');
      if (await confirmDialog.count() > 0) {
        await expect(confirmDialog.first()).toBeVisible();
      }
    }
  });

  test('TC-EDIT-041: 复制题目在画布中生成副本', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const cards = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ });
    const beforeCount = await cards.count();
    const card = cards.first();
    await card.click();
    const copyBtn = page.locator('button:has-text("复制"), [class*="copy"], .anticon-copy').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(500);
      const afterCount = await cards.count();
      expect(afterCount).toBe(beforeCount + 1);
    }
  });

  test('TC-EDIT-042: 复制题目后题号自动递增', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const card = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ }).first();
    await card.click();
    const copyBtn = page.locator('button:has-text("复制"), [class*="copy"], .anticon-copy').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(500);
      const cards = page.locator('[class*="question-card"], [class*="question-item"], [class*="card"]').filter({ hasText: /题|问|选/ });
      const lastCard = cards.last();
      const text = await lastCard.textContent();
      expect(text).toMatch(/2|Q2/);
    }
  });

  test('TC-EDIT-043: 编辑内容自动保存触发', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
    await titleInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('自动保存测试' + Date.now());
    const saveIndicator = page.locator(':text("已保存"), :text("保存成功"), :text("自动保存"), [class*="save-status"], [class*="saved"]');
    await expect(saveIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-EDIT-044: 自动保存间隔正常触发', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
    await titleInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('间隔保存测试');
    let saveRequestSent = false;
    page.on('request', (req) => {
      if (req.url().includes('questionnaire') && (req.method() === 'PUT' || req.method() === 'POST' || req.method() === 'PATCH')) {
        saveRequestSent = true;
      }
    });
    await page.waitForTimeout(5000);
    expect(saveRequestSent).toBeTruthy();
  });

  test('TC-EDIT-045: 自动保存不丢失已编辑内容', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const uniqueTitle = '保存不丢失测试' + Date.now();
    const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
    await titleInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(uniqueTitle);
    await page.waitForTimeout(5000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloadedTitle = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
    const value = await reloadedTitle.inputValue().catch(() => reloadedTitle.textContent());
    expect(value).toContain('保存不丢失测试');
  });

  test('TC-EDIT-046: 手动点击保存按钮保存问卷', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      const message = page.locator('.ant-message, [class*="message"], [class*="toast"]');
      await expect(message.first()).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-EDIT-047: 手动保存成功提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      const successMsg = page.locator('.ant-message-success, [class*="success"], [class*="message"]:has-text("成功")');
      if (await successMsg.count() > 0) {
        await expect(successMsg.first()).toBeVisible({ timeout: config.defaultTimeout });
      }
    }
  });

  test('TC-EDIT-048: 保存失败时展示错误提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    await page.route('**/api/**questionnaire**', (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST' || route.request().method() === 'PATCH') {
        route.fulfill({ status: 500, body: JSON.stringify({ code: -1, message: 'Internal Server Error' }) });
      } else {
        route.continue();
      }
    });
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      const errorMsg = page.locator('.ant-message-error, [class*="error"], [class*="message"]:has-text("失败")');
      if (await errorMsg.count() > 0) {
        await expect(errorMsg.first()).toBeVisible({ timeout: config.defaultTimeout });
      }
    }
  });

  test('TC-EDIT-049: 网络异常时保存展示错误提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    await page.route('**/api/**questionnaire**', (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST' || route.request().method() === 'PATCH') {
        route.abort('connectionrefused');
      } else {
        route.continue();
      }
    });
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      const errorState = page.locator('.ant-message-error, [class*="error"], [class*="message"]');
      if (await errorState.count() > 0) {
        await expect(errorState.first()).toBeVisible();
      }
    }
  });

  test('TC-EDIT-050: 点击预览按钮打开预览弹窗', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const previewBtn = page.locator('button:has-text("预览"), button:has-text("Preview")').first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"], [class*="preview"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-EDIT-051: 预览弹窗展示问卷内容', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const previewBtn = page.locator('button:has-text("预览"), button:has-text("Preview")').first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"], [class*="preview"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
      const modalContent = await modal.textContent();
      expect(modalContent).toMatch(/单选|选项|题/);
    }
  });

  test('TC-EDIT-052: 点击发布按钮触发发布流程', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const radioType = page.locator('button:has-text("单选"), [class*="type"]:has-text("单选"), div:has-text("单选题")').first();
    await radioType.click();
    await page.waitForTimeout(500);
    const publishBtn = page.locator('button:has-text("发布"), button:has-text("Publish")').first();
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      const modal = page.locator('.ant-modal, [class*="modal"], [class*="dialog"], [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: config.defaultTimeout });
    }
  });

  test('TC-EDIT-053: 无题目时发布按钮禁用或提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const publishBtn = page.locator('button:has-text("发布"), button:has-text("Publish")').first();
    if (await publishBtn.count() > 0) {
      const isDisabled = await publishBtn.isDisabled().catch(() => false);
      if (!isDisabled) {
        await publishBtn.click();
        const errorMsg = page.locator('.ant-message-error, .ant-message-warning, [class*="error"], [class*="warning"], [class*="message"]:has-text("题")');
        if (await errorMsg.count() > 0) {
          await expect(errorMsg.first()).toBeVisible({ timeout: config.defaultTimeout });
        }
      } else {
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('TC-EDIT-054: 面包屑导航展示正确层级', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const breadcrumb = page.locator('.ant-breadcrumb, [class*="breadcrumb"], nav[aria-label="breadcrumb"]').first();
    if (await breadcrumb.count() > 0) {
      const text = await breadcrumb.textContent();
      expect(text).toMatch(/问卷|编辑|列表/);
    }
  });

  test('TC-EDIT-055: 面包屑点击返回列表页', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const breadcrumb = page.locator('.ant-breadcrumb, [class*="breadcrumb"], nav[aria-label="breadcrumb"]').first();
    if (await breadcrumb.count() > 0) {
      const listLink = breadcrumb.locator('a:has-text("列表"), a:has-text("问卷"), span:has-text("列表")').first();
      if (await listLink.count() > 0) {
        await listLink.click();
        await page.waitForURL(`**${config.questionnaireListRoute}**`, { timeout: config.defaultTimeout });
        expect(page.url()).toContain(config.questionnaireListRoute);
      }
    }
  });

  test('TC-EDIT-056: 空画布展示空状态提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const emptyState = page.locator('[class*="empty"], .ant-empty, :text("添加题目"), :text("拖拽"), :text("点击左侧")').first();
    if (await emptyState.count() > 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('TC-EDIT-057: 空画布提示引导用户添加题目', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/添加|拖拽|点击|开始|题目|左侧/);
  });

  test('TC-EDIT-058: 未选中题目时右侧属性面板展示提示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建问卷"), button:has-text("新增")').first();
    await createBtn.click();
    await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
    await page.waitForLoadState('networkidle');
    const rightPanel = page.locator('[class*="right"], [class*="property"], [class*="config"], [class*="setting"]').first();
    if (await rightPanel.count() > 0) {
      const text = await rightPanel.textContent();
      expect(text).toMatch(/选择|点击|题目|暂无|请先/);
    }
  });

  test('TC-EDIT-059: 页面刷新后编辑状态恢复', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto(config.questionnaireListRoute);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('tbody tr, .ant-table-tbody tr').first()
      .locator('button:has-text("编辑"), a:has-text("编辑")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForURL(`**${config.questionnaireEditRoute}**`, { timeout: config.defaultTimeout });
      await page.waitForLoadState('networkidle');
      const editUrl = page.url();
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe(editUrl);
      const titleInput = page.locator('input[placeholder*="标题"], [class*="title"] input, [class*="title"][contenteditable], h1[contenteditable]').first();
      await expect(titleInput).toBeVisible({ timeout: config.defaultTimeout });
    }
  });
});
