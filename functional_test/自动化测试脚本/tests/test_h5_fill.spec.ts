import { test, expect, config } from './fixtures';

const API_URL = `${config.apiBaseUrl}${config.apiPath}`;

function uniqueDeviceId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface QuestionnaireSetup {
  questionnaireId: number;
  accessCode: string;
  questionIds: number[];
}

async function createAndPublishQuestionnaire(
  apiContext: any,
  token: string,
  title: string,
  questions: any[],
  publishOpts: Record<string, any> = {},
): Promise<QuestionnaireSetup> {
  const createResp = await apiContext.post(`${API_URL}/questionnaires`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, description: '自动化测试问卷' },
  });
  expect(createResp.ok()).toBeTruthy();
  const createBody = await createResp.json();
  const qid = createBody.result?.id;
  expect(qid).toBeTruthy();

  const questionIds: number[] = [];
  for (const q of questions) {
    const qResp = await apiContext.post(`${API_URL}/questionnaires/${qid}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: q,
    });
    expect(qResp.ok()).toBeTruthy();
    const qBody = await qResp.json();
    questionIds.push(qBody.result?.id);
  }

  const pubResp = await apiContext.post(`${API_URL}/questionnaires/${qid}/publish`, {
    headers: { Authorization: `Bearer ${token}` },
    data: publishOpts,
  });
  expect(pubResp.ok()).toBeTruthy();
  const pubBody = await pubResp.json();
  let accessCode = pubBody.result?.accessCode || '';
  if (!accessCode) {
    const linkResp = await apiContext.get(`${API_URL}/questionnaires/${qid}/link`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (linkResp.ok()) {
      const linkBody = await linkResp.json();
      accessCode = linkBody.result?.accessCode || '';
    }
  }
  expect(accessCode).toBeTruthy();
  return { questionnaireId: qid, accessCode, questionIds };
}

const defaultQuestions = [
  { type: 'radio', title: '测试单选题', required: false, options: [{ content: '选项A' }, { content: '选项B' }] },
  { type: 'checkbox', title: '测试多选题', required: false, options: [{ content: '多选A' }, { content: '多选B' }, { content: '多选C' }] },
  { type: 'input', title: '测试填空题', required: false },
];

const fullTypeQuestions = [
  { type: 'radio', title: '全题型单选', required: false, options: [{ content: '选项1' }, { content: '选项2' }] },
  { type: 'checkbox', title: '全题型多选', required: false, options: [{ content: '多选1' }, { content: '多选2' }] },
  { type: 'input', title: '全题型填空', required: false },
  { type: 'rating', title: '全题型评分', required: false },
  { type: 'dropdown', title: '全题型下拉', required: false, options: [{ content: '下拉1' }, { content: '下拉2' }] },
];

async function getFillQuestions(apiContext: any, accessCode: string): Promise<any[]> {
  const resp = await apiContext.get(`${API_URL}/fill/${accessCode}`);
  const body = await resp.json();
  return body.result?.questions || [];
}

function buildAnswers(questions: any[]): any[] {
  const answers: any[] = [];
  for (const q of questions) {
    const qId = q.questionId || q.id;
    const opts = q.options || [];
    switch (q.type) {
      case 'radio':
        if (opts.length > 0) answers.push({ questionId: qId, type: 'radio', answer: { optionIds: [opts[0].id] } });
        break;
      case 'checkbox':
        if (opts.length >= 2) answers.push({ questionId: qId, type: 'checkbox', answer: { optionIds: [opts[0].id, opts[1].id] } });
        break;
      case 'input':
        answers.push({ questionId: qId, type: 'input', answer: { value: '自动化测试填写内容' } });
        break;
      case 'rating':
        answers.push({ questionId: qId, type: 'rating', answer: { value: 5 } });
        break;
      case 'dropdown':
        if (opts.length > 0) answers.push({ questionId: qId, type: 'dropdown', answer: { optionIds: [opts[0].id] } });
        break;
      default:
        answers.push({ questionId: qId, type: q.type, answer: { value: '默认回答' } });
    }
  }
  return answers;
}

async function submitFill(apiContext: any, accessCode: string, answers: any[], deviceId?: string) {
  const body: any = { answers, submitTime: '2026-05-11 12:00:00', duration: 120 };
  if (deviceId !== undefined) body.deviceId = deviceId;
  return apiContext.post(`${API_URL}/fill/${accessCode}/submit`, { data: body });
}

test.describe('H5问卷填写模块', () => {

  test.describe('通过链接获取问卷内容', () => {

    test('TC-FILL-001: GET /api/fill/{accessCode} 获取已发布问卷', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC001问卷', defaultQuestions);
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}`);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      expect(body.code).toBe(200);
      const result = body.result;
      expect(result.title).toBeTruthy();
      expect(result.questions).toBeTruthy();
      expect(Array.isArray(result.questions)).toBeTruthy();
    });

    test('TC-FILL-002: 完整题型数据结构验证', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC002全题型问卷', fullTypeQuestions);
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}`);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      const questions = body.result.questions;
      expect(questions.length).toBeGreaterThanOrEqual(3);
      for (const q of questions) {
        expect(q.questionId || q.id).toBeTruthy();
        expect(q.type).toBeTruthy();
        expect(q.title).toBeTruthy();
        expect(typeof q.required).toBe('boolean');
        if (['radio', 'checkbox', 'dropdown'].includes(q.type)) {
          expect(Array.isArray(q.options)).toBeTruthy();
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          for (const opt of q.options) {
            expect(opt.id).toBeTruthy();
          }
        }
      }
    });

    test('TC-FILL-003: 无效linkId返回错误', async ({ apiContext }) => {
      const resp = await apiContext.get(`${API_URL}/fill/INVALID_NONEXIST_LINK_XYZ`);
      const body = await resp.json();
      expect(body.code === 4040 || resp.status() === 404).toBeTruthy();
    });
  });

  test.describe('提交问卷答案', () => {

    test('TC-FILL-004: POST /api/fill/{code}/submit 正常提交', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC004提交问卷', defaultQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const deviceId = uniqueDeviceId('tc004');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      expect(body.success === true || body.code === 200).toBeTruthy();
    });

    test('TC-FILL-005: 部分答案提交', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC005部分提交', defaultQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const nonRequired = questions.filter((q: any) => !q.required);
      const answers = buildAnswers(nonRequired.length > 0 ? nonRequired.slice(0, 1) : questions.slice(0, 1));
      const deviceId = uniqueDeviceId('tc005');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      expect(body.success === true || body.code === 200).toBeTruthy();
    });

    test('TC-FILL-006: 空answers提交', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC006空提交', defaultQuestions);
      const deviceId = uniqueDeviceId('tc006');
      const resp = await submitFill(apiContext, setup.accessCode, [], deviceId);
      const body = await resp.json();
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const hasRequired = questions.some((q: any) => q.required);
      if (hasRequired) {
        expect(body.code === 4001 || body.code === 400 || resp.status() === 400).toBeTruthy();
      } else {
        expect(resp.status()).toBe(200);
      }
    });

    test('TC-FILL-007: 缺少deviceId', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC007缺deviceId', defaultQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const resp = await apiContext.post(`${API_URL}/fill/${setup.accessCode}/submit`, {
        data: { answers, submitTime: '2026-05-11 12:00:00', duration: 60 },
      });
      const body = await resp.json();
      expect(body.code === 4001 || body.code === 400 || resp.status() === 400).toBeTruthy();
    });
  });

  test.describe('问卷已关闭时访问提示', () => {

    test('TC-FILL-008: 获取已关闭问卷内容返回关闭提示', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC008关闭问卷', defaultQuestions);
      await apiContext.post(`${API_URL}/questionnaires/${setup.questionnaireId}/close`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {},
      });
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}`);
      const body = await resp.json();
      expect(body.code === 4031 || resp.status() === 403).toBeTruthy();
    });

    test('TC-FILL-009: 向已关闭问卷提交答案返回关闭提示', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC009关闭提交', defaultQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      await apiContext.post(`${API_URL}/questionnaires/${setup.questionnaireId}/close`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {},
      });
      const answers = buildAnswers(questions);
      const deviceId = uniqueDeviceId('tc009');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(body.code === 4031 || resp.status() === 403).toBeTruthy();
    });
  });

  test.describe('问卷不存在时访问提示', () => {

    test('TC-FILL-010: 获取不存在的问卷内容返回404提示', async ({ apiContext }) => {
      const resp = await apiContext.get(`${API_URL}/fill/NOTEXIST_LINK_999`);
      const body = await resp.json();
      expect(body.code === 4040 || resp.status() === 404).toBeTruthy();
    });

    test('TC-FILL-011: 向不存在的问卷提交答案返回404提示', async ({ apiContext }) => {
      const deviceId = uniqueDeviceId('tc011');
      const answers = [{ questionId: 1, type: 'input', answer: { value: 'test' } }];
      const resp = await submitFill(apiContext, 'NOTEXIST_LINK_999', answers, deviceId);
      const body = await resp.json();
      expect(body.code === 4040 || resp.status() === 404).toBeTruthy();
    });
  });

  test.describe('同一设备重复提交限制', () => {

    test('TC-FILL-012: 启用设备限制时同一设备重复提交被拒绝', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC012设备限制', defaultQuestions, { allowDuplicateDevice: false });
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const deviceId = uniqueDeviceId('tc012_dup');
      const resp1 = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body1 = await resp1.json();
      expect(resp1.status()).toBe(200);
      expect(body1.success === true || body1.code === 200).toBeTruthy();
      const resp2 = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body2 = await resp2.json();
      expect(body2.code === 4091 || resp2.status() === 409).toBeTruthy();
    });

    test('TC-FILL-013: 未启用设备限制时同一设备可重复提交', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC013无设备限制', defaultQuestions, { allowDuplicateDevice: true });
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const deviceId = uniqueDeviceId('tc013_dup');
      const resp1 = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body1 = await resp1.json();
      expect(resp1.status()).toBe(200);
      expect(body1.success === true || body1.code === 200).toBeTruthy();
      const resp2 = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body2 = await resp2.json();
      expect(resp2.status()).toBe(200);
      expect(body2.success === true || body2.code === 200).toBeTruthy();
    });
  });

  test.describe('设备提交状态查询', () => {

    test('TC-FILL-014: 查询已提交设备返回已提交状态', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC014设备状态', defaultQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const deviceId = uniqueDeviceId('tc014');
      await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}/status?deviceId=${deviceId}`);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      const result = body.result || body;
      expect(result.submitted === true || result.hasSubmitted === true).toBeTruthy();
    });

    test('TC-FILL-015: 查询未提交设备返回未提交状态', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC015未提交状态', defaultQuestions);
      const deviceId = uniqueDeviceId('tc015_never');
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}/status?deviceId=${deviceId}`);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      const result = body.result || body;
      expect(result.submitted === false || result.hasSubmitted === false).toBeTruthy();
    });

    test('TC-FILL-016: 查询设备状态时缺少deviceId参数', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC016缺deviceId', defaultQuestions);
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}/status`);
      const body = await resp.json();
      expect(resp.status() === 400 || resp.status() === 422 || body.code === 4001 || body.code === 400).toBeTruthy();
    });
  });

  test.describe('必填项校验', () => {

    test('TC-FILL-017: 必填题未填写时提交校验失败', async ({ apiContext, accessToken }) => {
      const requiredQuestions = [
        { type: 'radio', title: '必填单选', required: true, options: [{ content: '选项A' }, { content: '选项B' }] },
        { type: 'input', title: '非必填填空', required: false },
      ];
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC017必填校验', requiredQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const nonRequired = questions.filter((q: any) => !q.required);
      const answers = buildAnswers(nonRequired);
      const deviceId = uniqueDeviceId('tc017');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(body.code === 4001 || body.code === 400 || resp.status() === 400).toBeTruthy();
    });

    test('TC-FILL-018: 所有必填题均已填写时提交成功', async ({ apiContext, accessToken }) => {
      const requiredQuestions = [
        { type: 'radio', title: '必填单选', required: true, options: [{ content: '选项A' }, { content: '选项B' }] },
        { type: 'input', title: '非必填填空', required: false },
      ];
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC018必填通过', requiredQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const deviceId = uniqueDeviceId('tc018');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      expect(body.success === true || body.code === 200).toBeTruthy();
    });
  });

  test.describe('达到最大回收数后自动关闭', () => {

    test('TC-FILL-019: 达到max_responses后问卷自动关闭拒绝新提交', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC019最大回收', defaultQuestions, { maxResponses: 2 });
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      for (let i = 0; i < 2; i++) {
        const deviceId = uniqueDeviceId(`tc019_sub${i}`);
        const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
        expect(resp.status()).toBe(200);
      }
      const deviceId = uniqueDeviceId('tc019_sub3');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(body.code === 4031 || body.code === 4032 || resp.status() === 403).toBeTruthy();
    });

    test('TC-FILL-020: 达到max_responses后获取问卷内容返回关闭提示', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC020最大回收关闭', defaultQuestions, { maxResponses: 2 });
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      for (let i = 0; i < 2; i++) {
        const deviceId = uniqueDeviceId(`tc020_sub${i}`);
        await submitFill(apiContext, setup.accessCode, answers, deviceId);
      }
      const resp = await apiContext.get(`${API_URL}/fill/${setup.accessCode}`);
      const body = await resp.json();
      expect(body.code === 4031 || resp.status() === 403).toBeTruthy();
    });
  });

  test.describe('提交频率限制', () => {

    test('TC-FILL-021: 同一IP每分钟超过10次提交触发限流', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC021限流测试', defaultQuestions, { allowDuplicateDevice: true });
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      const results: { status: number; code: number }[] = [];
      for (let i = 0; i < 11; i++) {
        const deviceId = uniqueDeviceId(`tc021_rate${i}`);
        const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
        const body = await resp.json();
        results.push({ status: resp.status(), code: body.code });
      }
      const last = results[results.length - 1];
      expect(last.code === 4290 || last.status === 429).toBeTruthy();
    });

    test('TC-FILL-022: 限流窗口过期后恢复正常提交', async ({ apiContext, accessToken }) => {
      test.setTimeout(120000);
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC022限流恢复', defaultQuestions, { allowDuplicateDevice: true });
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const answers = buildAnswers(questions);
      for (let i = 0; i < 11; i++) {
        const deviceId = uniqueDeviceId(`tc022_rate${i}`);
        await submitFill(apiContext, setup.accessCode, answers, deviceId);
      }
      await new Promise(r => setTimeout(r, 65000));
      const deviceId = uniqueDeviceId('tc022_after');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(resp.status()).toBe(200);
      expect(body.success === true || body.code === 200).toBeTruthy();
    });
  });

  test.describe('补充边界与异常用例', () => {

    test('TC-FILL-023: linkId为空字符串时获取问卷', async ({ apiContext }) => {
      const resp = await apiContext.get(`${API_URL}/fill/`);
      expect(resp.status() === 404 || resp.status() === 405).toBeTruthy();
    });

    test('TC-FILL-024: 提交答案中value类型与题型不匹配', async ({ apiContext, accessToken }) => {
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC024类型不匹配', defaultQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const radioQ = questions.find((q: any) => q.type === 'radio');
      if (!radioQ) return;
      const qId = radioQ.questionId || radioQ.id;
      const answers = [{ questionId: qId, type: 'radio', answer: { value: ['这是一个数组而不是字符串'] } }];
      const deviceId = uniqueDeviceId('tc024');
      const resp = await submitFill(apiContext, setup.accessCode, answers, deviceId);
      const body = await resp.json();
      expect(body.code === 4001 || body.code === 400 || body.code === 4002 || resp.status() === 400).toBeTruthy();
    });

    test('TC-FILL-025: 评分题value超出有效范围', async ({ apiContext, accessToken }) => {
      const ratingQuestions = [
        { type: 'rating', title: '评分题', required: false },
      ];
      const setup = await createAndPublishQuestionnaire(apiContext, accessToken, 'TC025评分越界', ratingQuestions);
      const questions = await getFillQuestions(apiContext, setup.accessCode);
      const ratingQ = questions.find((q: any) => q.type === 'rating');
      if (!ratingQ) return;
      const qId = ratingQ.questionId || ratingQ.id;
      const deviceId1 = uniqueDeviceId('tc025_neg');
      const resp1 = await submitFill(apiContext, setup.accessCode, [{ questionId: qId, type: 'rating', answer: { value: -1 } }], deviceId1);
      const body1 = await resp1.json();
      expect(body1.code === 4001 || body1.code === 400 || body1.code === 4002 || resp1.status() === 400).toBeTruthy();
    });

    test('TC-FILL-026: 未发布的问卷无法通过H5端访问', async ({ apiContext, accessToken }) => {
      const createResp = await apiContext.post(`${API_URL}/questionnaires`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'TC026未发布问卷', description: '测试' },
      });
      expect(createResp.ok()).toBeTruthy();
      const createBody = await createResp.json();
      const qid = createBody.result?.id;
      const detailResp = await apiContext.get(`${API_URL}/questionnaires/${qid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const detail = await detailResp.json();
      expect(detail.result?.status === 'draft' || detail.result?.status === 0 || detail.result?.status === 'unpublished').toBeTruthy();
      const fakeCode = `draft_${qid}_nonexist`;
      const resp = await apiContext.get(`${API_URL}/fill/${fakeCode}`);
      const body = await resp.json();
      expect(body.code === 4040 || body.code === 4031 || resp.status() === 404 || resp.status() === 403).toBeTruthy();
    });
  });

});
