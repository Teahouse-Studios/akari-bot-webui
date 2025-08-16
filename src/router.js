import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import ConfigView from './views/ConfigView.vue'
import DataView from './views/DataView.vue'
import LogsView from './views/LogsView.vue'
import ChatView from './views/ChatView.vue'
import SettingView from './views/SettingView.vue'
import AboutView from './views/AboutView.vue'
import { IS_DEMO } from './const'

const routes = [
  ...(IS_DEMO
    ? [
        {
          path: '/',
          redirect: '/webui',
        },
      ]
    : []),

  {
    path: '/webui/dashboard',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/webui/config',
    name: 'config',
    component: ConfigView,
  },
  {
    path: '/webui/data',
    name: 'data',
    component: DataView,
  },
  {
    path: '/webui/logs',
    name: 'logs',
    component: LogsView,
  },
  {
    path: '/webui/chat',
    name: 'chat',
    component: ChatView,
  },
  {
    path: '/webui/setting',
    name: 'setting',
    component: SettingView,
  },
  {
    path: '/webui/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/webui/:pathMatch(.*)*',
    redirect: '/webui/dashboard',
  },
  {
    path: '/',
    redirect: '/webui',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
