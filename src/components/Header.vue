<template>
  <el-header class="header">
    <div class="header-left">
      <el-button class="menu-button" @click="switchSidebar" v-if="screenWidth < 1024">
        <i class="mdi mdi-menu"></i>
      </el-button>
      <div class="logo">
        <img src="@/assets/akaribot_logo.png" alt="Logo" class="logo-image" />
        <span class="web-ui-text" v-if="screenWidth >= 384">WebUI</span>
      </div>
    </div>

    <div class="header-right">
      <el-button class="help-button" @click="goToHelp">{{ $t('header.button.doc') }}</el-button>
      <el-button class="theme-toggle-button" @click="toggleDarkMode">
        <i :class="isDarkMode ? 'mdi mdi-weather-sunny' : 'mdi mdi-weather-night'"></i>
      </el-button>
    </div>
  </el-header>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'AppHeader',
  emits: ['toggle-sidebar'],
  props: {
    userVerified: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const { t } = useI18n()
    return {
      t,
      isDarkMode: false,
      screenWidth: window.innerWidth,
    }
  },
  mounted() {
    const savedTheme = localStorage.getItem('isDarkMode')
    if (savedTheme !== null) {
      this.isDarkMode = JSON.parse(savedTheme)
    }
    window.addEventListener('resize', this.updateScreenWidth)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScreenWidth)
  },
  methods: {
    updateScreenWidth() {
      this.screenWidth = window.innerWidth
    },
    goToHelp() {
      window.open('https://bot.teahouse.team', '_blank')
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      document.documentElement.classList.toggle('dark', this.isDarkMode)
      localStorage.setItem('isDarkMode', JSON.stringify(this.isDarkMode))
    },
    switchSidebar() {
      if (!this.userVerified) return
      this.$emit('toggle-sidebar')
    },
  },
}
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
  margin-right: 12px;
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

.header-right {
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
  height: 42px;
  width: auto;
  margin-right: 6px;
}

.web-ui-text {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #666;
  cursor: default;
  font-family:
    'Roboto',
    'Noto Sans SC',
    system-ui,
    -apple-system,
    sans-serif;
}

.dark .web-ui-text {
  color: #aaa;
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
