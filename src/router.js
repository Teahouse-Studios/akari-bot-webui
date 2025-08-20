import { createRouter, createWebHistory } from 'vue-router'
import { IS_DEMO } from './const'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory("/webui/"),
  routes: [
    ...(IS_DEMO ? [{
      path: '/',
      redirect: '/dashboard'
    }] : []),
    ...routes
  ],
})

export default router
