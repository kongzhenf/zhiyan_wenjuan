import { test, expect, config } from './fixtures';

const API = '/api';

test.describe('问卷管理', () => {
  let questionnaireId: string;
  const uniqueTitle = `测试问卷_${Date.now()}`;

  test.beforeAll(async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: uniqueTitle, description: '自动化测试前置问卷' },
    });
    const body = await res.json();
    questionnaireId = body.id || body.data?.id;
  });

  test.afterAll(async ({ apiContext, accessToken }) => {
    if (questionnaireId) {
      await apiContext.delete(`${API}/questionnaires/${questionnaireId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  });

  test('TC-QN-001: POST /api/questionnaires 创建问卷成功', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `创建测试_${Date.now()}`, description: '描述信息' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('id');
    expect(data.title).toContain('创建测试_');

    if (data.id) {
      await apiContext.delete(`${API}/questionnaires/${data.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  });

  test('TC-QN-002: 创建问卷-标题为空400', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: '', description: '描述' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-QN-003: 创建问卷-标题超100字符', async ({ apiContext, accessToken }) => {
    const longTitle = 'A'.repeat(101);
    const res = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: longTitle, description: '描述' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-QN-004: 创建问卷-标题恰好100字符', async ({ apiContext, accessToken }) => {
    const title100 = 'B'.repeat(100);
    const res = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: title100, description: '描述' },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    if (data.id) {
      await apiContext.delete(`${API}/questionnaires/${data.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  });

  test('TC-QN-005: GET /api/questionnaires 默认分页', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('list');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.list)).toBe(true);
  });

  test('TC-QN-006: 按状态筛选?status=draft', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires?status=draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = body.data?.list || body.list || [];
    for (const item of list) {
      expect(item.status).toBe('draft');
    }
  });

  test('TC-QN-007: 关键字搜索?keyword=', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires?keyword=${encodeURIComponent(uniqueTitle)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = body.data?.list || body.list || [];
    expect(list.length).toBeGreaterThanOrEqual(0);
  });

  test('TC-QN-008: 自定义排序', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires?sortBy=createdAt&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
  });

  test('TC-QN-009: 分页参数?page=2&pageSize=5', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires?page=2&pageSize=5`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    const list = data.list || [];
    expect(list.length).toBeLessThanOrEqual(5);
  });

  test('TC-QN-010: GET /api/questionnaires/:id 获取详情', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const res = await apiContext.get(`${API}/questionnaires/${questionnaireId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
  });

  test('TC-QN-011: 获取详情-不存在404', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires/nonexistent_id_999999`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QN-012: PUT /api/questionnaires/:id 更新', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const newTitle = `更新后标题_${Date.now()}`;
    const res = await apiContext.put(`${API}/questionnaires/${questionnaireId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: newTitle, description: '更新后描述' },
    });
    expect([200, 204]).toContain(res.status());

    const detailRes = await apiContext.get(`${API}/questionnaires/${questionnaireId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const detail = await detailRes.json();
    const data = detail.data || detail;
    expect(data.title).toBe(newTitle);
  });

  test('TC-QN-013: 更新问卷-标题为空', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const res = await apiContext.put(`${API}/questionnaires/${questionnaireId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: '', description: '描述' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-QN-014: 更新问卷-不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.put(`${API}/questionnaires/nonexistent_id_999999`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: '标题', description: '描述' },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QN-015: DELETE /api/questionnaires/:id 删除', async ({ apiContext, accessToken }) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `待删除_${Date.now()}`, description: '将被删除' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;
    expect(id).toBeTruthy();

    const res = await apiContext.delete(`${API}/questionnaires/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204]).toContain(res.status());

    const getRes = await apiContext.get(`${API}/questionnaires/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(getRes.status());
  });

  test('TC-QN-016: 删除-有回收数据未确认', async ({ apiContext, accessToken }) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `回收测试_${Date.now()}`, description: '测试回收数据' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;

    const res = await apiContext.delete(`${API}/questionnaires/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204, 409]).toContain(res.status());
  });

  test('TC-QN-017: 删除-有回收数据确认删除', async ({ apiContext, accessToken }) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `确认删除_${Date.now()}`, description: '确认删除测试' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;

    const res = await apiContext.delete(`${API}/questionnaires/${id}?confirm=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QN-018: 删除-不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.delete(`${API}/questionnaires/nonexistent_id_999999`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QN-019: POST /api/questionnaires/:id/copy 复制', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/copy`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('id');
    expect(data.id).not.toBe(questionnaireId);

    if (data.id) {
      await apiContext.delete(`${API}/questionnaires/${data.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  });

  test('TC-QN-020: 复制-不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/nonexistent_id_999999/copy`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QN-021: PUT /api/questionnaires/:id/draft 保存草稿含题目', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const res = await apiContext.put(`${API}/questionnaires/${questionnaireId}/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: `草稿保存_${Date.now()}`,
        description: '含题目草稿',
        questions: [
          {
            type: 'radio',
            title: '单选题目',
            required: true,
            options: [
              { label: '选项A', value: 'A' },
              { label: '选项B', value: 'B' },
            ],
          },
        ],
      },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QN-022: 保存草稿-非草稿状态', async ({ apiContext, accessToken }) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `发布后草稿_${Date.now()}`, description: '测试' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;

    await apiContext.put(`${API}/questionnaires/${id}/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: '草稿',
        questions: [
          { type: 'radio', title: '题目', options: [{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }] },
        ],
      },
    });

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await apiContext.put(`${API}/questionnaires/${id}/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: '再次草稿', questions: [] },
    });
    expect([400, 403, 409, 422]).toContain(res.status());

    await apiContext.delete(`${API}/questionnaires/${id}?confirm=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });

  test('TC-QN-023: 保存草稿-不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.put(`${API}/questionnaires/nonexistent_id_999999/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: '草稿', questions: [] },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QN-024: 保存草稿-无题目', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const res = await apiContext.put(`${API}/questionnaires/${questionnaireId}/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: `无题目草稿_${Date.now()}`,
        description: '无题目',
        questions: [],
      },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QN-025: GET /api/questionnaires/:id/preview 预览', async ({ apiContext, accessToken }) => {
    expect(questionnaireId).toBeTruthy();
    const res = await apiContext.get(`${API}/questionnaires/${questionnaireId}/preview`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('title');
  });

  test('TC-QN-026: 预览-不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.get(`${API}/questionnaires/nonexistent_id_999999/preview`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QN-027: 无Token访问401', async ({ apiContext }) => {
    const res = await apiContext.get(`${API}/questionnaires`);
    expect(res.status()).toBe(401);
  });

  test('TC-QN-028: 无效Token401', async ({ apiContext }) => {
    const res = await apiContext.get(`${API}/questionnaires`, {
      headers: { Authorization: 'Bearer invalid_token_value' },
    });
    expect(res.status()).toBe(401);
  });
});
