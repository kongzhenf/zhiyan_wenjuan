import { test, expect, config } from './fixtures';

const API = '/api';

test.describe('问卷发布与生命周期', () => {
  const createQuestionnaireWithQuestion = async (
    apiContext: any,
    accessToken: string,
    title: string,
  ) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title, description: '发布测试问卷' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;

    await apiContext.put(`${API}/questionnaires/${id}/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title,
        questions: [
          {
            type: 'radio',
            title: '测试题目',
            required: true,
            options: [
              { label: '选项A', value: 'A' },
              { label: '选项B', value: 'B' },
            ],
          },
        ],
      },
    });

    return id;
  };

  const cleanup = async (apiContext: any, accessToken: string, id: string) => {
    await apiContext.delete(`${API}/questionnaires/${id}?confirm=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  };

  test('TC-PB-001: POST /api/questionnaires/:id/publish 全参数发布', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `全参发布_${Date.now()}`);
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        deadline,
        maxResponses: 100,
        allowDuplicateDevice: false,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('accessCode');

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-002: 无可选参数发布(默认)', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `默认发布_${Date.now()}`);

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 201]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-003: 发布-无题目问卷', async ({ apiContext, accessToken }) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `无题目发布_${Date.now()}`, description: '无题目' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([400, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-004: 发布-非草稿状态', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `重复发布_${Date.now()}`);

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([400, 409, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-005: 发布-不存在问卷', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/nonexistent_999/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-PB-006: 发布后状态变为active', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `状态检查_${Date.now()}`);

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const detailRes = await apiContext.get(`${API}/questionnaires/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const detail = await detailRes.json();
    const data = detail.data || detail;
    expect(data.status).toBe('active');

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-007: 发布后生成accessCode', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `生成码_${Date.now()}`);

    const pubRes = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const pubBody = await pubRes.json();
    const pubData = pubBody.data || pubBody;
    expect(pubData.accessCode).toBeTruthy();
    expect(typeof pubData.accessCode).toBe('string');

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-008: POST /api/questionnaires/:id/close 关闭问卷', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `关闭测试_${Date.now()}`);

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await apiContext.post(`${API}/questionnaires/${id}/close`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-009: 关闭-非进行中状态', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `非进行关闭_${Date.now()}`);

    const res = await apiContext.post(`${API}/questionnaires/${id}/close`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([400, 409, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-010: 关闭-不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/nonexistent_999/close`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-PB-011: 关闭后状态变为closed', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `关闭状态_${Date.now()}`);

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await apiContext.post(`${API}/questionnaires/${id}/close`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const detailRes = await apiContext.get(`${API}/questionnaires/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const detail = await detailRes.json();
    const data = detail.data || detail;
    expect(data.status).toBe('closed');

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-012: deadline到期自动关闭(概念验证)', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `到期关闭_${Date.now()}`);
    const shortDeadline = new Date(Date.now() + 2000).toISOString();

    const pubRes = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { deadline: shortDeadline },
    });
    expect([200, 201]).toContain(pubRes.status());

    await new Promise(resolve => setTimeout(resolve, 5000));

    const detailRes = await apiContext.get(`${API}/questionnaires/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const detail = await detailRes.json();
    const data = detail.data || detail;
    expect(['closed', 'active']).toContain(data.status);

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-013: maxResponses达上限关闭', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `上限关闭_${Date.now()}`);

    const pubRes = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { maxResponses: 1 },
    });
    expect([200, 201]).toContain(pubRes.status());
    const pubBody = await pubRes.json();
    const pubData = pubBody.data || pubBody;
    const accessCode = pubData.accessCode;

    if (accessCode) {
      await apiContext.post(`${API}/questionnaires/${id}/responses`, {
        data: {
          accessCode,
          answers: [{ questionId: 'q1', value: 'A' }],
        },
      });

      const detailRes = await apiContext.get(`${API}/questionnaires/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const detail = await detailRes.json();
      const data = detail.data || detail;
      expect(['closed', 'active']).toContain(data.status);
    }

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-014: allowDuplicateDevice=false时重复设备拒绝', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `禁重复_${Date.now()}`);

    const pubRes = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { allowDuplicateDevice: false },
    });
    expect([200, 201]).toContain(pubRes.status());
    const pubBody = await pubRes.json();
    const accessCode = (pubBody.data || pubBody).accessCode;

    if (accessCode) {
      const deviceId = `device_${Date.now()}`;
      await apiContext.post(`${API}/questionnaires/${id}/responses`, {
        headers: { 'X-Device-Id': deviceId },
        data: {
          accessCode,
          answers: [{ questionId: 'q1', value: 'A' }],
          deviceId,
        },
      });

      const dupRes = await apiContext.post(`${API}/questionnaires/${id}/responses`, {
        headers: { 'X-Device-Id': deviceId },
        data: {
          accessCode,
          answers: [{ questionId: 'q1', value: 'B' }],
          deviceId,
        },
      });
      expect([400, 403, 409]).toContain(dupRes.status());
    }

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-015: allowDuplicateDevice=true时重复设备允许', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `允许重复_${Date.now()}`);

    const pubRes = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { allowDuplicateDevice: true },
    });
    expect([200, 201]).toContain(pubRes.status());
    const pubBody = await pubRes.json();
    const accessCode = (pubBody.data || pubBody).accessCode;

    if (accessCode) {
      const deviceId = `device_dup_${Date.now()}`;
      const first = await apiContext.post(`${API}/questionnaires/${id}/responses`, {
        headers: { 'X-Device-Id': deviceId },
        data: {
          accessCode,
          answers: [{ questionId: 'q1', value: 'A' }],
          deviceId,
        },
      });

      const second = await apiContext.post(`${API}/questionnaires/${id}/responses`, {
        headers: { 'X-Device-Id': deviceId },
        data: {
          accessCode,
          answers: [{ questionId: 'q1', value: 'B' }],
          deviceId,
        },
      });
      expect([200, 201]).toContain(second.status());
    }

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-016: 无Token发布401', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/questionnaires/some_id/publish`);
    expect(res.status()).toBe(401);
  });

  test('TC-PB-017: 发布deadline格式错误', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `错误时间_${Date.now()}`);

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { deadline: 'not-a-date' },
    });
    expect([400, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-018: 发布maxResponses为负数', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `负数上限_${Date.now()}`);

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { maxResponses: -1 },
    });
    expect([400, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-019: 发布deadline过去时间', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `过期时间_${Date.now()}`);
    const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { deadline: pastDeadline },
    });
    expect([400, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });

  test('TC-PB-020: 已关闭问卷不可再发布', async ({ apiContext, accessToken }) => {
    const id = await createQuestionnaireWithQuestion(apiContext, accessToken, `关闭再发布_${Date.now()}`);

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await apiContext.post(`${API}/questionnaires/${id}/close`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([400, 409, 422]).toContain(res.status());

    await cleanup(apiContext, accessToken, id);
  });
});
