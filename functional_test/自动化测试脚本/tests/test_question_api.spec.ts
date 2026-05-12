import { test, expect, config } from './fixtures';

const API = '/api';

test.describe('题目管理', () => {
  let questionnaireId: string;
  let questionId: string;

  test.beforeAll(async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `题目测试问卷_${Date.now()}`, description: '题目管理测试用' },
    });
    const body = await res.json();
    questionnaireId = body.id || body.data?.id;
  });

  test.afterAll(async ({ apiContext, accessToken }) => {
    if (questionnaireId) {
      await apiContext.delete(`${API}/questionnaires/${questionnaireId}?confirm=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  });

  test('TC-QS-001: POST 添加单选题', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'radio',
        title: '你的性别是？',
        required: true,
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('id');
    questionId = data.id;
  });

  test('TC-QS-002: 添加多选题', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'checkbox',
        title: '你喜欢的颜色？',
        required: false,
        options: [
          { label: '红色', value: 'red' },
          { label: '蓝色', value: 'blue' },
          { label: '绿色', value: 'green' },
        ],
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('id');
  });

  test('TC-QS-003: 添加单行填空', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'input',
        title: '请输入您的姓名',
        required: true,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('TC-QS-004: 添加多行填空', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'textarea',
        title: '请详细描述您的建议',
        required: false,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('TC-QS-005: 添加评分题', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'rating',
        title: '请对服务进行评分',
        required: true,
        max: 5,
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('TC-QS-006: 添加下拉选择', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'select',
        title: '请选择您的城市',
        required: true,
        options: [
          { label: '北京', value: 'beijing' },
          { label: '上海', value: 'shanghai' },
          { label: '广州', value: 'guangzhou' },
        ],
      },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('TC-QS-007: 添加题目-标题为空', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'radio',
        title: '',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-QS-008: 添加题目-问卷不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/nonexistent_id_999/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'radio',
        title: '题目',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QS-009: PUT 更新题目', async ({ apiContext, accessToken }) => {
    expect(questionId).toBeTruthy();
    const res = await apiContext.put(
      `${API}/questionnaires/${questionnaireId}/questions/${questionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          type: 'radio',
          title: '更新后的性别题目',
          required: false,
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
            { label: '其他', value: 'other' },
          ],
        },
      },
    );
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QS-010: 更新题目-标题为空', async ({ apiContext, accessToken }) => {
    expect(questionId).toBeTruthy();
    const res = await apiContext.put(
      `${API}/questionnaires/${questionnaireId}/questions/${questionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          type: 'radio',
          title: '',
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
      },
    );
    expect([400, 422]).toContain(res.status());
  });

  test('TC-QS-011: DELETE 删除题目', async ({ apiContext, accessToken }) => {
    const addRes = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'input',
        title: '待删除题目',
        required: false,
      },
    });
    const addBody = await addRes.json();
    const delId = addBody.id || addBody.data?.id;
    expect(delId).toBeTruthy();

    const res = await apiContext.delete(
      `${API}/questionnaires/${questionnaireId}/questions/${delId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QS-012: 删除-题目不存在', async ({ apiContext, accessToken }) => {
    const res = await apiContext.delete(
      `${API}/questionnaires/${questionnaireId}/questions/nonexistent_qid_999`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect([404, 400]).toContain(res.status());
  });

  test('TC-QS-013: POST 复制题目', async ({ apiContext, accessToken }) => {
    expect(questionId).toBeTruthy();
    const res = await apiContext.post(
      `${API}/questionnaires/${questionnaireId}/questions/${questionId}/copy`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    const data = body.data || body;
    expect(data).toHaveProperty('id');
    expect(data.id).not.toBe(questionId);
  });

  test('TC-QS-014: PUT 排序题目', async ({ apiContext, accessToken }) => {
    const detailRes = await apiContext.get(`${API}/questionnaires/${questionnaireId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const detail = await detailRes.json();
    const questions = detail.data?.questions || detail.questions || [];
    const ids = questions.map((q: any) => q.id).filter(Boolean);

    if (ids.length >= 2) {
      const reversed = [...ids].reverse();
      const res = await apiContext.put(
        `${API}/questionnaires/${questionnaireId}/questions/sort`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: { questionIds: reversed },
        },
      );
      expect([200, 204]).toContain(res.status());
    }
  });

  test('TC-QS-015: 添加选项', async ({ apiContext, accessToken }) => {
    expect(questionId).toBeTruthy();
    const res = await apiContext.put(
      `${API}/questionnaires/${questionnaireId}/questions/${questionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          type: 'radio',
          title: '更新后的性别题目',
          required: false,
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
            { label: '其他', value: 'other' },
            { label: '不愿透露', value: 'prefer_not' },
          ],
        },
      },
    );
    expect([200, 204]).toContain(res.status());

    const getRes = await apiContext.get(`${API}/questionnaires/${questionnaireId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await getRes.json();
    const questions = body.data?.questions || body.questions || [];
    const target = questions.find((q: any) => q.id === questionId);
    if (target) {
      expect(target.options.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('TC-QS-016: 删除选项', async ({ apiContext, accessToken }) => {
    expect(questionId).toBeTruthy();
    const res = await apiContext.put(
      `${API}/questionnaires/${questionnaireId}/questions/${questionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          type: 'radio',
          title: '更新后的性别题目',
          required: false,
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
          ],
        },
      },
    );
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QS-017: 更新选项', async ({ apiContext, accessToken }) => {
    expect(questionId).toBeTruthy();
    const res = await apiContext.put(
      `${API}/questionnaires/${questionnaireId}/questions/${questionId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          type: 'radio',
          title: '更新后的性别题目',
          required: false,
          options: [
            { label: '男性', value: 'male_updated' },
            { label: '女性', value: 'female_updated' },
            { label: '其他', value: 'other' },
          ],
        },
      },
    );
    expect([200, 204]).toContain(res.status());
  });

  test('TC-QS-018: 选项少于2个', async ({ apiContext, accessToken }) => {
    const res = await apiContext.post(`${API}/questionnaires/${questionnaireId}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'radio',
        title: '只有一个选项的题目',
        options: [{ label: '唯一选项', value: 'only' }],
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-QS-019: 非草稿问卷添加题目', async ({ apiContext, accessToken }) => {
    const createRes = await apiContext.post(`${API}/questionnaires`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: `非草稿添题_${Date.now()}`, description: '测试' },
    });
    const createBody = await createRes.json();
    const id = createBody.id || createBody.data?.id;

    await apiContext.put(`${API}/questionnaires/${id}/draft`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: '非草稿添题',
        questions: [
          { type: 'radio', title: '题目', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
        ],
      },
    });

    await apiContext.post(`${API}/questionnaires/${id}/publish`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await apiContext.post(`${API}/questionnaires/${id}/questions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'input',
        title: '不应成功添加的题目',
      },
    });
    expect([400, 403, 409, 422]).toContain(res.status());

    await apiContext.delete(`${API}/questionnaires/${id}?confirm=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });

  test('TC-QS-020: 无Token访问', async ({ apiContext }) => {
    const res = await apiContext.post(`${API}/questionnaires/some_id/questions`, {
      data: { type: 'input', title: '无Token' },
    });
    expect(res.status()).toBe(401);
  });
});
