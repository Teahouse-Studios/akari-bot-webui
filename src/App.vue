<template>
  <div id="app">
    <AppHeader @refresh="refresh" @modifyPassword="modifyPassword" @toggle-sidebar="toggleSidebar" />
    <PasswordModal v-if="showPasswordModal" @success="showPasswordModal = false" />
    <el-container :style="{ marginTop: '60px' }">
      <!-- 控制 Sidebar 是否显示 -->
      <AppSidebar v-if="isSidebarVisible" @menuSelect="handleMenuSelect" class="sidebar" />
      <el-main :class="['content', { 'content-with-sidebar': isSidebarVisible }]" :style="{ marginLeft: sidebarMarginLeft }">
        <component :is="currentView"></component>
        <div class="content-footer"></div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import axios from '@/axios';
import AppSidebar from './components/Sidebar.vue';
import AppHeader from './components/Header.vue';
import PasswordModal from './components/PasswordModal.vue';
import Cookies from 'js-cookie';

export default {
  components: {
    AppHeader,
    AppSidebar,
    PasswordModal,
  },
  data() {
    return {
      currentView: null,
      showPasswordModal: null,
      isDarkMode: false,
      isSidebarVisible: true,  // 控制 Sidebar 是否显示
    };
  },
  computed: {
    // 动态计算 content 的 margin-left
    sidebarMarginLeft() {
      return this.isSidebarVisible ? '200px' : '0';
    }
  },
  mounted() {
    const deviceToken = Cookies.get('deviceToken');
    if (deviceToken) {
      this.showPasswordModal = false;
    } else {
      this.checkPassword();
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
    toggleSidebar() {
      this.isSidebarVisible = !this.isSidebarVisible;  // 切换 Sidebar 显示状态
    },
    handleMenuSelect(view) {
      this.currentView = this.$options.components[`${view.charAt(0).toUpperCase() + view.slice(1)}View`];
    },
    toggleDarkMode(isDark) {
      this.isDarkMode = isDark;
    },
    async checkPassword() {
      try {
        const deviceToken = Cookies.get('deviceToken');
        if (deviceToken) {
          this.showPasswordModal = false;
          return;
        }
        const response = await axios.post('/auth', { password: '' });
        if (response.status === 200) {
          this.showPasswordModal = false;
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.showPasswordModal = true;
        } else {
          this.$message.error('请求失败，请稍后再试');
        }
      }
    }
  }
};
</script>

<style>
.content {
  top: 60px;
  overflow-y: auto;
  background-color: transparent;
  z-index: 0;
  transition: margin-left 0.3s, transform 0.3s; /* 添加 transform 动画 */
}

.content-with-sidebar {
  margin-left: 200px;  /* 有 Sidebar 时，Content 左边距为 200px */
}

.content-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: -1;
}

.dark-mode .content {
  color: white;
}

body.dark-mode .content-footer {
  background-color: #181818;
}

/* 媒体查询：小屏幕下隐藏 Sidebar 并覆盖 Content */
@media (max-width: 768px) {
  /* 默认状态下，Sidebar 隐藏 */
  .sidebar {
    position: fixed; /* Sidebar 固定在屏幕左侧 */
    top: 60px;
    left: -200px; /* 初始状态 Sidebar 在屏幕外 */
    bottom: 0;
    width: 200px;
    background-color: #f4f4f4;  /* 保持与大屏幕相同的背景 */
    z-index: 1000;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);  /* 添加阴影效果 */
    transition: transform 0.3s ease-in-out;  /* Sidebar 展开/收缩的动画 */
  }

  .sidebar.show {
    transform: translateX(200px);  /* Sidebar 展开时 */
  }

  /* 控制 Content 视图 */
  .content {
    transition: transform 0.3s ease-in-out;
  }

  .content.show-sidebar {
    transform: translateX(200px); /* Content 在 Sidebar 展开时向右偏移 */
  }

  .content-with-sidebar {
    margin-left: 0 !important; /* 小屏幕下 Content 左边距设置为 0 */
  }
}
</style>
