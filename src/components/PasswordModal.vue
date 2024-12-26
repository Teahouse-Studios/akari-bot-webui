<template>
  <div class="overlay">
    <div class="password-modal">
      <span>请输入独立密码</span>
      <el-input v-model="password" placeholder="输入密码" show-password @keyup.enter="checkPassword"></el-input>
      <el-button type="primary" @click="checkPassword">登录</el-button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isDarkMode: Boolean,
    correctPassword: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      password: ''
    };
  },
  methods: {
    checkPassword() {
      if (this.password === this.correctPassword) {
        this.$emit('success');
      } else {
        this.$message.error('密码错误，请重新输入');
      }
    }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(10px); /* 添加模糊效果 */
}

.password-modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 20px; /* 设置输入框和按钮之间的间距 */
  width: 300px; /* 设置密码框宽度 */
}

body.dark-mode .password-modal {
  background: #333;
  color: white;
}

.el-input {
  width: 100%; /* 让输入框宽度填满容器 */
}

.el-button {
  align-self: center; /* 按钮居中 */
  background-color: #0091ff;
  border: none;
}
</style>
