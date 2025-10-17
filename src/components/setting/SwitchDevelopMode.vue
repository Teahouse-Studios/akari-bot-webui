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

const value1 = ref(false)
const loading = ref(false)
const showDevelopMode = ref(localStorage.getItem('showDevelopMode') === 'true' && !IS_DEMO)

onMounted(() => {
  value1.value = Boolean(localStorage.getItem('isDevelopMode'))
})

function handleSwitchChange(val) {
  loading.value = true

  setTimeout(() => {
    if (val) {
      localStorage.setItem('isDevelopMode', 'true')
    } else {
      localStorage.removeItem('isDevelopMode')
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
