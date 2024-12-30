<template>
  <div id="app">
    <AppHeader @refresh="refresh" @modifyPassword="modifyPassword" />
    <PasswordModal 
      v-if="showPasswordModal"
      @success="showPasswordModal = false" />
    <el-container 
      style="margin-top: 60px; display: flex;" 
      :class="{'blurred': showPasswordModal}">
      <AppSidebar @menuSelect="handleMenuSelect" :disabled="showPasswordModal" />
      <AppContent v-if="!showPasswordModal" :currentView="currentView" />
      <div class="content-footer"></div>
    </el-container>
  </div>
</template>

<script>
import axios from '@/axios';
import AppSidebar from './components/Sidebar.vue';
import AppHeader from './components/Header.vue';
import PasswordModal from './components/PasswordModal.vue';
import AppContent from './components/Content.vue';
import Cookies from 'js-cookie'; // 引入 js-cookie

export default {
  components: {
    AppSidebar,
    AppHeader,
    PasswordModal,
    AppContent
  },
  data() {
    return {
      currentView: null,
      showPasswordModal: null,
      isDarkMode: false,  // 如果没有设置过暗黑模式，添加默认值
    };
  },
  mounted() {
    // 检查 cookies 中是否存在有效的 deviceToken
    const deviceToken = Cookies.get('deviceToken');
    if (deviceToken) {
      this.showPasswordModal = false; // 如果有有效的 token，则跳过密码弹窗
    } else {
      this.checkPassword();  // 否则弹出密码窗口
    }
  },
  watch: {
    '$route.name': function(newName) {
      switch (newName) {
        case 'dashboard':
          import('./views/DashboardView.vue').then((module) => {
            this.currentView = module.default;
          });
          break;
        case 'config':
          import('./views/ConfigView.vue').then((module) => {
            this.currentView = module.default;
          });
          break;
        case 'modules':
          import('./views/ModulesView.vue').then((module) => {
            this.currentView = module.default;
          });
          break;
        case 'logger':
          import('./views/LoggerView.vue').then((module) => {
            this.currentView = module.default;
          });
          break;
        case 'setting':
          import('./views/SettingView.vue').then((module) => {
            this.currentView = module.default;
          });
          break;
        case 'about':
          import('./views/AboutView.vue').then((module) => {
            this.currentView = module.default;
          });
          break;
        default:
          this.currentView = { template: '<div></div>' };
      }
    }
  },
  methods: {
    handleMenuSelect(view) {
      this.currentView = this.$options.components[`${view.charAt(0).toUpperCase() + view.slice(1)}View`];
    },
    toggleDarkMode(isDark) {
      this.isDarkMode = isDark;
    },
    async checkPassword() {
      try {
        // 发送请求前检查 cookies 中是否有有效的 token
        const deviceToken = Cookies.get('deviceToken');
        if (deviceToken) {
          this.showPasswordModal = false;  // 如果 cookies 中有有效的 token，跳过密码弹窗
          return;
        }

        // 发送空密码请求
        const response = await axios.post('/auth', { password: '' });
        if (response.status === 200) {
          this.showPasswordModal = false;  // 如果返回200，认为是空密码，直接进入
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.showPasswordModal = true;  // 如果返回 401，弹出密码窗口
        } else {
          this.$message.error('请求失败，请稍后再试');
        }
      }
    }
  }
};
</script>

<style>
.content-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    z-index: -1;
  }
  
.dark-mode .content-footer {
    background-color: #181818;
  }
</style>