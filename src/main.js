import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "@mdi/font/css/materialdesignicons.css";

const app = createApp(App);

// 使用 ElementPlus 和 Vue Router
app.use(ElementPlus);
app.use(router);

app.mount("#app");
