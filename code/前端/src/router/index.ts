import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue')
      },
      {
        path: 'questionnaire/list',
        name: 'QuestionnaireList',
        component: () => import('@/views/questionnaire/QuestionnaireList.vue')
      },
      {
        path: 'questionnaire/edit/:id?',
        name: 'QuestionnaireEdit',
        component: () => import('@/views/questionnaire/QuestionnaireEdit.vue')
      },
      {
        path: 'statistics/overview/:id',
        name: 'StatisticsOverview',
        component: () => import('@/views/statistics/StatisticsOverview.vue')
      },
      {
        path: 'statistics/detail/:id',
        name: 'StatisticsDetail',
        component: () => import('@/views/statistics/StatisticsDetail.vue')
      },
      {
        path: 'statistics/export',
        name: 'DataExport',
        component: () => import('@/views/statistics/DataExport.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/login/LoginView.vue'),
    beforeEnter: (_to, _from, next) => {
      next('/login')
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.accessToken) {
    next('/login')
  } else if (to.path === '/login' && authStore.accessToken) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
