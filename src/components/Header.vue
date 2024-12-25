<template>
  <el-header class="header">
    <div class="header-left">
      <div class="logo">AstrBot</div>
    </div>
    <div class="header-right">
      <el-button @click="$emit('refresh')">刷新</el-button>
      <el-button @click="$emit('modifyPassword')">密码修改</el-button>
      <el-button>GitHub</el-button>
    </div>
  </el-header>
</template>

<script>
export default {
  name: 'AppHeader'
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #ffffff;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  padding: 20px 0;
}
</style>
