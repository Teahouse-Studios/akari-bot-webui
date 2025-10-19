<template>
  <div class="log-viewer-container">
    <div class="filter-container">
      <div class="filter-top-row">
        <div class="left-controls">
          <el-input
            v-model="searchText"
            :placeholder="$t('logs.input.search')"
            class="log-search-input"
            @input="handleSearch"
            clearable
          >
            <template #prefix>
              <i class="mdi mdi-magnify"></i>
            </template>
          </el-input>
        </div>
        <div class="right-controls">
          <el-tooltip :content="$t('logs.button.refresh')" placement="bottom">
            <el-button class="log-refresh-button" @click="refreshLog" circle>
              <i class="mdi mdi-refresh"></i>
            </el-button>
          </el-tooltip>
          <el-switch v-model="autoScroll" />
          <span class="auto-scroll-label">{{ $t('logs.switch.auto_scroll') }}</span>
        </div>
      </div>

      <div class="filter-bottom-row">
        <el-button
          v-for="(level, index) in logLevels"
          :key="index"
          :class="[
            'log-level-button',
            level.toLowerCase(),
            { active: activeLogLevels.includes(level) },
          ]"
          @click="toggleLogLevel(level)"
        >
          {{ level }}
        </el-button>
      </div>
    </div>

    <div class="log-viewer" ref="logViewer">
      <div v-for="(logLine, index) in visibleLogs" :key="index">
        <span v-for="(part, partIndex) in logLine" :key="partIndex" :style="part.style">
          {{ part.text }}
        </span>
      </div>

      <div v-if="visibleLogs.length === 0" class="log-viewer-placeholder">
        There are currently no matching logs here...<br />
        Use the filter box above to adjust the options.
      </div>
    </div>
  </div>
</template>

<script setup>
// import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const logData = ref('')
const visibleLogs = ref([])
const logViewer = ref(null)
const logLevels = ['DEBUG', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']
const activeLogLevels = ref(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL'])
const searchText = ref('')
const websocket = ref(null)
const abortController = new AbortController()
const autoScroll = ref(true)

function authenticateToken() {
  // async authenticateToken() {
  // TODO 需要重新验证?
  // try {
  //   const response = await axios.get('/api/verify-token', {
  //     signal: abortController.signal,
  //   })
  //
  //   if (response.status === 200) {
  connectWebSocket()
  //   } else {
  //     ElMessage.error(t('message.error.connect.auth'))
  //   }
  // } catch (error) {
  //   if (axios.isCancel(error)) {
  //     console.log('Request canceled')
  //   } else {
  //     ElMessage.error(t('message.error.fetch') + error.message)
  //   }
  // }
}

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
  } catch (e) {
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

function formatLogLine(line) {
  const logPattern = /^\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]:(.*)$/s
  const match = line.match(logPattern)

  const logPlatformColor = '#11a8cd'
  const logModulesColor = '#e5e510'
  const logDatetimeColor = '#0dbc79'
  let logContentColor = '#fff'
  let logBackgroundColor = 'transparent'

  if (match) {
    const [, logPlatform, logModules, logDatetime, logLevel, logContent] = match

    switch (logLevel) {
      case 'DEBUG':
        logContentColor = '#3b8ec9'
        break
      case 'INFO':
        logContentColor = '#ffffff'
        break
      case 'SUCCESS':
        logContentColor = '#23d18b'
        break
      case 'WARNING':
        logContentColor = '#f5f543'
        break
      case 'ERROR':
        logContentColor = '#f14c4c'
        break
      case 'CRITICAL':
        logContentColor = '#ffffff'
        logBackgroundColor = '#cd3131'
        break
      default:
        logContentColor = '#ffffff'
        break
    }

    return [
      { text: `[${logPlatform}]`, style: { color: logPlatformColor } },
      { text: `[${logModules}]`, style: { color: logModulesColor } },
      { text: `[${logDatetime}]`, style: { color: logDatetimeColor } },
      {
        text: `[${logLevel}]:${logContent}`,
        style: { color: logContentColor, backgroundColor: logBackgroundColor },
      },
    ]
  }

  return [{ text: line, style: { color: '#fff' } }]
}

const updateLogs = debounce(() => {
  const rawLines = logData.value.split('\n')
  let buffer = ''
  const formattedLines = []

  rawLines.forEach((line) => {
    if (/^\[.*?\]\[.*?\]\[.*?\]\[.*?\]:/.test(line)) {
      if (buffer) formattedLines.push(formatLogLine(buffer))
      buffer = line
    } else {
      buffer += `\n${line}`
    }
  })

  if (buffer) formattedLines.push(formatLogLine(buffer))

  visibleLogs.value = formattedLines.filter((logLine) => {
    const textMatch = searchText.value
      ? logLine.some((part) => part.text.toLowerCase().includes(searchText.value.toLowerCase()))
      : true

    return (
      textMatch &&
      activeLogLevels.value.some((level) => logLine.some((part) => part.text.includes(level)))
    )
  })

  if (visibleLogs.value.length > 16384) {
    visibleLogs.value = visibleLogs.value.slice(-16384)
  }

  if (autoScroll.value && logViewer.value) {
    setTimeout(() => {
      logViewer.value.scrollTop = logViewer.value.scrollHeight
    }, 200)
  }
}, 500)

function refreshLog() {
  logData.value = ''
  visibleLogs.value = []
  if (logViewer.value) logViewer.value.scrollTop = 0

  if (websocket.value && websocket.value.readyState === WebSocket.OPEN) websocket.value.close()

  authenticateToken()
}

function toggleLogLevel(level) {
  if (activeLogLevels.value.includes(level)) {
    activeLogLevels.value = activeLogLevels.value.filter((item) => item !== level)
  } else {
    activeLogLevels.value.push(level)
  }
  updateLogs()
}

function handleSearch() {
  updateLogs()
}

watch(logData, updateLogs)

onMounted(() => {
  logViewer.value = document.querySelector('#logViewer')
  authenticateToken()
})

onBeforeUnmount(() => {
  if (websocket.value) websocket.value.close()
  abortController.abort()
})
</script>

<style scoped>
.log-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}

.dark .filter-container {
  background-color: #555;
}

.filter-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.left-controls {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.log-search-input {
  flex-grow: 1;
  min-width: 100px;
}

.dark .log-search-input {
  background-color: #181818;
  border-radius: 5px;
}

.log-refresh-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 24px !important;
  margin-right: 10px;
  color: inherit;
  transition: color 0.3s ease;
}

.log-refresh-button:hover {
  background-color: transparent;
  color: #888;
}

.dark .log-refresh-button:hover {
  color: #aaa;
}

.auto-scroll-label {
  margin-left: 5px;
  cursor: default;
}

.right-controls {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 10px;
}

@media (max-width: 384px) {
  .right-controls {
    width: 100%;
    justify-content: flex-start;
  }
}

.filter-bottom-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 5px;
  overflow-x: auto;
}

.log-level-button {
  margin: 5px;
  background-color: transparent;
}

.log-level-button:hover {
  background-color: transparent;
}

.log-level-button + .log-level-button {
  margin-left: 5px;
}

.el-input {
  width: 100%;
  margin-top: 5px;
  margin-bottom: 5px;
}

.log-level-button.debug {
  color: #3b8ec9;
  border: 2px solid #3b8ec9;
}

.log-level-button.debug.active {
  color: white;
  background-color: #3b8ec9;
  border-color: #3b8ec9;
}

.log-level-button.info {
  color: #fff;
  border: 2px solid #fff;
}

.log-level-button.info.active {
  color: #333;
  background-color: #fff;
  border-color: #fff;
}

.log-level-button.success {
  color: #23d18b;
  border: 2px solid #23d18b;
}

.log-level-button.success.active {
  color: #333;
  background-color: #23d18b;
  border-color: #23d18b;
}
.log-level-button.warning {
  color: #f5f543;
  border: 2px solid #f5f543;
}

.log-level-button.warning.active {
  color: #333;
  background-color: #f5f543;
  border-color: #f5f543;
}

.log-level-button.error {
  color: #f14c4c;
  border: 2px solid #f14c4c;
}

.log-level-button.error.active {
  color: #fff;
  background-color: #f14c4c;
  border-color: #f14c4c;
}

.log-level-button.critical {
  color: #cd3131;
  background-color: #fff;
  border: 2px solid #cd3131;
}

.log-level-button.critical.active {
  color: #fff;
  background-color: #cd3131;
  border: 2px solid #fff;
}

.log-viewer {
  flex-grow: 1;
  height: calc(100vh - 260px);
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;
  background-color: #0c0c0c;
  color: #fff;
  padding: 10px;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.log-viewer-placeholder {
  color: #636363;
  white-space: normal;
}
</style>
