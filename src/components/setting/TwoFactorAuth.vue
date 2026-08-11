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
      <div>
        <el-button type="danger" @click="showDisableDialog">
          {{ $t('setting.two_factor_auth.button.disable') }}
        </el-button>
        <el-button type="warning" @click="showResetBackupDialog">
          {{ $t('setting.two_factor_auth.button.reset_backup') }}
        </el-button>
      </div>
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

    <!-- 备用码展示弹窗 -->
    <el-dialog
      :title="$t('backup_codes.title')"
      v-model="showBackupCodes"
      width="450px"
      align-center
      :close-on-click-modal="false"
      @close="handleBackupClose"
    >
      <div class="backup-codes-content">
        <p>{{ $t('backup_codes.description') }}</p>
        <div class="codes-grid">
          <div v-for="(code, index) in backupCodes" :key="index" class="code-item">
            <code class="code-value">{{ code }}</code>
          </div>
        </div>
        <div class="backup-actions">
          <el-button @click="copyAll">
            <i class="mdi mdi-content-copy"></i>
            {{ $t('backup_codes.button.copy_all') }}
          </el-button>
          <el-button type="primary" @click="handleBackupClose">
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
      :close-on-click-modal="false"
      @close="onDisableDialogClose"
    >
      <el-form :model="disableForm" label-width="auto">
        <el-form-item :label="$t('login.input.password')">
          <el-input
            v-model="disableForm.password"
            type="password"
            :placeholder="$t('login.input.password')"
          />
        </el-form-item>

        <!-- TOTP 码输入 -->
        <el-form-item v-if="!disableUseBackup" :label="$t('setting.two_factor_auth.input.code')">
          <div class="code-input-wrapper">
            <el-input
              v-model="disableForm.code"
              :placeholder="$t('setting.two_factor_auth.input.code')"
              maxlength="6"
              minlength="6"
            />
            <span class="backup-link" @click="switchDisableToBackup">
              {{ $t('totp.button.use_backup') }}
            </span>
          </div>
        </el-form-item>

        <!-- 备用码输入 -->
        <template v-if="disableUseBackup">
          <p class="totp-desc">{{ $t('login.two_factor.backup_description') }}</p>
          <el-form-item :label="$t('login.two_factor.backup_code')">
            <el-input
              v-model="disableForm.code"
              :placeholder="$t('login.two_factor.backup_code')"
            />
          </el-form-item>
          <div class="code-input-wrapper" style="justify-content: flex-end">
            <el-button @click="switchDisableToTotp" size="small">
              {{ $t('button.back') }}
            </el-button>
          </div>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="disableDialogVisible = false">
          {{ $t('button.cancel') }}
        </el-button>
        <el-button
          type="danger"
          @click="disableTwoFactor"
          :loading="disabling"
          :disabled="!canSubmitDisable"
        >
          {{ $t('setting.two_factor_auth.button.confirm_disable') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置备用码的对话框 -->
    <el-dialog
      :title="$t('setting.two_factor_auth.reset_backup.title')"
      v-model="resetBackupDialogVisible"
      width="400px"
      align-center
      :close-on-click-modal="false"
      @close="onResetBackupDialogClose"
    >
      <el-form :model="resetBackupForm" label-width="auto">
        <el-form-item :label="$t('login.input.password')">
          <el-input
            v-model="resetBackupForm.password"
            type="password"
            :placeholder="$t('login.input.password')"
          />
        </el-form-item>

        <!-- TOTP 码输入 -->
        <el-form-item v-if="!resetUseBackup" :label="$t('setting.two_factor_auth.input.code')">
          <div class="code-input-wrapper">
            <el-input
              v-model="resetBackupForm.code"
              :placeholder="$t('setting.two_factor_auth.input.code')"
              maxlength="6"
              minlength="6"
            />
            <span class="backup-link" @click="switchResetToBackup">
              {{ $t('totp.button.use_backup') }}
            </span>
          </div>
        </el-form-item>

        <!-- 备用码输入 -->
        <template v-if="resetUseBackup">
          <p class="totp-desc">{{ $t('login.two_factor.backup_description') }}</p>
          <el-form-item :label="$t('login.two_factor.backup_code')">
            <el-input
              v-model="resetBackupForm.code"
              :placeholder="$t('login.two_factor.backup_code')"
            />
          </el-form-item>
          <div class="code-input-wrapper" style="justify-content: flex-end">
            <el-button @click="switchResetToTotp" size="small">
              {{ $t('button.back') }}
            </el-button>
          </div>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="resetBackupDialogVisible = false">
          {{ $t('button.cancel') }}
        </el-button>
        <el-button
          type="primary"
          @click="resetBackupCodes"
          :loading="resettingBackup"
          :disabled="!canSubmitResetBackup"
        >
          {{ $t('button.confirm') }}
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

// Backup codes
const showBackupCodes = ref(false)
const backupCodes = ref([])

// Reset backup codes
const resetBackupDialogVisible = ref(false)
const resetBackupForm = ref({
  password: '',
  code: '',
})
const resettingBackup = ref(false)

// Backup mode toggles
const disableUseBackup = ref(false)
const resetUseBackup = ref(false)

// Computed: whether the submit button should be enabled
const canSubmitDisable = computed(() => {
  if (!disableForm.value.password) return false
  if (disableUseBackup.value) {
    return disableForm.value.code.trim() !== ''
  }
  return disableForm.value.code.length === 6
})

const canSubmitResetBackup = computed(() => {
  if (!resetBackupForm.value.password) return false
  if (resetUseBackup.value) {
    return resetBackupForm.value.code.trim() !== ''
  }
  return resetBackupForm.value.code.length === 6
})

function copyAll() {
  const text = backupCodes.value.join('\n')
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('backup_codes.message.copied'))
  })
}

function handleBackupClose() {
  showBackupCodes.value = false
}

const pendingAction = ref(null) // 'enable' | 'disable'
const isDevelopMode = computed(() => LocalStorageJson.getItem('isDevelopMode') === 'true')

onMounted(async () => {
  await fetchStatus()
})

async function fetchStatus() {
  loading.value = true
  try {
    const response = await axios.get('/api/totp')
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
    const response = await axios.post('/api/totp/setup')
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
    const response = await axios.post('/api/totp/enable', {
      secret: secret.value,
      code: setupCode.value,
    })
    // Show backup codes if returned
    if (response.data.backup_codes && response.data.backup_codes.length > 0) {
      backupCodes.value = response.data.backup_codes
      setupDialogVisible.value = false
      showBackupCodes.value = true
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
  disableUseBackup.value = false
  disableDialogVisible.value = true
}

function switchDisableToBackup() {
  disableForm.value.code = ''
  disableUseBackup.value = true
}

function switchDisableToTotp() {
  disableForm.value.code = ''
  disableUseBackup.value = false
}

function onDisableDialogClose() {
  disableUseBackup.value = false
}

async function disableTwoFactor() {
  if (!disableForm.value.password) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  if (disableUseBackup.value && !disableForm.value.code.trim()) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  if (!disableUseBackup.value && disableForm.value.code.length !== 6) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  disabling.value = true
  try {
    const requestData = {
      password: disableForm.value.password,
    }
    if (disableUseBackup.value) {
      requestData.backup_code = disableForm.value.code
    } else {
      requestData.totp_code = disableForm.value.code
    }
    const response = await axios.post('/api/totp/disable', requestData)
    ElMessage.success(t('setting.two_factor_auth.message.disabled'))
    disableDialogVisible.value = false
    await fetchStatus()
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(t('setting.two_factor_auth.message.disable_failed'))
    }
  } finally {
    disabling.value = false
  }
}

function showResetBackupDialog() {
  resetBackupForm.value = { password: '', code: '' }
  resetUseBackup.value = false
  resetBackupDialogVisible.value = true
}

function switchResetToBackup() {
  resetBackupForm.value.code = ''
  resetUseBackup.value = true
}

function switchResetToTotp() {
  resetBackupForm.value.code = ''
  resetUseBackup.value = false
}

function onResetBackupDialogClose() {
  resetUseBackup.value = false
}

async function resetBackupCodes() {
  if (!resetBackupForm.value.password) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  if (resetUseBackup.value && !resetBackupForm.value.code.trim()) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  if (!resetUseBackup.value && resetBackupForm.value.code.length !== 6) {
    ElMessage.warning(t('setting.two_factor_auth.validate.required'))
    return
  }
  resettingBackup.value = true
  try {
    const requestData = {
      password: resetBackupForm.value.password,
    }
    if (resetUseBackup.value) {
      requestData.backup_code = resetBackupForm.value.code
    } else {
      requestData.totp_code = resetBackupForm.value.code
    }
    const response = await axios.post('/api/totp/backup-codes/reset', requestData)
    if (response.data.backup_codes && response.data.backup_codes.length > 0) {
      backupCodes.value = response.data.backup_codes
      resetBackupDialogVisible.value = false
      showBackupCodes.value = true
    }
    ElMessage.success(t('setting.two_factor_auth.message.backup_reset_success'))
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(t('setting.two_factor_auth.message.reset_backup_failed'))
    }
  } finally {
    resettingBackup.value = false
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

.backup-codes-content {
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

.code-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-link {
  color: #666;
  cursor: pointer;
  font-size: 13px;
  text-decoration: underline;
  transition: color 0.2s;
  align-self: flex-start;
}

.backup-link:hover {
  color: #333;
}

.dark .backup-link {
  color: #ccc;
}
.dark .backup-link:hover {
  color: white;
}

.totp-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px 0;
}
</style>
