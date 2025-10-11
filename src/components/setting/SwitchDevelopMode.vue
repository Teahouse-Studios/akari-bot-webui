<template>
  <div v-if="showDevelopMode">
    <h3><i class="mdi mdi-wrench-cog"> </i> {{ $t('setting.develop_mode.title') }}</h3>
    <span class="develop-mode-label">{{ $t('setting.develop_mode.label') }}</span>
    <el-switch v-model="value1" :loading="loading" @change="handleSwitchChange" />
  </div>
</template>

<script>
import { IS_DEMO } from '@/const'

export default {
  name: 'SwitchDevelopMode',
  data() {
    return {
      value1: false,
      loading: false,
      showDevelopMode: localStorage.getItem('showDevelopMode') === 'true' && !IS_DEMO,
    }
  },
  mounted() {
    this.value1 = Boolean(localStorage.getItem('isDevelopMode'))
  },
  methods: {
    handleSwitchChange(val) {
      this.loading = true

      setTimeout(() => {
        if (val) {
          localStorage.setItem('isDevelopMode', 'true')
        } else {
          localStorage.removeItem('isDevelopMode')
        }
        this.loading = false
        location.reload()
      }, 300)
    },
  },
}
</script>

<style scoped>
.develop-mode-label {
  margin-right: 12px;
  cursor: default;
}
</style>
