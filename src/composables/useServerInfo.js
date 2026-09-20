import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'

/** 状态接口限流 6/分钟且服务端缓存 5 秒，参考 .yoyaku.md 建议 30–60 秒轮询 */
const REFRESH_INTERVAL = 30000

/**
 * 服务器状态：`/api/server-info` 的取数与降级处理。
 *
 * 服务端离线时 `bot.jobqueue_backend` / `bot.command_parsed` / `bot.message_parsed` 为 null，
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

  const commandRate = ref(null)
  const messageRate = ref(null)
  const runningSeconds = ref(0)

  const abortController = new AbortController()
  let runningTimer = null
  let refreshTimer = null
  let previousSample = null

  const serverOffline = computed(
    () => bot.jobqueue_backend === null && processes.error === 'unavailable',
  )

  const processTotalMemory = computed(() =>
    processes.items.reduce((sum, item) => sum + (Number(item.memory) || 0), 0),
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

  /** 累计值取自服务端进程，速率只能用两次采样的差值计算 */
  function updateRates() {
    if (typeof bot.command_parsed !== 'number' || typeof bot.message_parsed !== 'number') {
      previousSample = null
      commandRate.value = null
      messageRate.value = null
      return
    }

    const now = Date.now()
    const current = {
      time: now,
      commandParsed: bot.command_parsed,
      messageParsed: bot.message_parsed,
    }

    if (previousSample && now > previousSample.time) {
      const minutes = (now - previousSample.time) / 60000
      commandRate.value =
        Math.round(((current.commandParsed - previousSample.commandParsed) / minutes) * 10) / 10
      messageRate.value =
        Math.round(((current.messageParsed - previousSample.messageParsed) / minutes) * 10) / 10
    }

    previousSample = current
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

      updateRates()
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
        previousSample = null
        commandRate.value = null
        messageRate.value = null
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
    commandRate,
    messageRate,
    runningSeconds,
    serverOffline,
    processTotalMemory,
    fetchServerInfo,
  }
}
