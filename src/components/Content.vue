<template>
    <el-main class="content">
      <!-- 显示当前选中的视图 -->
      <component :is="currentView"></component>
      <!-- 底部内容 -->
      <div class="content-footer"></div>
    </el-main>
  </template>
  
  <script>
  export default {
    name: 'AppContent',
    props: {
      currentView: {
        type: [Object, Function], 
        required: true
      }
    }
  };
  </script>
  
  <style scoped>
  .content-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    z-index: -1;
  }
  
  .dark-mode .content-footer {
    background-color: #181818;
  }
  
  .content {
    top: 60px;
    margin-left: 192px;
    overflow-y: auto;
    background-color: transparent;
    z-index: 100;
  }
  
  .dark-mode .content {
    color: white;
  }
  </style>