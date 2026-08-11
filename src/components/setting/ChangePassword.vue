<template>
  <div v-loading="loading">
    <h3><i class="mdi mdi-lock"></i> {{ $t('setting.change_password.title') }}</h3>

    <!-- 密码表单 -->
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
      <el-form-item
        v-if="!noPassword"
        :label="$t('setting.change_password.input.old_password')"
        prop="old_password"
      >
        <el-input v-model="form.old_password" type="password" />
      </el-form-item>

      <el-form-item
        v-if="!noPassword"
        :label="$t('setting.change_password.input.new_password')"
        prop="new_password"
      >
        <el-input v-model="form.new_password" type="password" />
      </el-form-item>

      <el-form-item
        v-if="noPassword"
        :label="$t('setting.change_password.input.set_password')"
        prop="new_password"
      >
        <el-input v-model="form.new_password" type="password" />
      </el-form-item>

      <el-form-item
        :label="$t('setting.change_password.input.confirm_password')"
        prop="confirm_password"
      >
        <el-input v-model="form.confirm_password" type="password" />
      </el-form-item>

      <el-form-item v-if="noPassword">
        <el-button type="primary" @click="handleUpdatePassword">{{
          $t('setting.change_password.button.set_password')
        }}</el-button>
      </el-form-item>

      <el-form-item v-if="!noPassword">
        <div class="password-buttons">
          <el-button type="primary" @click="handleUpdatePassword">{{
            $t('setting.change_password.button.update_password')
          }}</el-button>
          <el-button type="danger" @click="handleClearPassword">{{
            $t('setting.change_password.button.clear_password')
          }}</el-button>
        </div>
      </el-form-item>
    </el-form>

    <el-dialog v-model="showTotpVerify" width="330px" align-center :close-on-click-modal="false">
      <TotpInput
        :loading="totpVerifyLoading"
        @confirm="onTotpConfirmed"
        @cancel="showTotpVerify = false"
        @recovery-verify="onRecoveryConfirmed"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'
import TotpInput from '@/components/TotpInput.vue'

const { t } = useI18n()

const formRef = ref(null)

const loading = ref(true)
const noPassword = ref(false)
const twoFactorEnabled = ref(false)

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const rules = reactive({
  old_password: [
    {
      required: true,
      message: t('setting.change_password.validate.old_password'),
      trigger: 'blur',
    },
  ],
  new_password: [
    {
      required: true,
      message: t('setting.change_password.validate.new_password'),
      trigger: 'blur',
    },
  ],
  confirm_password: [
    {
      required: true,
      message: t('setting.change_password.validate.confirm_password'),
      trigger: 'blur',
    },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.new_password) {
          callback(new Error(t('setting.change_password.validate.inconsistent')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// TOTP verification for 2FA-enabled accounts
const showTotpVerify = ref(false)
const totpVerifyLoading = ref(false)

const isDevelopMode = computed(() => LocalStorageJson.getItem('isDevelopMode') === 'true')

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/password')
    noPassword.value = !data.have_password
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + error.message)
  }

  // Fetch 2FA status
  try {
    const res = await axios.get('/api/totp')
    twoFactorEnabled.value = res.data.enabled === true
  } catch {
    twoFactorEnabled.value = false
  }

  loading.value = false
})

async function doUpdatePassword(code, isRecovery = false) {
  const requestData = { new_password: form.new_password }
  if (!noPassword.value) {
    requestData.password = form.old_password
  }
  if (code) {
    if (isRecovery) {
      requestData.recovery_code = code
    } else {
      requestData.totp_code = code
    }
  }

  const response = await axios.put('/api/password', requestData)
  if (response.status === 205) location.reload()
}

const handleUpdatePassword = async () => {
  try {
    await formRef.value.validate()

    await proceedWithPasswordUpdate()
  } catch {
    // validation error, do nothing
  }
}

async function proceedWithPasswordUpdate() {
  try {
    await doUpdatePassword()
  } catch (error) {
    handlePasswordError(error)
  }
}

async function onTotpConfirmed(code) {
  totpVerifyLoading.value = true
  try {
    await doUpdatePassword(code)
  } catch (error) {
    handlePasswordError(error)
  } finally {
    totpVerifyLoading.value = false
  }
}

async function onRecoveryConfirmed(recoveryCode) {
  totpVerifyLoading.value = true
  try {
    await doUpdatePassword(recoveryCode, true)
  } catch (error) {
    handlePasswordError(error)
  } finally {
    totpVerifyLoading.value = false
  }
}

function isTwoFactorRequired(message) {
  if (!message) return false
  const msg = message.toLowerCase()
  return msg.includes('2fa')
}

function handlePasswordError(error) {
  // 后端返回 400 且要求 2FA 验证码时，弹出 TOTP 弹窗
  if (error.response?.status === 400 && isTwoFactorRequired(error.response?.data?.detail)) {
    if (!showTotpVerify.value) {
      // 尚未尝试 TOTP 验证，显示弹窗
      showTotpVerify.value = true
      return
    }
    // 已尝试 TOTP 但验证码错误
    ElMessage.error(t('login.two_factor.message.failed'))
    return
  }

  if (error.response?.status === 401) {
    ElMessage.error(t('setting.change_password.message.failed'))
  } else if (error.response?.status === 403 && IS_DEMO) {
    ElMessage.error(t('message.error.demo'))
  } else if (error.message) {
    ElMessage.error(t('message.error.fetch') + error.message)
  }
}

const confirmClearPassword = async () => {
  try {
    const response = await axios.delete('/api/password', {
      data: { password: form.old_password },
    })

    if (response.status === 205) {
      ElMessage.success(t('setting.change_password.message.success.clear'))
      LocalStorageJson.removeItem('noPasswordPromptDisabled')
      location.reload()
    }
  } catch (error) {
    if (error.response?.status === 401) {
      ElMessage.error(t('setting.change_password.message.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const handleClearPassword = async () => {
  // 重新获取最新的 2FA 状态，避免使用过期缓存
  try {
    const res = await axios.get('/api/totp')
    twoFactorEnabled.value = res.data.enabled === true
  } catch {
    twoFactorEnabled.value = false
  }

  // 2FA 开启时不允许清除密码
  if (twoFactorEnabled.value) {
    ElMessage.warning(t('setting.change_password.clear_2fa_warning'))
    return
  }

  try {
    await formRef.value.validateField('old_password')

    ElMessageBox.confirm(t('setting.change_password.confirm.message'), t('confirm.warning'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    })
      .then(async () => {
        await confirmClearPassword()
      })
      .catch(() => {
        // empty
      })
  } catch {
    // empty
  }
}
</script>

<style scoped>
.el-input {
  width: 300px;
}

.el-form-item {
  margin-bottom: 20px;
}

.password-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  white-space: nowrap;
  overflow-x: hidden;
}

.el-button + .el-button {
  margin-left: 5px;
}
</style>
