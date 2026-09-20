import { ElMessage } from 'element-plus'
import { debounce } from 'lodash'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from '@/const'
import { DEFAULT_ACTIVE_LOG_LEVELS, LOG_LEVELS, parseLogData } from '@/utils/logFormat.js'

/**
 * 日志流：负责与 `/ws/logs`（或 demo 模式的 mock）通信，并维护解析后的可见日志。
 * 视图层只负责渲染 `visibleLogs` 与滚动行为。
 */
export function useLogStream() {
  const { t } = useI18n()

  const logData = ref('')
  const visibleLogs = ref([])
  const logLevels = LOG_LEVELS
  const activeLogLevels = ref([...DEFAULT_ACTIVE_LOG_LEVELS])
  const searchText = ref('')
  const autoScroll = ref(true)
  const websocket = ref(null)
  const abortController = new AbortController()

  const updateLogs = debounce(() => {
    visibleLogs.value = parseLogData(logData.value, {
      searchText: searchText.value,
      activeLogLevels: activeLogLevels.value,
    })
  }, 500)

  watch(logData, updateLogs)

  async function connectWebSocket() {
    if (IS_DEMO) {
      const mockLogWebSocket = (await import('@/mock/log_ws.js')).default
      websocket.value = mockLogWebSocket((event) => {
        logData.value += `${event.data}\n`
      })
      return
    }

    // TODO config store
    let config = {}
    try {
      const response = await fetch('/api/init')
      if (response.ok) config = await response.json()
    } catch {
      // empty
    }

    const enableHTTPS = config.enable_https ?? window.location.protocol === 'https:'
    let baseUrl = config.api_url || window.location.origin
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = (enableHTTPS ? 'https://' : 'http://') + baseUrl
    }

    try {
      const url = new URL(baseUrl)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${url.hostname}${url.port ? `:${url.port}` : ''}/ws/logs`

      websocket.value = new WebSocket(wsUrl)
      websocket.value.onmessage = (event) => {
        logData.value += `${event.data}\n`
      }
      websocket.value.onerror = () => {
        ElMessage.error(t('message.error.connect.server'))
      }
    } catch (e) {
      ElMessage.error(t('message.error.connect') + e.message)
    }
  }

  function closeWebSocket() {
    if (websocket.value && typeof websocket.value.close === 'function') {
      websocket.value.close()
    }
    websocket.value = null
  }

  function refreshLog() {
    logData.value = ''
    visibleLogs.value = []
    closeWebSocket()
    connectWebSocket()
  }

  function toggleLogLevel(level) {
    if (activeLogLevels.value.includes(level)) {
      activeLogLevels.value = activeLogLevels.value.filter((item) => item !== level)
    } else {
      activeLogLevels.value = [...activeLogLevels.value, level]
    }
    updateLogs()
  }

  function handleSearch() {
    updateLogs()
  }

  onMounted(() => {
    connectWebSocket()
  })

  onBeforeUnmount(() => {
    closeWebSocket()
    abortController.abort()
    updateLogs.cancel()
  })

  return {
    logData,
    visibleLogs,
    logLevels,
    activeLogLevels,
    searchText,
    autoScroll,
    refreshLog,
    toggleLogLevel,
    handleSearch,
  }
}
