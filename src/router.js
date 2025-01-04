import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "./views/DashboardView.vue";
import ConfigView from "./views/ConfigView.vue";
import ModulesView from "./views/ModulesView.vue";
import LogsView from "./views/LogsView.vue";
import SettingView from "./views/SettingView.vue";
import AboutView from "./views/AboutView.vue";

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
    path: "/webui/modules",
    name: "modules",
    component: ModulesView,
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
    path: "/webui/about",
    name: "about",
    component: AboutView,
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
