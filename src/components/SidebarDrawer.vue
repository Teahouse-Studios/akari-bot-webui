<template>
  <el-drawer v-model="isSidebarVisible" direction="ltr" :with-header="false" size="200px">
    <el-aside width="200px" class="sidebar">
      <div class="header-drawer">
        <div class="logo">
          <img src="@/assets/akaribot_logo.png" alt="Logo" class="logo-image" />
          <span class="web-ui-text">WebUI</span>
        </div>
      </div>
      <el-menu :default-active="activeMenu" class="sidebar-menu" @select="handleSelect">
        <el-menu-item index="/dashboard">
          <i class="mdi mdi-view-dashboard"></i>
          <span>{{ $t('sidebar.item.dashboard') }}</span>
        </el-menu-item>
        <el-menu-item index="/config">
          <i class="mdi mdi-cog"></i>
          <span>{{ $t('sidebar.item.config') }}</span>
        </el-menu-item>
        <el-menu-item index="/modules">
          <i class="mdi mdi-puzzle"></i>
          <span>{{ $t('sidebar.item.modules') }}</span>
        </el-menu-item>
        <el-menu-item index="/session">
          <i class="mdi mdi-forum"></i>
          <span>{{ $t('sidebar.item.session') }}</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <i class="mdi mdi-console"></i>
          <span>{{ $t('sidebar.item.logs') }}</span>
        </el-menu-item>
        <el-menu-item index="/chat">
          <i class="mdi mdi-chat"></i>
          <span>{{ $t('sidebar.item.chat') }}</span>
        </el-menu-item>
        <el-menu-item v-if="isDevelopMode" index="/database">
          <i class="mdi mdi-database"></i>
          <span>{{ $t('sidebar.item.database') }}</span>
        </el-menu-item>
        <el-menu-item v-if="isDevelopMode" index="/files">
          <i class="mdi mdi-folder"></i>
          <span>{{ $t('sidebar.item.files') }}</span>
        </el-menu-item>
        <el-menu-item index="/setting">
          <i class="mdi mdi-wrench"></i>
          <span>{{ $t('sidebar.item.setting') }}</span>
        </el-menu-item>
        <el-menu-item index="/about">
          <i class="mdi mdi-information-outline"></i>
          <span>{{ $t('sidebar.item.about') }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IS_DEMO } from '@/const'

defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()

const activeMenu = ref(route.name)
const isDevelopMode = ref(localStorage.getItem('isDevelopMode') === 'true' && !IS_DEMO)

function getActiveMenuFromRoute() {
  return route.name
  // const validPaths = ['dashboard', 'config', 'data', 'logs', 'chat', 'setting', 'about']
  // const path = route.name
  // if (validPaths.includes(path)) {
  //   return path
  // }
  // return ''
}

function handleSelect(index) {
  activeMenu.value = index
  router.push({ name: index })
  emit('update:modelValue', false)
}

watch(
  () => route.name,
  () => {
    activeMenu.value = getActiveMenuFromRoute()
  },
)
</script>

<style scoped>
.sidebar {
  background-color: #f4f4f4 !important;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
}

.dark .sidebar {
  background-color: #333 !important;
  border-right: 1px solid #1f1f1f;
}

.header-drawer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #f4f4f4;
  height: 60px;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #e0e0e0;
}

.dark .header-drawer {
  background-color: #333;
  border-bottom: 1px solid #1f1f1f;
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
