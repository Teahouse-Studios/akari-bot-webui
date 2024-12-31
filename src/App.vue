<template>
  <div id="app">
    <AppHeader @refresh="refresh" @modifyPassword="modifyPassword" @toggle-sidebar="toggleSidebar" />
    <PasswordModal v-if="showPasswordModal" @success="showPasswordModal = false" />
    <el-container :style="{ marginTop: '60px' }">
      <div v-if="isSidebarVisible && windowWidth <= 1024" class="sidebar-overlay" @click="closeSidebar"></div>
      <AppSidebar :class="['sidebar', { show: isSidebarVisible }]" @menuSelect="handleMenuSelect" />
      <el-main :class="['content', { 'content-with-sidebar': isSidebarVisible, 'show-sidebar': isSidebarVisible && windowWidth <= 1024 }]" :style="{ marginLeft: sidebarMarginLeft }">
        <component :is="currentView" v-if="!showPasswordModal" :showPasswordModal="showPasswordModal"></component>
      </el-main>
      <div class="content-footer"></div>
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
      showPasswordModal: true,
      isDarkMode: false,
      isSidebarVisible: true,  // 控制 Sidebar 是否显示
      windowWidth: window.innerWidth  // 存储当前屏幕宽度
    };
  },
  computed: {
    // 动态计算 content 的 margin-left
    sidebarMarginLeft() {
      return this.isSidebarVisible ? '200px' : '0';
    },
  },
  mounted() {
    // 在 mounted 时，初始化 Sidebar 的状态
    this.updateSidebarVisibility();
    
    // 监听窗口大小变化，更新状态
    window.addEventListener('resize', this.updateSidebarVisibility);

    const deviceToken = Cookies.get('deviceToken');
    if (deviceToken) {
      this.showPasswordModal = false;
    } else {
      this.checkPassword();
    }
  },
  watch: {
    '$route.name': function(newName) {
      if (this.showPasswordModal) return; // Don't load views if the password modal is showing
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
  beforeUnmount() {
    // 销毁时移除事件监听
    window.removeEventListener('resize', this.updateSidebarVisibility);
  },
  methods: {
    toggleSidebar() {
      // 如果是大屏幕，强制显示 Sidebar
      if (this.windowWidth <= 1024) {
        this.isSidebarVisible = !this.isSidebarVisible;
      }
    },
    updateSidebarVisibility() {
      this.windowWidth = window.innerWidth;
      // 在大屏幕下强制显示 Sidebar
      if (this.windowWidth > 1024) {
        this.isSidebarVisible = true;
      } else {
        this.isSidebarVisible = false;
      }
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
    },
    // 关闭 Sidebar
    closeSidebar() {
      this.isSidebarVisible = false;
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

/* 默认状态下，Sidebar 应该在大屏幕时显示 */
.sidebar {
  position: fixed; /* Sidebar 固定在屏幕左侧 */
  top: 60px;
  left: 0; /* 强制显示 Sidebar */
  bottom: 0;
  width: 200px;
  background-color: #f4f4f4;
  z-index: 100;
  transition: transform 0.3s ease-in-out;
}

.content-with-sidebar {
  margin-left: 200px; /* 强制显示 Sidebar 时，内容左移 */
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  z-index: 99; /* 位于 Sidebar 上面，保证遮罩层优先展示 */
}

/* 小屏幕下，Sidebar 默认隐藏 */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed; /* Sidebar 固定在屏幕左侧 */
    top: 60px;
    left: 0; /* 初始状态，Sidebar 在屏幕外 */
    bottom: 0;
    width: 200px;
    background-color: #f4f4f4;
    z-index: 100;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
    transform: translateX(-200px); /* 初始状态，Sidebar 在屏幕外 */
    transition: transform 0.3s ease-in-out;
  }

  /* 当 Sidebar 被展示时，向右平移 200px */
  .sidebar.show {
    transform: translateX(0px);
  }

  .content {
    transform: translateX(0px);
  }

  .content-with-sidebar {
    margin-left: 0 !important; /* 小屏幕下 Content 左边距为 0 */
  }

  .sidebar-overlay {
    display: block;
  }
}

/* 大屏幕时，强制显示 Sidebar */
@media (min-width: 1025px) {
  .sidebar {
    left: 0; /* 始终显示在屏幕左侧 */
  }

  .content-with-sidebar {
    margin-left: 200px; /* Content 左边距为 200px */
  }

  .sidebar-overlay {
    display: none;
  }
}

</style>
