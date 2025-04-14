import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import 'element-plus/theme-chalk/dark/css-vars.css'
import "@fortawesome/fontawesome-free/css/all.css";
import "@mdi/font/css/materialdesignicons.css";

const app = createApp(App);

// 使用 ElementPlus 和 Vue Router
app.use(ElementPlus);
app.use(router);

const isDark = localStorage.getItem('isDarkMode') === 'true'
document.documentElement.classList.toggle('dark', isDark)

app.mount("#app");
