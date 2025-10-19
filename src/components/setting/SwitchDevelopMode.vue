<template>
  <div v-if="showDevelopMode">
    <h3><i class="mdi mdi-wrench-cog"> </i> {{ $t('setting.develop_mode.title') }}</h3>
    <span class="develop-mode-label">{{ $t('setting.develop_mode.label') }}</span>
    <el-switch v-model="value1" :loading="loading" @change="handleSwitchChange" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'

const value1 = ref(false)
const loading = ref(false)
const showDevelopMode = ref(LocalStorageJson.getItem('showDevelopMode') === 'true' && !IS_DEMO)

onMounted(() => {
  value1.value = Boolean(LocalStorageJson.getItem('isDevelopMode'))
})

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
</style>
