/**
 * 测试环境配置
 * 所有地址信息来源于远程部署文档
 */
export const config = {
  /** 前端管理后台地址 */
  adminBaseUrl: 'http://10.32.129.153:3002',
  /** 前端H5移动端地址 */
  h5BaseUrl: 'http://10.32.129.153:3003',
  /** 后端API地址 */
  apiBaseUrl: 'http://10.32.129.153:8082',
  /** API基础路径 */
  apiPath: '/api',
  /** 管理员默认账号 */
  adminUsername: 'admin',
  /** 管理员默认密码 */
  adminPassword: 'admin123',
  /** 登录页路由 */
  loginRoute: '/login',
  /** 首页路由 */
  dashboardRoute: '/dashboard',
  /** 问卷管理列表路由 */
  questionnaireListRoute: '/questionnaire/list',
  /** 问卷编辑路由前缀 */
  questionnaireEditRoute: '/questionnaire/edit',
  /** 统计概览路由前缀 */
  statisticsOverviewRoute: '/statistics/overview',
  /** 逐题统计路由前缀 */
  statisticsDetailRoute: '/statistics/detail',
  /** 数据导出路由 */
  statisticsExportRoute: '/statistics/export',
  /** 默认超时时间(ms) */
  defaultTimeout: 15000,
  /** 页面加载超时(ms) */
  pageLoadTimeout: 30000,
};
