<template>
  <div v-if="showDevelopMode">
    <h3><i class="mdi mdi-wrench-cog"> </i> {{ $t('setting.develop_mode.title') }}</h3>

    <div class="develop-mode-warning">
      <el-alert
        :title="$t('setting.develop_mode.alert.warning')"
        type="warning"
        show-icon
        :closable="false"
      />
    </div>
    <span class="develop-mode-label">{{ $t('setting.develop_mode.label') }}</span>
    <el-switch
      v-model="value1"
      :loading="loading"
      :before-change="beforeChange"
      @change="handleSwitchChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const value1 = ref(false)
const loading = ref(false)
const showDevelopMode = ref(LocalStorageJson.getItem('showDevelopMode') === 'true')
const canDevelop = ref(false)
let disableMessage = ''

onMounted(async () => {
  value1.value = Boolean(LocalStorageJson.getItem('isDevelopMode'))

  if (IS_DEMO) {
    canDevelop.value = false
    value1.value = false
    disableMessage = t('setting.develop_mode.message.error.demo')
  } else {
    try {
      const res = await axios.get('/api/dev')
      if (res.data?.is_dev === true) {
        canDevelop.value = true
      } else {
        canDevelop.value = false
        value1.value = false
        disableMessage = t('setting.develop_mode.message.error.disabled')
      }
    } catch {
      canDevelop.value = false
      value1.value = false
      disableMessage = t('setting.develop_mode.message.error')
    }
  }
})

function beforeChange() {
  if (!canDevelop.value) {
    loading.value = true
    return new Promise((_, reject) => {
      setTimeout(() => {
        loading.value = false
        ElMessage.error(disableMessage)
        reject(new Error(disableMessage))
      }, 300)
    })
  }
  return true
}

function handleSwitchChange(val) {
  loading.value = true
  setTimeout(() => {
    if (val) {
      LocalStorageJson.setItem('isDevelopMode', 'true')
    } else {
      LocalStorageJson.removeItem('isDevelopMode')
    }
    loading.value = false
    location.reload()
  }, 300)
}
</script>

<style scoped>
.develop-mode-label {
  margin-right: 12px;
  cursor: default;
}

.develop-mode-warning {
  margin-bottom: 12px;
}
</style>
