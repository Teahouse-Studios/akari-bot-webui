<template>
  <div class="overlay">
    <!-- 密码输入界面 -->
    <div v-if="!requireTwoFactor" class="password-modal">
      <span>{{ $t('login.title') }}</span>
      <el-input
        v-model="password"
        :placeholder="$t('login.input.password')"
        show-password
        @keyup.enter="checkPassword"
      ></el-input>

      <div class="tooltip-container">
        <el-tooltip :content="$t('login.forgot_password.tooltip')" placement="top-start">
          <span class="forgot-password">{{ $t('login.forgot_password.text') }}</span>
        </el-tooltip>
      </div>

      <el-button type="primary" @click="checkPassword" :loading="loading" :disabled="loading">
        {{ $t('login.button.login') }}
      </el-button>
    </div>

    <div v-else class="password-modal">
      <TotpInput
        v-if="requireTwoFactor"
        :loading="twoFactorLoading"
        @confirm="verifyTwoFactor"
        @cancel="cancelTwoFactor"
        @backup-verify="verifyWithBackup"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/axios.mjs'
import LocalStorageJson from '@/localStorageJson.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import TotpInput from '@/components/TotpInput.vue'

const { t } = useI18n()

const password = ref('')
const loading = ref(false)

const requireTwoFactor = ref(false)
const twoFactorLoading = ref(false)

// Backup code

const checkPassword = async () => {
  if (!password.value || !password.value.trim()) {
    ElMessage.warning(t('login.message.warning.empty'))
    return
  }

  loading.value = true
  try {
    const response = await axios.post('/api/login', {
      password: password.value,
    })

    if (response.status === 200) {
      ElMessage.success(t('login.message.success'))
      LocalStorageJson.setItem('token', response.data.data)
      location.reload()
    }
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error(t('login.message.error.failed'))
    } else if (error.response?.status === 429) {
      ElMessage.error(t('login.message.error.abuse'))
    } else if (
      error.response?.status === 401 &&
      isTwoFactorRequired(error.response?.data?.detail)
    ) {
      requireTwoFactor.value = true
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    loading.value = false
  }
}

function isTwoFactorRequired(message) {
  if (!message) return false
  const msg = message.toLowerCase()
  return msg.includes('2fa')
}

async function verifyTwoFactor(code) {
  if (code.length !== 6) return
  twoFactorLoading.value = true
  try {
    const response = await axios.post('/api/login', {
      password: password.value,
      totp_code: code,
    })

    if (response.status === 200) {
      ElMessage.success(t('login.message.success'))
      LocalStorageJson.setItem('token', response.data.data)
      location.reload()
    }
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error(t('login.two_factor.message.failed'))
    } else if (error.response?.status === 429) {
      ElMessage.error(t('login.message.error.abuse'))
    } else {
      ElMessage.error(t('message.error.fetch') + (error.message || ''))
    }
  } finally {
    twoFactorLoading.value = false
  }
}

function cancelTwoFactor() {
  requireTwoFactor.value = false
}

async function verifyWithBackup(backupCode) {
  twoFactorLoading.value = true
  try {
    const response = await axios.post('/api/login', {
      password: password.value,
      backup_code: backupCode,
    })

    if (response.status === 200) {
      ElMessage.success(t('login.message.success'))
      LocalStorageJson.setItem('token', response.data.data)
      location.reload()
    }
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error(t('login.two_factor.message.failed'))
    } else if (error.response?.status === 429) {
      ElMessage.error(t('login.message.error.abuse'))
    } else {
      ElMessage.error(t('message.error.fetch') + (error.message || ''))
    }
  } finally {
    twoFactorLoading.value = false
  }
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

.tooltip-container {
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

/* 2FA modal styles */
.two-factor-modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 300px;
}
.dark .two-factor-modal {
  background: #333;
  color: white;
}

.two-factor-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
.dark .two-factor-desc {
  color: #aaa;
}

.two-factor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
