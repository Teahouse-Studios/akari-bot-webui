<template>
  <div id="app" :class="{'dark-mode': isDarkMode}">
    <Header @refresh="refresh" @modifyPassword="modifyPassword" />
    <PasswordModal 
      v-if="showPasswordModal" 
      :correctPassword="correctPassword" 
      @success="showPasswordModal = false" />
    <el-container 
      style="margin-top: 60px; display: flex;" 
      :class="{'blurred': showPasswordModal}">
      <Sidebar @menuSelect="handleMenuSelect" :disabled="showPasswordModal" />
      <Content :currentView="currentView" />
    </el-container>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import PasswordModal from './components/PasswordModal.vue';
import Content from './components/Content.vue';

export default {
  components: {
    Sidebar,
    Header,
    PasswordModal,
    Content
  },
  data() {
    return {
      currentView: null,
      showPasswordModal: false,
      correctPassword: null,
    };
  },
  mounted() {
    if (window.location.hostname === 'localhost') {
      this.showPasswordModal = false;
    } else {
      if (this.correctPassword) {
        this.showPasswordModal = true;
      }
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
    }
  }
};
</script>