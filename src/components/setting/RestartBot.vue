<template>
  <div>
    <h3><i class="mdi mdi-restart"></i> {{ $t('setting.restart_bot.title') }}</h3>
    <el-button type="danger" @click="handleRestart">
      {{ $t('setting.restart_bot.button.restart') }}
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/axios.mjs'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const pollingTimeout = 60000
const pollingInterval = 2000
const hasShownTimeoutError = ref(false)

const handleRestart = async () => {
  try {
    await ElMessageBox.confirm(t('confirm.message'), t('confirm.warning'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    })
    await restartBot()
  } catch (error) {
    return
  }
}

const restartBot = async () => {
  try {
    const response = await axios.post('/api/restart', {})
    if (response.status === 202) {
      const loadingInstance = ElLoading.service({
        fullscreen: true,
        text: t('setting.restart_bot.loading.text'),
      })

      const startTime = Date.now()

      const poll = async () => {
        try {
          const res = await axios.get('/api')
          if (res.status === 200) {
            loadingInstance.close()
            window.location.href = '/'
          } else {
            throw new Error('Not ready')
          }
        } catch (err) {
          const elapsed = Date.now() - startTime
          if (elapsed >= pollingTimeout && !hasShownTimeoutError.value) {
            hasShownTimeoutError.value = true
            ElMessage({
              message: t('setting.restart_bot.message.failed'),
              type: 'error',
              duration: 0,
            })
            loadingInstance.close()
          } else {
            setTimeout(poll, pollingInterval)
          }
        }
      }

      hasShownTimeoutError.value = false
      setTimeout(poll, pollingInterval)
    }
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + error.message)
  }
}
</script>
