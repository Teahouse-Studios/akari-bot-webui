import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import ConfigView from './views/ConfigView.vue'
import ModulesView from './views/ModulesView.vue'
import LogsView from './views/LogsView.vue'
import SettingView from './views/SettingView.vue'
import AboutView from './views/AboutView.vue'

const routes = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView
  },
  {
    path: '/config',
    name: 'config',
    component: ConfigView
  },
  {
    path: '/modules',
    name: 'modules',
    component: ModulesView
  },
  {
    path: '/logs',
    name: 'logs',
    component: LogsView
  },
  {
    path: '/setting',
    name: 'setting',
    component: SettingView
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView
  },
  // 无效路由处理：匹配任何未定义的路径，显示空内容
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: { template: '<div></div>' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 在路由守卫中处理无效的路径
router.beforeEach((to, from, next) => {
  const validPaths = ['dashboard', 'config', 'modules', 'logs', 'setting', 'about']
  if (validPaths.includes(to.name)) {
    next()
  } else {
    next({ name: 'notFound' }) // 导航到空白视图
  }
})

export default router
