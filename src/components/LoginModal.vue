<template>
  <div class="overlay">
    <div class="password-modal">
      <span>{{ $t('login.title') }}</span>
      <el-input
        v-model="password"
        :placeholder="$t('login.input.password')"
        show-password
        @keyup.enter="checkPassword"
      ></el-input>

      <div class="remember-device-container">
        <el-tooltip
          :content="$t('login.forgot_password.tooltip')"
          placement="top-start"
        >
          <span class="forgot-password">{{ $t('login.forgot_password.text') }}</span>
        </el-tooltip>
      </div>

      <el-button type="primary" @click="checkPassword" :loading="loading" :disabled="loading">
        {{ $t('login.button.login') }}
      </el-button>
    </div>
  </div>
</template>

<script>
import axios from '@/axios.mjs'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default {
  name: 'LoginModal',
  data() {
    const { t } = useI18n()
    return {
      password: '',
      rememberDevice: false,
      loading: false,
      t,
    }
  },
  methods: {
    async checkPassword() {
    if (!this.password || !this.password.trim()) {
      ElMessage.warning(this.t('login.message.warning.empty'))
      return
    }

      this.loading = true
      try {
        const response = await axios.post('/api/login', {
          password: this.password,
          remember: this.rememberDevice,
        })
        if (response.status === 200) {
          ElMessage.success(this.t('login.message.success'))
          localStorage.setItem("token", response.data.data)
          location.reload()
        }
      } catch (error) {
        if (error.response?.status === 403) {
          ElMessage.error(this.t('login.message.error.failed'))
        } else if (error.response?.status === 429) {
          ElMessage.error(this.t('login.message.error.abuse'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
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
  transition: color 0.2s;
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
</style>
