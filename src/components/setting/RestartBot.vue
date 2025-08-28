<template>
  <div>
    <h3><i class="mdi mdi-restart"></i> {{ $t('setting.restart_bot.title') }}</h3>
    <el-button type="danger" @click="handleRestart">
      {{ $t('setting.restart_bot.button.restart') }}
    </el-button>
  </div>
</template>

<script>
import axios from '@/axios.mjs'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default {
  name: 'restartBotButton',
  data() {
    const { t } = useI18n()
    return {
      t,
      pollingTimeout: 60000,
      pollingInterval: 2000,
      hasShownTimeoutError: false,
    }
  },
  methods: {
    async handleRestart() {
      try {
        await ElMessageBox.confirm(this.t('confirm.message'), this.t('confirm.warning'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        })
        await this.restartBot()
      } catch (error) {
        return
      }
    },
    async restartBot() {
      try {
        const response = await axios.post('/api/restart', {})
        if (response.status === 202) {
          ElLoading.service({
            fullscreen: true,
            text: this.t('setting.restart_bot.loading.text'),
          })

          const startTime = Date.now()
          const poll = async () => {
            try {
              const res = await axios.get('/api')
              if (res.status === 200) {
                window.location.href = '/'
              } else {
                throw new Error('Not ready')
              }
            } catch (err) {
              const elapsed = Date.now() - startTime
              if (elapsed >= this.pollingTimeout && !this.hasShownTimeoutError) {
                this.hasShownTimeoutError = true
                ElMessage({
                  message: this.t('setting.restart_bot.message.failed'),
                  type: 'error',
                  duration: 0,
                })
              }
              setTimeout(poll, this.pollingInterval)
            }
          }

          this.hasShownTimeoutError = false
          setTimeout(poll, this.pollingInterval)
        }
      } catch (error) {
        ElMessage.error(this.t('message.error.fetch') + error.message)
      }
    },
  },
}
</script>
