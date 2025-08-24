import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import NotFoundPage from '@/pages/notFound.vue'

const router = createRouter({
  history: createWebHistory("/webui/"),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    ...routes,
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundPage
    }
  ],
})

export default router
