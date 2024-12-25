<template>
  <div id="app">
    <Header @refresh="refresh" @modifyPassword="modifyPassword" />
    <el-container style="margin-top: 60px; height: calc(100vh - 60px);">
      <Sidebar @menuSelected="changeContent" />
      <el-main class="content">
        <component :is="currentView"></component>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';

const Dashboard = {
  template: '<div><h1>面板内容</h1></div>'
};
const Settings = {
  template: '<div><h1>配置页面</h1></div>'
};
const Plugins = {
  template: '<div><h1>插件页面</h1></div>'
};
const Console = {
  template: '<div><h1>控制台页面</h1></div>'
};

export default {
  components: {
    Sidebar,
    Header
  },
  data() {
    return {
      currentView: Dashboard
    };
  },
  methods: {
    refresh() {
      alert('更新按钮点击');
    },
    modifyPassword() {
      alert('修改密码按钮点击');
    },
    changeContent(index) {
      switch (index) {
        case '1':
          this.currentView = Dashboard;
          break;
        case '2':
          this.currentView = Settings;
          break;
        case '3':
          this.currentView = Plugins;
          break;
        case '4':
          this.currentView = Console;
          break;
      }
    }
  }
};
</script>

<style scoped>
#app {
  height: 100vh;
}
.content {
  padding: 20px;
}
</style>