import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/s/:linkId',
      name: 'Survey',
      component: () => import('@/views/SurveyPage.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/s/not-found'
    }
  ]
})

export default router
