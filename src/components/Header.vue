<template>
  <el-header class="header">
    <div class="header-left">
      <el-button
        class="menu-button"
        @click="switchSidebar"
        v-if="screenWidth < 1024"
      >
        <i class="mdi mdi-menu"></i>
      </el-button>
      <div class="logo">
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
        <div class="logo-text">
          <span class="akari-bot-text">AkariBot</span>
          <div class="webui-container">
            <span class="web-ui-text">WebUI </span>
            <span class="beta-tag">Beta</span>
          </div>
        </div>
      </div>
    </div>

    <div class="header-right">
      <el-select
        v-model="currentLang"
        @change="changeLanguage"
        class="lang-select"
        style="width: 100px; margin-right: 10px;"
      >
        <el-option label="简体中文" value="zh_cn" />
        <el-option label="繁體中文" value="zh_tw" />
        <el-option label="English" value="en_us" />
      </el-select>
      <el-button class="help-button" @click="goToHelp">{{ $t('header.button.doc') }}</el-button>
      <el-button class="theme-toggle-button" @click="toggleDarkMode">
        <i
          :class="
            isDarkMode ? 'mdi mdi-weather-sunny' : 'mdi mdi-weather-night'
          "
        ></i>
      </el-button>
    </div>
  </el-header>
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
  name: "AppHeader",
  emits: ["toggle-sidebar"],
  data() {
    const { t } = useI18n();
    return {
      t,
      isDarkMode: false,
      screenWidth: window.innerWidth,
      currentLang: localStorage.getItem("language") || "zh_cn",
    };
  },
  mounted() {
    const savedTheme = localStorage.getItem("isDarkMode");
    if (savedTheme !== null) {
      this.isDarkMode = JSON.parse(savedTheme);
    }

    this.changeLanguage(this.currentLang);
    window.addEventListener("resize", this.updateScreenWidth);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateScreenWidth);
  },
  methods: {
    updateScreenWidth() {
      this.screenWidth = window.innerWidth;
    },
    goToHelp() {
      window.open("https://bot.teahouse.team", "_blank");
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      document.documentElement.classList.toggle("dark", this.isDarkMode);
      document.body.classList.toggle("dark-mode", this.isDarkMode);
      localStorage.setItem("isDarkMode", JSON.stringify(this.isDarkMode));
    },
    switchSidebar() {
      this.$emit("toggle-sidebar");
    },
    changeLanguage(lang) {
      this.currentLang = lang;
      this.$i18n.locale = lang;
      localStorage.setItem("language", lang);
    },
  },
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #f4f4f4;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #e0e0e0;
}

.dark .header {
  background-color: #333;
  border-bottom: 1px solid #1f1f1f;
}

.menu-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 24px;
  color: inherit;
  transition: color 0.3s ease;
}

.menu-button:hover {
  background-color: #f4f4f4;
  color: #888;
}

.dark .menu-button:hover {
  background-color: #333;
  color: #aaa;
}

.theme-toggle-button {
  background-color: #2e2e2e;
  color: white;
}

.dark .theme-toggle {
  background: white;
  color: #333;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  display: flex;
  justify-content: left;
  padding: 20px 0;
}

.logo-image {
  height: 46px;
  width: auto;
  margin-right: 2px;
}

.logo-text {
  flex-direction: column;
  justify-content: flex-start;
  font-family:
          "Roboto",
          system-ui,
          -apple-system,
          sans-serif;
}

.akari-bot-text {
  font-size: 18px;
}

.webui-container {
  display: flex;
  align-items: center;
  gap: 3px;
}

.web-ui-text {
  font-size: 12px;
  color: #888;
}

.beta-tag {
  display: inline-block;
  background-color: #0091ff;
  color: white;
  font-size: 8px;
  padding: 1px 5px;
  border-radius: 12px;
  text-transform: uppercase;
}

.theme-toggle-button {
  font-size: 22px;
  padding: 6px;
  background-color: #2e2e2e;
  color: white;
  border: none;
}

.theme-toggle-button:hover {
  background-color: #666;
  color: white;
}

.dark .theme-toggle-button {
  background-color: #eee;
  color: #333;
}

.dark .theme-toggle-button:hover {
  background-color: #c0c0c0;
  color: #333;
}

.lang-select {
  min-width: 100px;
}
</style>
