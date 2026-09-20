import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'

/** 状态接口限流 6/分钟且服务端缓存 5 秒，参考 .yoyaku.md 建议 30–60 秒轮询 */
const REFRESH_INTERVAL = 30000

/** 速率采样历史的保留长度（每 30 秒一个点，40 点约 20 分钟） */
const RATE_HISTORY_LIMIT = 40

/**
 * 服务器状态：`/api/server-info` 的取数与降级处理。
 *
 * 只暴露会持续变化的数据：运行时长、命令/消息累计量与速率、CPU / 内存 / 磁盘、进程占用。
 * 版本号、Python 版本、CPU 型号、系统信息、WebRender 状态等「长时间不会更新」的静态字段
 * 属于后端契约的一部分，但仪表盘不再展示；`bot.jobqueue_backend` 仅用于离线判定，也不外传。
 *
 * 服务端离线时 `bot.command_parsed` / `bot.message_parsed` 为 null，
 * `processes` 退化为 `{ items: [], failures: [], error: 'unavailable' }`，
 * 本地 CPU / 内存 / 磁盘数据仍然有效。
 */
export function useServerInfo() {
  const { t } = useI18n()

  const loading = ref(false)
  /** 首次加载完成后，30 秒轮询不再触发遮罩 */
  const loaded = ref(false)
  const lastUpdateTime = ref(Math.floor(Date.now() / 1000))

  const bot = reactive({})
  const cpu = reactive({})
  const memory = reactive({})
  const disk = reactive({})
  const processes = reactive({ items: [], failures: [], error: null })

  const commandRate = ref(null)
  const messageRate = ref(null)
  /** 速率采样序列（仅保留最近 RATE_HISTORY_LIMIT 次），供主页迷你折线使用 */
  const commandRateHistory = ref([])
  const messageRateHistory = ref([])
  const runningSeconds = ref(0)

  const abortController = new AbortController()
  let runningTimer = null
  let refreshTimer = null
  let previousSample = null

  const serverOffline = computed(
    () => bot.jobqueue_backend === null && processes.error === 'unavailable',
  )

  /** 只有首屏才给卡片加 loading 遮罩，轮询时保持画面稳定 */
  const initialLoading = computed(() => loading.value && !loaded.value)

  function resetRates() {
    previousSample = null
    commandRate.value = null
    messageRate.value = null
    commandRateHistory.value = []
    messageRateHistory.value = []
  }

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
      resetRates()
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

      commandRateHistory.value = [...commandRateHistory.value, commandRate.value].slice(
        -RATE_HISTORY_LIMIT,
      )
      messageRateHistory.value = [...messageRateHistory.value, messageRate.value].slice(
        -RATE_HISTORY_LIMIT,
      )
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

      Object.assign(bot, data.bot)
      Object.assign(cpu, data.cpu)
      Object.assign(memory, data.memory)
      Object.assign(disk, data.disk)
      Object.assign(processes, data.processes || { items: [], failures: [], error: null })
      if (!Array.isArray(processes.items)) processes.items = []
      if (!Array.isArray(processes.failures)) processes.failures = []

      updateRates()
      startRunningTimer()
      loaded.value = true
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
        resetRates()
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
    initialLoading,
    lastUpdateTime,
    bot,
    cpu,
    memory,
    disk,
    processes,
    commandRate,
    messageRate,
    commandRateHistory,
    messageRateHistory,
    runningSeconds,
    serverOffline,
    fetchServerInfo,
  }
}
