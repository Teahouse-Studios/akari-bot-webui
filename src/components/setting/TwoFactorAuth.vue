<template>
  <div v-if="hasPassword" v-loading="loading">
    <h3><i class="mdi mdi-shield-key"></i> {{ $t('setting.two_factor_auth.title') }}</h3>

    <!-- 未启用状态 -->
    <div v-if="!enabled">
      <p class="status-text">{{ $t('setting.two_factor_auth.status.disabled') }}</p>
      <el-button type="primary" @click="startSetup">
        {{ $t('setting.two_factor_auth.button.enable') }}
      </el-button>
    </div>

    <!-- 已启用状态 -->
    <div v-if="enabled">
      <p class="status-text enabled-text">
        <i class="mdi mdi-check-circle"></i>
        {{ $t('setting.two_factor_auth.status.enabled') }}
      </p>
      <el-button type="danger" @click="showDisableDialog">
        {{ $t('setting.two_factor_auth.button.disable') }}
      </el-button>
    </div>

    <!-- 设置两步验证的向导弹窗 -->
    <el-dialog
      :title="$t('setting.two_factor_auth.setup.title')"
      v-model="setupDialogVisible"
      width="400px"
      align-center
      :close-on-click-modal="false"
      @close="cancelSetup"
    >
      <div class="setup-section">
        <el-alert
          :title="$t('setting.two_factor_auth.setup.alert')"
          type="warning"
          show-icon
          :closable="false"
          class="setup-alert"
        />
        <p>{{ $t('setting.two_factor_auth.setup.scan_qr') }}</p>
        <div class="qr-section">
          <img
            v-if="qrUri"
            :src="
              'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
              encodeURIComponent(qrUri)
            "
            alt="2FA QR Code"
            class="qr-image"
          />
          <div class="secret-section">
            <p class="secret-label">{{ $t('setting.two_factor_auth.setup.secret_label') }}</p>
            <div class="secret-row">
              <code class="secret-code">{{ secret }}</code>
              <el-button size="small" @click="copySecret">
                <i class="mdi mdi-content-copy"></i>
                {{ $t('button.copy') }}
              </el-button>
            </div>
          </div>
        </div>
        <div class="verify-section">
          <p>{{ $t('setting.two_factor_auth.setup.enter_code') }}</p>
          <el-input
            v-model="setupCode"
            :placeholder="$t('setting.two_factor_auth.input.code')"
            maxlength="6"
            minlength="6"
            class="code-input"
            @keyup.enter="enableTwoFactor"
          />
          <div class="setup-buttons">
            <el-button @click="cancelSetup">
              {{ $t('button.cancel') }}
            </el-button>
            <el-button
              type="primary"
              @click="enableTwoFactor"
              :loading="enabling"
              :disabled="setupCode.length !== 6"
            >
              {{ $t('setting.two_factor_auth.button.verify_enable') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 恢复码展示弹窗 -->
    <el-dialog
      :title="$t('recovery_codes.title')"
      v-model="showRecoveryCodes"
      width="450px"
      align-center
      :close-on-click-modal="false"
      @close="handleRecoveryClose"
    >
      <div class="recovery-codes-content">
        <p>{{ $t('recovery_codes.description') }}</p>
        <div class="codes-grid">
          <div v-for="(code, index) in recoveryCodes" :key="index" class="code-item">
            <code class="code-value">{{ code }}</code>
          </div>
        </div>
        <div class="recovery-actions">
          <el-button @click="copyAll">
            <i class="mdi mdi-content-copy"></i>
            {{ $t('recovery_codes.button.copy_all') }}
          </el-button>
          <el-button type="primary" @click="handleRecoveryClose">
            {{ $t('button.confirm') }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 禁用2FA的对话框 -->
    <el-dialog
      :title="$t('setting.two_factor_auth.disable.title')"
      v-model="disableDialogVisible"
      width="400px"
      align-center
    >
      <el-form :model="disableForm" label-width="auto">
        <el-form-item :label="$t('setting.change_password.input.old_password')">
          <el-input
            v-model="disableForm.password"
            type="password"
            :placeholder="$t('login.input.password')"
          />
        </el-form-item>
        <el-form-item :label="$t('setting.two_factor_auth.input.code')">
          <el-input
            v-model="disableForm.code"
            :placeholder="$t('setting.two_factor_auth.input.code')"
            maxlength="6"
            minlength="6"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disableDialogVisible = false">
          {{ $t('button.cancel') }}
        </el-button>
        <el-button type="danger" @click="disableTwoFactor" :loading="disabling">
          {{ $t('setting.two_factor_auth.button.confirm_disable') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from '@/axios.mjs'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'

const { t } = useI18n()

const props = defineProps({
  hasPassword: {
    type: Boolean,
    default: true,
  },
})

const loading = ref(true)
const enabled = ref(false)
const setupDialogVisible = ref(false)
const enabling = ref(false)
const disabling = ref(false)

const secret = ref('')
const qrUri = ref('')
const setupCode = ref('')

const disableDialogVisible = ref(false)
const disableForm = ref({
  password: '',
  code: '',
})

// Recovery codes
const showRecoveryCodes = ref(false)
const recoveryCodes = ref([])

function copyAll() {
  const text = recoveryCodes.value.join('\n')
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('recovery_codes.message.copied'))
  })
}

function handleRecoveryClose() {
  showRecoveryCodes.value = false
}

const pendingAction = ref(null) // 'enable' | 'disable'
const isDevelopMode = computed(() => LocalStorageJson.getItem('isDevelopMode') === 'true')

onMounted(async () => {
  await fetchStatus()
})

async function fetchStatus() {
  loading.value = true
  try {
    const response = await axios.get('/api/2fa/status')
    enabled.value = response.data.enabled === true
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + (error.message || ''))
  } finally {
    loading.value = false
  }
}

async function startSetup() {
  if (IS_DEMO) {
    ElMessage.error(t('message.error.demo'))
    return
  }
  await doStartSetup()
}

async function doStartSetup() {
  try {
    const response = await axios.post('/api/2fa/setup')
    secret.value = response.data.secret
    qrUri.value = response.data.uri
    setupCode.value = ''
    setupDialogVisible.value = true
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + (error.message || ''))
  }
}

async function enableTwoFactor() {
  if (setupCode.value.length !== 6) return
  enabling.value = true
  try {
    const response = await axios.post('/api/2fa/enable', {
      secret: secret.value,
      code: setupCode.value,
    })
    // Show recovery codes if returned
    if (response.data.recovery_codes && response.data.recovery_codes.length > 0) {
      recoveryCodes.value = response.data.recovery_codes
      setupDialogVisible.value = false
      showRecoveryCodes.value = true
    } else {
      ElMessage.success(response.data.message || t('setting.two_factor_auth.message.enabled'))
    }
    secret.value = ''
    qrUri.value = ''
    setupCode.value = ''
    await fetchStatus()
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(
        error.response?.data?.message || t('setting.two_factor_auth.message.verify_failed'),
      )
    }
  } finally {
    enabling.value = false
  }
}

function cancelSetup() {
  setupDialogVisible.value = false
  secret.value = ''
  qrUri.value = ''
  setupCode.value = ''
}

function copySecret() {
  navigator.clipboard.writeText(secret.value).then(() => {
    ElMessage.success(t('setting.two_factor_auth.message.secret_copied'))
  })
}

function showDisableDialog() {
  disableForm.value = { password: '', code: '' }
  disableDialogVisible.value = true
}

async function disableTwoFactor() {
  if (!disableForm.value.password || !disableForm.value.code) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  disabling.value = true
  try {
    const response = await axios.post('/api/2fa/disable', {
      password: disableForm.value.password,
      code: disableForm.value.code,
    })
    ElMessage.success(response.data.message || t('setting.two_factor_auth.message.disabled'))
    disableDialogVisible.value = false
    await fetchStatus()
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(
        error.response?.data?.message || t('setting.two_factor_auth.message.disable_failed'),
      )
    }
  } finally {
    disabling.value = false
  }
}
</script>

<style scoped>
.status-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.enabled-text {
  color: #67c23a;
}

.enabled-text i {
  margin-right: 4px;
}

.setup-section {
  max-width: 400px;
}

.setup-alert {
  margin-bottom: 16px;
}

.qr-section {
  text-align: center;
  margin-bottom: 16px;
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}

.secret-section {
  margin-top: 12px;
  text-align: left;
}

.secret-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.secret-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.secret-code {
  font-size: 14px;
  font-family: 'Noto Sans Mono', 'Courier New', Courier, monospace;
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 4px;
  word-break: break-all;
  flex: 1;
}

.dark .secret-code {
  background: #4a4a4a;
  color: #e0e0e0;
}

.verify-section {
  margin-top: 12px;
}

.verify-section p {
  margin-bottom: 8px;
  font-size: 14px;
}

.code-input {
  width: 150px;
  margin-bottom: 20px;
}

.recovery-codes-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.codes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 16px;
}

.dark .codes-grid {
  background: #4a4a4a;
}

.code-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.code-index {
  font-size: 13px;
  color: #909399;
  min-width: 20px;
}

.code-value {
  font-size: 14px;
  font-family: 'Noto Sans Mono', 'Courier New', Courier, monospace;
  color: #303133;
}

.dark .code-value {
  color: #e0e0e0;
}
</style>
