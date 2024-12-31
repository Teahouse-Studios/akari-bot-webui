<template>
  <el-main class="content">
    <!-- 显示当前选中的视图 -->
    <component :is="currentView"></component>
    <!-- 底部内容 -->
  </el-main>
</template>

<script>
export default {
  name: 'AppContent',
  props: {
    currentView: {
      type: [Object, Function], 
      required: true
    },
    showPasswordModal: {
      type: Boolean,
      required: true
    }
  }
};
</script>

<style scoped>
.content {
  top: 60px;
  margin-left: 192px;
  overflow-y: auto;
  background-color: transparent;
  z-index: 0;
}

.dark-mode .content {
  color: white;
}
</style>
