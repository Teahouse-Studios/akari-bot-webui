<template>
  <div class="overlay">
    <div class="password-modal">
      <span>登录以继续</span>
      <el-input
        v-model="password"
        placeholder="输入密码"
        show-password
        @keyup.enter="checkPassword"
      ></el-input>

      <div class="remember-device-container">
        <el-checkbox v-model="rememberDevice">记住登录状态</el-checkbox>
        <span
          class="forgot-password"
          @mouseenter="showTooltip = true"
          @mouseleave="showTooltip = false"
          >忘记密码
        </span>
        <div v-show="showTooltip" class="tooltip">
          请前往服务端，进入“assets/private/api”目录，删除“.password”文件后重新设置密码。
        </div>
      </div>

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
import axios from "@/axios";

export default {
  data() {
    return {
      password: "",
      rememberDevice: false,
      loading: false,
      showTooltip: false,
    };
  },
  methods: {
    async checkPassword() {
      this.loading = true;
      try {
        const response = await axios.post("/api/auth", {
          password: this.password,
          remember: this.rememberDevice,
        });

        if (response.status === 200) {
          this.$message.success("登录成功");
          localStorage.setItem("noPassword", JSON.stringify(response.data.no_password));
          location.reload();
        } else {
          this.$message.error("请求失败，请稍后再试");
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$message.error("密码错误，请重新输入");
        } else {
          this.$message.error("请求失败，请稍后再试");
        }
      } finally {
        this.loading = false;
      }
    },
  },
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
  backdrop-filter: blur(5px);
}

.password-modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 300px;
}
.dark .password-modal {
  background: #333;
  color: white;
}


.remember-device-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.forgot-password {
  color: #666;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.3s;
}
.forgot-password:hover {
  color: #333;
}

.dark .forgot-password {
  color: #ccc;
}

.dark .forgot-password:hover {
  color: white;
}

.tooltip {
  position: absolute;
  top: 50vh;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  z-index: 10;
}
</style>
