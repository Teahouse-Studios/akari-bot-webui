<template>
  <div v-if="!showRecoveryInput" class="totp-input-container">
    <span class="totp-title">{{ $t('login.two_factor.title') }}</span>
    <p class="totp-desc">{{ $t('login.two_factor.description') }}</p>
    <el-input
      v-model="code"
      :placeholder="$t('setting.two_factor_auth.input.code')"
      maxlength="6"
      minlength="6"
      @keyup.enter="handleConfirm"
    />
    <span class="recovery-link" @click="handleRecoveryClick">
      {{ $t('totp.button.use_recovery') }}
    </span>
    <div>
      <el-button @click="$emit('cancel')" :disabled="loading">
        {{ $t('button.cancel') }}
      </el-button>
      <el-button
        type="primary"
        @click="handleConfirm"
        :loading="loading"
        :disabled="code.length !== 6"
      >
        {{ $t('button.confirm') }}
      </el-button>
    </div>
  </div>

  <div v-else class="totp-input-container">
    <span class="totp-title">{{ $t('login.two_factor.recovery_title') }}</span>
    <p class="totp-desc">{{ $t('login.two_factor.recovery_description') }}</p>
    <el-input
      v-model="recoveryCode"
      :placeholder="$t('login.two_factor.recovery_code')"
      @keyup.enter="handleRecoveryVerify"
    />
    <div>
      <el-button @click="handleRecoveryBack" :disabled="recoveryLoading">
        {{ $t('totp.button.back') }}
      </el-button>
      <el-button
        type="primary"
        @click="handleRecoveryVerify"
        :loading="recoveryLoading"
        :disabled="!recoveryCode.trim()"
      >
        {{ $t('button.confirm') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/axios.mjs'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel', 'recovery-success'])

const code = ref('')
const showRecoveryInput = ref(false)
const recoveryCode = ref('')
const recoveryLoading = ref(false)

function handleConfirm() {
  if (code.value.length !== 6) return
  emit('confirm', code.value)
}

function handleRecoveryClick() {
  showRecoveryInput.value = true
}

function handleRecoveryBack() {
  showRecoveryInput.value = false
  recoveryCode.value = ''
}

async function handleRecoveryVerify() {
  if (!recoveryCode.value.trim()) return
  recoveryLoading.value = true
  try {
    const response = await axios.post('/api/2fa/disable', {
      recovery_code: recoveryCode.value.trim(),
    })
    ElMessage.success(t('login.two_factor.message.recovery_success'))
    emit('recovery-success')
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error(t('login.two_factor.message.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + (error.message || ''))
    }
  } finally {
    recoveryLoading.value = false
  }
}

function reset() {
  code.value = ''
  showRecoveryInput.value = false
  recoveryCode.value = ''
}

defineExpose({ reset })
</script>

<style scoped>
.totp-input-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 300px;
}

.totp-title {
  font-size: 16px;
  font-weight: 600;
}

.totp-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.recovery-link {
  color: #666;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.2s;
}

.recovery-link:hover {
  color: #333;
}

.dark .recovery-link {
  color: #ccc;
}
.dark .recovery-link:hover {
  color: white;
}

.code-input {
  width: 150px;
  margin-bottom: 20px;
}
</style>
