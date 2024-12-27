<template>
  <el-header class="header" :class="{ 'dark-mode': isDarkMode }">
    <div class="header-left">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
        <div class="logo-text">
          <span class="akari-bot-text">AkariBot</span>
          <span class="web-ui-text">WebUI</span>
        </div>
      </div>
    </div>
    <div class="header-right">
      <el-button class="help-button" @click="goToHelp">帮助文档</el-button>
      <el-button class="theme-toggle-button" @click="toggleDarkMode">
        <i :class="isDarkMode ? 'mdi mdi-weather-sunny' : 'mdi mdi-weather-night'"></i>
      </el-button>
    </div>
  </el-header>
</template>

<script>
export default {
  name: 'AppHeader',
  emits: ['toggle-dark-mode'],  // 显式声明事件
  data() {
    return {
      isDarkMode: false
    };
  },
  mounted() {
    // 页面加载时从 localStorage 获取主题设置
    const savedTheme = localStorage.getItem('isDarkMode');
    if (savedTheme !== null) {
      this.isDarkMode = JSON.parse(savedTheme);
    }

    // 根据当前主题设置更新 body 的 class
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    }
  },
  methods: {
    goToHelp() {
      window.open('https://bot.teahouse.team', '_blank');
    },
    goToGitHub() {
      window.open('https://github.com/Teahouse-Studios/akari-bot', '_blank');
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      // 切换 dark-mode 类
      document.body.classList.toggle('dark-mode', this.isDarkMode);

      // 保存主题设置到 localStorage
      localStorage.setItem('isDarkMode', JSON.stringify(this.isDarkMode));

      // 通知父组件或其他需要的地方
      this.$emit('toggle-dark-mode', this.isDarkMode);
    }
  }
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

.header.dark-mode {
  background-color: #333;
  color: white;
  border-bottom: 1px solid #1f1f1f;
}

.theme-toggle {
  background: #333;
  color: white;
}

body.dark-mode .theme-toggle {
  background: white;
  color: #333;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.logo-image {
  height: 40px;
  width: auto;
  margin-right: 8px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.akari-bot-text {
  font-size: 18px;
}

.web-ui-text {
  font-size: 12px;
  color: #888;
}

.el-button {
  background-color: white;
  color: #333;
  border-color: #e0e0e0;
  font-size: 14px;
}

.el-button:hover {
  background-color: #eee;
  color: #333;
  border-color: #e0e0e0;
}

body.dark-mode .el-button {
  background-color: #333;
  color: white;
  border-color: #4d4d4d;
}

body.dark-mode .el-button:hover {
  background-color: #666;
  color: white;
  border-color: #4d4d4d;
}

.theme-toggle-button {
  background-color: #333;
  color: white;
}

.theme-toggle-button:hover {
  background-color: #666;
  color: white;
}

body.dark-mode .theme-toggle-button {
  background-color: #eeeeee;
  color: #333;
}

body.dark-mode .theme-toggle-button:hover {
  background-color: #b0b0b0;
  color: #333;
}
</style>
