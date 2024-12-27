import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@mdi/font/css/materialdesignicons.css'

// 引入 Vue Router
import { createRouter, createWebHistory } from 'vue-router'
// 引入各个页面组件
import DashboardView from './views/DashboardView.vue'
import ConfigView from './views/ConfigView.vue'
import ModulesView from './views/ModulesView.vue'
import LoggerView from './views/LoggerView.vue'
import SettingView from './views/SettingView.vue'
import AboutView from './views/AboutView.vue'

// 配置 Vue Router
const routes = [
  {
    path: '/',
    redirect: '/dashboard' // 当访问根路径时，自动重定向到 /dashboard
  },
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
    path: '/logger',
    name: 'logger',
    component: LoggerView
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
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes
})

const app = createApp(App)

// 使用 ElementPlus 和 Vue Router
app.use(ElementPlus)
app.use(router)

app.mount('#app')
