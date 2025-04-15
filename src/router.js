import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "./views/DashboardView.vue";
import ConfigView from "./views/ConfigView.vue";
import LogsView from "./views/LogsView.vue";
import SettingView from "./views/SettingView.vue";

const routes = [
  {
    path: "/webui/dashboard",
    name: "dashboard",
    component: DashboardView,
  },
  {
    path: "/webui/config",
    name: "config",
    component: ConfigView,
  },
  {
    path: "/webui/logs",
    name: "logs",
    component: LogsView,
  },
  {
    path: "/webui/setting",
    name: "setting",
    component: SettingView,
  },
  {
    path: "/webui/:pathMatch(.*)*",
    redirect: "/webui/dashboard",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
