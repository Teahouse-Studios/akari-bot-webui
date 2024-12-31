<template>
  <div class="overlay">
    <div class="password-modal">
      <span>登录以继续</span>
      <el-input v-model="password" placeholder="输入密码" show-password @keyup.enter="checkPassword"></el-input>
      <!-- 记住设备的复选框 -->
      <el-checkbox v-model="rememberDevice">记住登录状态</el-checkbox>
      <el-button 
        type="primary" 
        @click="checkPassword" 
        :loading="loading" 
        :disabled="loading"
      >
        登录
      </el-button>
    </div>
  </div>
</template>

<script>
import axios from '@/axios';
import Cookies from 'js-cookie'; // 引入 js-cookie

export default {
  emits: ['success'],  // 显式声明事件
  data() {
    return {
      password: '',
      rememberDevice: false,  // 记录是否勾选了“记住设备”
      loading: false,         // 控制加载状态
    };
  },
  created() {
    // 检查 cookies 中是否存在有效的登录状态
    const deviceToken = Cookies.get('deviceToken');
    if (deviceToken) {
      this.$emit('success'); // 如果 cookies 中有有效的 token，直接触发登录成功
    }
  },
  methods: {
    // 检查密码的方法
    async checkPassword() {
      this.loading = true;  // 开始加载
      try {
        // 发送 POST 请求验证密码
        const response = await axios.post('/auth', { password: this.password, remember: this.rememberDevice });

        // 如果返回状态是 200，认为密码正确
        if (response.status === 200) {
          location.reload();  // 密码正确，刷新页面
          
          // 根据勾选“记住设备”的状态设置 cookies 过期时间
          const expiresIn = this.rememberDevice ? 365 : 1; // 记住设备为 true 则有效期 1 年，否则为 1 天
          Cookies.set('deviceToken', response.data.deviceToken, { expires: expiresIn });
        } else {
          this.$message.error('请求失败，请稍后再试');  // 设置错误信息
        }
      } catch (error) {
        // 如果请求失败或者返回 401，显示错误信息
        if (error.response && error.response.status === 401) {
          this.$message.error('密码错误，请重新输入');
        } else {
          this.$message.error('请求失败，请稍后再试');
        }
      } finally {
        this.loading = false;  // 请求结束，无论成功还是失败，都停止加载
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
</style>
