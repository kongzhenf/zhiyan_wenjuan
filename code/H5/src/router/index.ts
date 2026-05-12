import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:id',
      name: 'Survey',
      component: () => import('@/views/SurveyPage.vue')
    },
    {
      path: '/',
      redirect: '/not-found'
    }
  ]
})

export default router
