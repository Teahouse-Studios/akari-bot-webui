<template>
  <el-aside width="200px" class="sidebar">
    <el-menu :default-active="activeMenu" class="sidebar-menu" @select="handleSelect">
      <el-menu-item index="/dashboard">
        <i class="mdi mdi-view-dashboard"></i>
        <span>{{ $t('sidebar.item.dashboard') }}</span>
      </el-menu-item>
      <el-menu-item index="/config">
        <i class="mdi mdi-cog"></i>
        <span>{{ $t('sidebar.item.config') }}</span>
      </el-menu-item>
      <el-menu-item index="/data">
        <i class="mdi mdi-database"></i>
        <span>{{ $t('sidebar.item.data') }}</span>
      </el-menu-item>
      <el-menu-item index="/logs">
        <i class="mdi mdi-console"></i>
        <span>{{ $t('sidebar.item.logs') }}</span>
      </el-menu-item>
      <el-menu-item index="/chat">
        <i class="mdi mdi-chat"></i>
        <span>{{ $t('sidebar.item.chat') }}</span>
      </el-menu-item>
      <el-menu-item index="/setting">
        <i class="mdi mdi-tune"></i>
        <span>{{ $t('sidebar.item.setting') }}</span>
      </el-menu-item>
      <el-menu-item index="/about">
        <i class="mdi mdi-information-outline"></i>
        <span>{{ $t('sidebar.item.about') }}</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'AppSidebar',
  data() {
    const { t } = useI18n()

    return {
      t,
      activeMenu: this.getActiveMenuFromRoute(),
    }
  },
  methods: {
    getActiveMenuFromRoute() {
      return this.$route.name
      // const validPaths = ['dashboard', 'config', 'data', 'logs', 'chat', 'setting', 'about']
      // const path = this.$route.name
      // if (validPaths.includes(path)) {
      //   return path
      // }
      // return ''
    },
    handleSelect(index) {
      this.activeMenu = index
      this.$router.push({ name: index })
    },
  },
  watch: {
    '$route.name': function () {
      this.activeMenu = this.getActiveMenuFromRoute()
    },
  },
}
</script>

<style scoped>
.sidebar {
  background-color: #f4f4f4 !important;
  position: fixed;
  left: 0;
  bottom: 0;
  top: 60px;
  overflow-y: auto;
  z-index: 99;
  border-right: 1px solid #e0e0e0;
}

.dark .sidebar {
  background-color: #333 !important;
  border-right: 1px solid #1f1f1f;
}

.sidebar-menu {
  border-right: none;
  background-color: #f4f4f4;
}

.dark .sidebar-menu {
  background-color: #333;
}

.el-menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

.el-menu-item i {
  margin-right: 20px;
  font-size: 2ch;
}
</style>
