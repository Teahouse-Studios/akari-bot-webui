<template>
  <el-aside width="200px" class="sidebar">
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      @select="handleSelect"
    >
      <el-menu-item index="dashboard">
        <i class="mdi mdi-view-dashboard"></i>
        <span>面板</span>
      </el-menu-item>
      <el-menu-item index="config">
        <i class="mdi mdi-cog"></i>
        <span>配置</span>
      </el-menu-item>
      <el-menu-item index="logs">
        <i class="mdi mdi-console"></i>
        <span>日志</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  name: "AppSidebar",
  data() {
    return {
      activeMenu: this.getActiveMenuFromRoute(),
    };
  },
  methods: {
    getActiveMenuFromRoute() {
      const validPaths = [
        "dashboard",
        "config",
        "logs",
      ];
      const path = this.$route.name;
      if (validPaths.includes(path)) {
        return path;
      }
      return ""; // 如果路径无效，则没有任何菜单项选中
    },
    handleSelect(index) {
      this.activeMenu = index;
      this.$router.push({ name: index });
    },
  },
  watch: {
    "$route.name": function () {
      this.activeMenu = this.getActiveMenuFromRoute();
    },
  },
};
</script>

<style scoped>
.sidebar {
  background-color: white;
  position: fixed;
  left: 0;
  bottom: 0;
  top: 60px;
  overflow-y: auto;
  z-index: 99;
  border-right: 1px solid #e0e0e0;
}

.dark-mode .sidebar {
  background-color: #333;
  border-right: 1px solid #1f1f1f;
}

.sidebar-menu {
  border-right: none !important;
  background-color: white;
}

.dark-mode .sidebar-menu {
  background-color: #333;
}

.el-menu-item {
  display: flex;
  align-items: center;
  color: #333;
  padding: 12px 20px;
}

.el-menu-item i {
  margin-right: 20px;
  font-size: 2ch;
}

.el-menu-item:hover {
  background-color: #bbb;
}

.dark-mode .el-menu-item:hover {
  background-color: #444;
}

.el-menu-item.is-active {
  color: #0091ff;
}

.dark-mode .el-menu-item {
  color: #ccc;
}

.dark-mode .el-menu-item.is-active {
  color: #0091ff;
}
</style>
