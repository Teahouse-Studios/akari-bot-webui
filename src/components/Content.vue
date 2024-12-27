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
  },
  watch: {
    currentView(newView) {
      if (!this.showPasswordModal) {
        this.fetchData(newView);  // 仅在没有密码弹窗时发起 API 请求
      }
    }
  },
  methods: {
    fetchData() {
      // 这里是获取视图数据的逻辑，可以根据具体视图发起不同的 API 请求
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
