<template>
  <div class="overlay">
    <div class="password-modal">
      <span>请输入独立密码</span>
      <el-input v-model="password" placeholder="输入密码" show-password @keyup.enter="checkPassword"></el-input>
      <!-- 记住设备的复选框 -->
      <el-checkbox v-model="rememberDevice">记住该设备</el-checkbox>
      <el-button type="primary" @click="checkPassword">登录</el-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    isDarkMode: Boolean
  },
  data() {
    return {
      password: '',
      rememberDevice: false,  // 记录是否勾选了“记住设备”
    };
  },
  created() {
    // 在页面加载时检查本地存储中是否有登录状态
    const isDeviceRemembered = localStorage.getItem('rememberDevice');
    if (isDeviceRemembered === 'true') {
      this.$emit('success'); // 如果记住设备为 true，则直接触发登录成功
    }
  },
  methods: {
    // 检查密码的方法
    async checkPassword() {
      try {
        // 发送 POST 请求验证密码
        const response = await axios.post('http://127.0.0.1:5000/auth', { password: this.password });

        // 如果返回状态是 200，认为密码正确
        if (response.status === 200) {
          this.$emit('success');  // 密码正确，触发 success 事件，关闭密码框
          
          // 如果勾选了“记住设备”，则将该状态存入 localStorage
          if (this.rememberDevice) {
            localStorage.setItem('rememberDevice', 'true');
          } else {
            localStorage.removeItem('rememberDevice');  // 如果没有勾选，清除本地存储中的记住设备状态
          }
        } else {
          this.$message.error('密码错误，请重新输入');  // 设置错误信息
        }
      } catch (error) {
        // 如果请求失败或者返回 401，显示错误信息
        if (error.response && error.response.status === 401) {
          this.$message.error('密码错误，请重新输入');
        } else {
          this.$message.error('请求失败，请稍后再试');
        }
      }
    },

    // 设置错误消息并自动清除
    showErrorMessage(message) {
      this.errorMessage = message; // 显示错误信息

      // 设置定时器，3秒后清除错误信息
      setTimeout(() => {
        this.errorMessage = '';  // 清除错误信息
      }, 3000); // 3秒后自动消失
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
  backdrop-filter: blur(5px); /* 添加模糊效果 */
}

.password-modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px; /* 设置输入框和按钮之间的间距 */
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

.el-checkbox {
  color: #333;
}

body.dark-mode .el-checkbox {
  color: white;
}

.el-checkbox.is-checked {
  color: #0091ff;
}
</style>
