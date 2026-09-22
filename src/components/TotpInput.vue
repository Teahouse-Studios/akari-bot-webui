<template>
  <div v-if="!showBackupInput" class="totp-input-container">
    <span class="totp-title">{{ $t('login.two_factor.title') }}</span>
    <p class="totp-desc">{{ $t('login.two_factor.description') }}</p>
    <el-input
      v-model="filteredCode"
      :placeholder="$t('setting.two_factor_auth.input.code')"
      maxlength="6"
      minlength="6"
      inputmode="numeric"
      pattern="[0-9]*"
      autocomplete="one-time-code"
      @keyup.enter="handleConfirm"
    />
    <span class="backup-link" @click="handleBackupClick">
      {{ $t('totp.button.use_backup') }}
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
    <span class="totp-title">{{ $t('login.two_factor.backup_title') }}</span>
    <p class="totp-desc">{{ $t('login.two_factor.backup_description') }}</p>
    <el-input
      v-model="backupCode"
      :placeholder="$t('login.two_factor.backup_code')"
      @keyup.enter="handleBackupVerify"
    />
    <div>
      <el-button @click="handleBackupBack" :disabled="loading">
        {{ $t('button.back') }}
      </el-button>
      <el-button
        type="primary"
        @click="handleBackupVerify"
        :loading="loading"
        :disabled="!backupCode.trim()"
      >
        {{ $t('button.confirm') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel', 'backup-verify', 'backup-success'])

const code = ref('')
const showBackupInput = ref(false)
const backupCode = ref('')

const filteredCode = computed({
  get: () => code.value,
  set: (value) => {
    code.value = (value ?? '').replace(/\D/g, '').slice(0, 6)
  },
})

function handleConfirm() {
  if (code.value.length !== 6) return
  emit('confirm', code.value)
}

function handleBackupClick() {
  showBackupInput.value = true
}

function handleBackupBack() {
  showBackupInput.value = false
  backupCode.value = ''
}

async function handleBackupVerify() {
  if (!backupCode.value.trim()) return
  emit('backup-verify', backupCode.value.trim())
}

function reset() {
  code.value = ''
  showBackupInput.value = false
  backupCode.value = ''
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
  color: var(--el-text-color-secondary);
  margin: 0;
}

.backup-link {
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.2s;
}

.backup-link:hover {
  color: var(--el-text-color-primary);
}

.code-input {
  width: 150px;
  margin-bottom: 20px;
}
</style>
