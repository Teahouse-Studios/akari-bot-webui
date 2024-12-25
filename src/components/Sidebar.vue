<template>
  <el-aside width="200px" class="sidebar">
    <el-menu :default-active="activeMenu" class="el-menu-vertical" @select="selectMenu">
      <el-menu-item index="1">
        <i class="el-icon-s-grid"></i>
        <span>面板</span>
      </el-menu-item>
      <el-menu-item index="2">
        <i class="el-icon-setting"></i>
        <span>配置</span>
      </el-menu-item>
      <el-menu-item index="3">
        <i class="el-icon-s-tools"></i>
        <span>插件</span>
      </el-menu-item>
      <el-menu-item index="4">
        <i class="el-icon-monitor"></i>
        <span>控制台</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  name: 'AppSideBar',
  data() {
    return {
      activeMenu: '1',
    };
  },
  methods: {
    selectMenu(index) {
      this.$emit('menuSelected', index);
    }
  }
};
</script>

<style scoped>
.sidebar {
  background-color: #f4f4f5;
  height: 100%;
}
.logo {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  padding: 20px 0;
}
</style>