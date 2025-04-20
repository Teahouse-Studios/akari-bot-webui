import { createApp } from "vue";
import { createI18n } from 'vue-i18n';
import App from "./App.vue";
import router from "@/router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import 'element-plus/theme-chalk/dark/css-vars.css'
import "@fortawesome/fontawesome-free/css/all.css";
import "@mdi/font/css/materialdesignicons.css";
import zh_cn from './i18n/zh_cn.json';
import zh_tw from './i18n/zh_tw.json';
import en_us from './i18n/en_us.json';

fetch('/config.json')
  .then(res => res.json())
  .then(config => {
    const locale = config.locale || 'zh_cn';
    localStorage.setItem('language', locale);

    const i18n = createI18n({
      locale: locale,
      messages: {
        zh_cn,
        zh_tw,
        en_us
      }
    });

const app = createApp(App);

app.use(ElementPlus);
app.use(i18n);
app.use(router);

const isDark = localStorage.getItem('isDarkMode') === 'true'
document.documentElement.classList.toggle('dark', isDark)

app.mount("#app");
