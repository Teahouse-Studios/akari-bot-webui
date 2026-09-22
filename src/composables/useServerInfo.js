import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'

/** 状态接口限流 6/分钟且服务端缓存 5 秒，参考 .yoyaku.md 建议 30–60 秒轮询 */
const REFRESH_INTERVAL = 30000

/**
 * 服务器状态：`/api/server-info` 的取数与降级处理。
 *
 * 动态数据（运行时长、命令/消息累计量、CPU / 内存 / 磁盘、进程占用）与静态数据
 * （版本号、Python 版本、JobQueue 后端、WebRender 状态、CPU 型号、系统信息）都对外暴露。
 *
 * 服务端离线时 `bot.command_parsed` / `bot.message_parsed` 为 null，
 * `processes` 退化为 `{ items: [], failures: [], error: 'unavailable' }`，
 * 本地 CPU / 内存 / 磁盘数据仍然有效。
 */
export function useServerInfo() {
  const { t } = useI18n()

  const loading = ref(false)
  const lastUpdateTime = ref(Math.floor(Date.now() / 1000))

  const os = reactive({})
  const bot = reactive({})
  const cpu = reactive({})
  const memory = reactive({})
  const disk = reactive({})
  const processes = reactive({ items: [], failures: [], error: null })

  const runningSeconds = ref(0)

  const abortController = new AbortController()
  let runningTimer = null
  let refreshTimer = null

  const serverOffline = computed(
    () => bot.jobqueue_backend === null && processes.error === 'unavailable',
  )

  function updateRunningSeconds() {
    const now = Math.floor(Date.now() / 1000)
    const start = bot.started_time || 0

    if (start > 0) {
      runningSeconds.value = Math.max(0, now - start)
    }
  }

  function startRunningTimer() {
    if (runningTimer) clearInterval(runningTimer)

    if (bot.started_time && bot.started_time > 0) {
      updateRunningSeconds()
      runningTimer = setInterval(updateRunningSeconds, 1000)
    }
  }

  function stopRunningTimer() {
    if (runningTimer) {
      clearInterval(runningTimer)
      runningTimer = null
    }
  }

  async function fetchServerInfo(noCache = false) {
    if (loading.value) return
    loading.value = true

    const headers = {}
    if (noCache) {
      Object.assign(headers, {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      })
    }

    try {
      const response = await axios.get('/api/server-info', {
        headers,
        signal: abortController.signal,
      })
      const data = response.data

      Object.assign(os, data.os)
      Object.assign(bot, data.bot)
      Object.assign(cpu, data.cpu)
      Object.assign(memory, data.memory)
      Object.assign(disk, data.disk)
      Object.assign(processes, data.processes || { items: [], failures: [], error: null })
      if (!Array.isArray(processes.items)) processes.items = []
      if (!Array.isArray(processes.failures)) processes.failures = []

      startRunningTimer()
      lastUpdateTime.value = Math.floor(Date.now() / 1000)
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled')
      } else {
        ElMessage.error(t('message.error.fetch') + error.message)
        stopRunningTimer()
        bot.start_time = 0
        bot.started_time = 0
        runningSeconds.value = 0
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchServerInfo()
    refreshTimer = setInterval(() => {
      fetchServerInfo(true)
    }, REFRESH_INTERVAL)
  })

  onBeforeUnmount(() => {
    if (refreshTimer) clearInterval(refreshTimer)
    stopRunningTimer()
    abortController.abort()
  })

  return {
    loading,
    lastUpdateTime,
    os,
    bot,
    cpu,
    memory,
    disk,
    processes,
    runningSeconds,
    serverOffline,
    fetchServerInfo,
  }
}
