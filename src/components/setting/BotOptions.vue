<template>
  <div>
    <h3 class="ak-card-title">
      <i class="mdi mdi-robot"></i> {{ $t('setting.bot_options.title') }}
    </h3>
    <div class="bot-option-actions">
      <el-button
        type="primary"
        class="bot-option-button"
        :class="{
          'force-mode': shiftPressed,
          'force-latched': forceUpdateLatched || longPressForce.update,
        }"
        :loading="updating"
        @pointerdown="startLongPress('update', $event)"
        @pointerup="endLongPress('update')"
        @pointerleave="cancelLongPress('update')"
        @pointercancel="cancelLongPress('update')"
        @pointermove="trackLongPressMove('update', $event)"
        @contextmenu.prevent
        @click="handleUpdate"
      >
        <i v-if="!updating" class="mdi mdi-update"></i>
        <span class="button-label">
          <span class="button-label-text">{{ $t('setting.bot_options.button.update_bot') }}</span>
          <span class="button-label-text force-label">{{
            $t('setting.bot_options.button.force_update_bot')
          }}</span>
          <span class="button-label-text button-label-sizer" aria-hidden="true">{{
            $t('setting.bot_options.button.force_restart_bot')
          }}</span>
        </span>
      </el-button>
      <el-button
        type="danger"
        class="bot-option-button"
        :class="{
          'force-mode': shiftPressed,
          'force-latched': forceRestartLatched || longPressForce.restart,
        }"
        @pointerdown="startLongPress('restart', $event)"
        @pointerup="endLongPress('restart')"
        @pointerleave="cancelLongPress('restart')"
        @pointercancel="cancelLongPress('restart')"
        @pointermove="trackLongPressMove('restart', $event)"
        @contextmenu.prevent
        @click="handleRestart"
      >
        <i class="mdi mdi-restart"></i>
        <span class="button-label">
          <span class="button-label-text">{{ $t('setting.bot_options.button.restart_bot') }}</span>
          <span class="button-label-text force-label">{{
            $t('setting.bot_options.button.force_restart_bot')
          }}</span>
          <span class="button-label-text button-label-sizer" aria-hidden="true">{{
            $t('setting.bot_options.button.force_update_bot')
          }}</span>
        </span>
      </el-button>
    </div>

    <el-dialog
      v-model="updateDialogVisible"
      :title="$t('setting.bot_options.update.title')"
      width="min(860px, 92vw)"
      class="update-dialog"
      align-center
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!updating"
      :show-close="!updating"
      @closed="resetUpdateState"
    >
      <div ref="terminalRef" class="update-terminal">
        <div
          v-for="(line, index) in updateLines"
          :key="index"
          class="terminal-line"
          :class="line.type"
        >
          <span v-if="line.type === 'command'" class="terminal-prompt">$</span>
          <span class="terminal-text">{{ line.text }}</span>
        </div>
        <div v-if="updating" class="terminal-line">
          <span class="terminal-cursor">█</span>
        </div>
      </div>

      <template #footer>
        <div class="update-footer">
          <span class="update-status" :class="updateStatus">
            <i :class="statusIcon"></i> {{ statusText }}
          </span>
          <el-button
            v-if="updateStatus === 'error' && !updating"
            type="primary"
            @click="updateDialogVisible = false"
          >
            {{ $t('button.close') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const pollingTimeout = 60000
const pollingInterval = 2000
const restartFallbackDelay = 10000
const longPressDelay = 600
const longPressMoveTolerance = 12
const hasShownTimeoutError = ref(false)

const shiftPressed = ref(false)
const forceUpdateLatched = ref(false)
const forceRestartLatched = ref(false)
const longPressForce = reactive({ update: false, restart: false })
const longPressTimers = { update: null, restart: null }
const longPressOrigins = { update: null, restart: null }
const suppressClickUntil = { update: 0, restart: 0 }

const handleShiftDown = (event) => {
  if (event.key === 'Shift') shiftPressed.value = true
}

const handleShiftUp = (event) => {
  if (event.key === 'Shift') shiftPressed.value = false
}

const resetShift = () => {
  shiftPressed.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleShiftDown)
  window.addEventListener('keyup', handleShiftUp)
  window.addEventListener('blur', resetShift)
})

const clearLongPressTimer = (action) => {
  clearTimeout(longPressTimers[action])
  longPressTimers[action] = null
  longPressOrigins[action] = null
}

const cancelLongPress = (action) => {
  clearLongPressTimer(action)
  longPressForce[action] = false
}

const startLongPress = (action, event) => {
  if (event.button !== undefined && event.button !== 0) return
  if (action === 'update' && updating.value) return
  clearLongPressTimer(action)
  longPressForce[action] = false
  suppressClickUntil[action] = 0
  longPressOrigins[action] = { x: event.clientX, y: event.clientY }
  longPressTimers[action] = setTimeout(() => {
    longPressTimers[action] = null
    longPressForce[action] = true
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10)
    }
  }, longPressDelay)
}

const trackLongPressMove = (action, event) => {
  const origin = longPressOrigins[action]
  if (!origin) return
  if (
    Math.abs(event.clientX - origin.x) > longPressMoveTolerance ||
    Math.abs(event.clientY - origin.y) > longPressMoveTolerance
  ) {
    cancelLongPress(action)
  }
}

// 放開按鈕時立即執行強制操作，並略過瀏覽器隨後補發的 click
const endLongPress = (action) => {
  clearLongPressTimer(action)
  if (!longPressForce[action]) return

  longPressForce[action] = false
  suppressClickUntil[action] = Date.now() + 600

  if (action === 'update') {
    if (!updating.value) startUpdate(true)
  } else {
    confirmRestart(true)
  }
}

const isClickSuppressed = (action) => {
  if (Date.now() >= suppressClickUntil[action]) return false
  suppressClickUntil[action] = 0
  return true
}

const restartBot = async (force = false) => {
  forceRestartLatched.value = force
  const loadingInstance = ElLoading.service({
    fullscreen: true,
    text: t('setting.bot_options.restart.loading.text'),
  })
  hasShownTimeoutError.value = false

  let pollStarted = false
  let pollStartTime = 0
  let pollTimer = null
  let pollDueTime = 0

  const showError = (message) => {
    forceRestartLatched.value = false
    loadingInstance.close()
    ElMessage({ message, type: 'error', duration: 0 })
  }

  const poll = async () => {
    try {
      const res = await axios.get('/api')
      if (res.status === 200) {
        loadingInstance.close()
        window.location.href = '/'
        return
      }
      throw new Error('Not ready')
    } catch {
      const elapsed = Date.now() - pollStartTime
      if (elapsed >= pollingTimeout && !hasShownTimeoutError.value) {
        hasShownTimeoutError.value = true
        showError(t('setting.bot_options.restart.message.failed'))
      } else {
        setTimeout(poll, pollingInterval)
      }
    }
  }

  const startPolling = (delay) => {
    if (pollStarted) return
    const dueTime = Date.now() + delay
    // 已排定較晚的輪詢時，允許提前到更早的時間
    if (pollTimer && dueTime >= pollDueTime) return
    clearTimeout(pollTimer)
    pollDueTime = dueTime
    pollTimer = setTimeout(() => {
      pollStarted = true
      pollStartTime = Date.now()
      poll()
    }, delay)
  }

  const applyRestartStatus = (data) => {
    const activeSessions = Number(data?.active_sessions) || 0
    if (data?.state === 'waiting' && activeSessions > 0) {
      loadingInstance.setText(
        t('setting.bot_options.restart.loading.waiting_sessions', { count: activeSessions }),
      )
      return
    }

    loadingInstance.setText(t('setting.bot_options.restart.loading.text'))
    // 等待执行中的命令时旧进程仍会回应 /api，需等真正开始重启后才轮询
    if (data?.state === 'restarting') startPolling(restartFallbackDelay)
  }

  try {
    if (IS_DEMO) {
      await axios.post('/api/restart', { force })
      startPolling(pollingInterval)
      return
    }

    const response = await fetch('/api/restart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LocalStorageJson.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force }),
    })

    if (!response.ok) {
      const detail = await readErrorDetail(response)
      showError(
        `${t('setting.bot_options.restart.message.failed')} (HTTP ${response.status})${detail}`,
      )
      return
    }

    try {
      await consumeSseStream(response, (event, data) => {
        if (event === 'status') applyRestartStatus(data)
      })
    } catch {
      // 服务端重启时会主动断开 SSE 连接，属于预期行为
    }
    startPolling(pollingInterval)
  } catch (error) {
    showError(t('message.error.fetch') + error.message)
  }
}

const confirmRestart = async (forceOverride) => {
  const force = typeof forceOverride === 'boolean' ? forceOverride : shiftPressed.value
  forceRestartLatched.value = force
  try {
    await ElMessageBox.confirm(t('confirm.message'), t('confirm.warning'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
      closeOnClickModal: false,
    })
    await restartBot(force)
  } catch {
    forceRestartLatched.value = false
  }
}

const handleRestart = () => {
  if (isClickSuppressed('restart')) return
  confirmRestart()
}

const MAX_TERMINAL_LINES = 2000
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g')

const updateDialogVisible = ref(false)
const updateLines = ref([])
const updateStatus = ref('idle')
const updating = ref(false)
const terminalRef = ref(null)
let autoCloseTimer = null

const statusIcon = computed(() => {
  if (updateStatus.value === 'running') return 'mdi mdi-loading mdi-spin'
  if (updateStatus.value === 'success') return 'mdi mdi-check-circle'
  if (updateStatus.value === 'error') return 'mdi mdi-alert-circle'
  return ''
})

const statusText = computed(() => {
  if (updateStatus.value === 'running') return t('setting.bot_options.update.status.running')
  if (updateStatus.value === 'success') return t('setting.bot_options.update.status.success')
  if (updateStatus.value === 'error') return t('setting.bot_options.update.status.failed')
  return ''
})

const stripAnsi = (text) => String(text).replace(ANSI_PATTERN, '')

const scrollTerminalToBottom = () => {
  if (terminalRef.value) terminalRef.value.scrollTop = terminalRef.value.scrollHeight
}

const appendLine = (text, type = 'output') => {
  for (const line of stripAnsi(text).split(/\r?\n/)) {
    updateLines.value.push({ text: line, type })
  }
  if (updateLines.value.length > MAX_TERMINAL_LINES) {
    updateLines.value.splice(0, updateLines.value.length - MAX_TERMINAL_LINES)
  }
  nextTick(scrollTerminalToBottom)
}

const resetUpdateState = () => {
  clearTimeout(autoCloseTimer)
  autoCloseTimer = null
  forceUpdateLatched.value = false
  updateLines.value = []
  updateStatus.value = 'idle'
  updating.value = false
}

const scheduleAutoClose = () => {
  clearTimeout(autoCloseTimer)
  autoCloseTimer = setTimeout(() => {
    updateDialogVisible.value = false
  }, 1500)
}

const formatUpdateError = (data) => {
  const code = typeof data?.code === 'string' ? data.code : ''
  if (code === 'binary_mode') {
    return 'The bot is running in binary mode and cannot be updated from this interface.'
  }
  if (code === 'internal_error') {
    return 'An unexpected error occurred during the update.'
  }
  return data?.message ? String(data.message) : 'Update failed.'
}

const finishUpdate = (success) => {
  if (success) {
    if (updateStatus.value !== 'success') {
      updateStatus.value = 'success'
      appendLine('Update completed.', 'success')
    }
    return
  }
  updateStatus.value = 'error'
  appendLine('Update failed.', 'error')
}

const appendStage = (data) => {
  if (!data || typeof data !== 'object') return

  if (data.skipped) {
    appendLine('Skipped Git update: the current directory is not a Git repository.', 'warning')
    return
  }

  const hasReturnCode = typeof data.returncode === 'number'
  if (data.action && !hasReturnCode) {
    appendLine(`$ ${data.action === 'reset' ? 'git reset --hard' : 'git pull'}`, 'command')
  }
  if (data.tool && !hasReturnCode) {
    appendLine(
      `$ ${data.tool === 'pip' ? 'pip install -r requirements.txt' : 'uv sync'}`,
      'command',
    )
  }
  if (hasReturnCode) {
    const stage = data.stage === 'dependencies' ? 'Dependencies' : 'Git'
    appendLine(
      `${stage} exited with code ${data.returncode}`,
      data.returncode === 0 ? 'info' : 'error',
    )
  }
}

const processUpdateEvent = (event, data) => {
  switch (event) {
    case 'start':
      appendLine('Starting bot update...', 'info')
      break
    case 'stage':
      appendStage(data)
      break
    case 'output':
      if (data?.line) appendLine(String(data.line), 'output')
      break
    case 'error':
      appendLine(formatUpdateError(data), 'error')
      break
    case 'done':
      finishUpdate(Boolean(data?.success))
      break
  }
}

/** 解析 SSE 事件块，格式不完整时返回 null */
const parseSseBlock = (raw) => {
  let event = 'message'
  const dataLines = []
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).replace(/^ /, ''))
    }
  }
  if (!dataLines.length) return null

  try {
    return { event, data: JSON.parse(dataLines.join('\n')) }
  } catch {
    return null
  }
}

/** 读取 SSE 响应流，逐块回调事件 */
const consumeSseStream = async (response, onEvent) => {
  if (!response.body) throw new Error('Response body is empty')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const dispatch = (raw) => {
    const parsed = parseSseBlock(raw)
    if (parsed) onEvent(parsed.event, parsed.data)
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      dispatch(raw)
      boundary = buffer.indexOf('\n\n')
    }
  }

  buffer += decoder.decode().replace(/\r\n/g, '\n')
  if (buffer.trim()) dispatch(buffer)
}

/** 消费更新流，返回是否收到 done 事件 */
const consumeUpdateStream = async (response) => {
  let doneReceived = false
  await consumeSseStream(response, (event, data) => {
    processUpdateEvent(event, data)
    if (event === 'done') doneReceived = true
  })
  return doneReceived
}

const readErrorDetail = async (response) => {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') return ` (${data.detail})`
  } catch {
    // 回應不是 JSON 時只顯示 HTTP 狀態碼
  }
  return ''
}

const runDemoUpdate = async (force) => {
  const demoEvents = [
    ['start', { force }],
    ['stage', { stage: 'git', action: force ? 'reset' : 'pull' }],
    ['output', { stage: 'git', line: 'Already up to date.' }],
    ['stage', { stage: 'git', action: force ? 'reset' : 'pull', returncode: 0 }],
    ['stage', { stage: 'dependencies', tool: 'uv' }],
    ['output', { stage: 'dependencies', line: 'Resolved 128 packages in 0.42s' }],
    ['output', { stage: 'dependencies', line: 'Audited 128 packages in 0.08s' }],
    ['stage', { stage: 'dependencies', tool: 'uv', returncode: 0 }],
    ['done', { success: true }],
  ]
  for (const [event, data] of demoEvents) {
    if (!updateDialogVisible.value) return
    processUpdateEvent(event, data)
    await new Promise((resolve) => setTimeout(resolve, 260))
  }
}

const startUpdate = async (force = false) => {
  resetUpdateState()
  forceUpdateLatched.value = force
  updateDialogVisible.value = true
  updating.value = true
  updateStatus.value = 'running'

  try {
    if (IS_DEMO) {
      await runDemoUpdate(force)
      return
    }

    const response = await fetch('/api/update', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LocalStorageJson.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force }),
    })

    if (!response.ok) {
      const detail = await readErrorDetail(response)
      updateStatus.value = 'error'
      appendLine(`Update request failed (HTTP ${response.status})${detail}`, 'error')
      return
    }

    const doneReceived = await consumeUpdateStream(response)
    if (!doneReceived && updateStatus.value === 'running') {
      updateStatus.value = 'error'
      appendLine('Update failed.', 'error')
    }
  } catch (error) {
    if (updateStatus.value !== 'success') {
      updateStatus.value = 'error'
      appendLine(`Unable to reach the update endpoint: ${error?.message || ''}`, 'error')
    }
  } finally {
    updating.value = false
    if (updateStatus.value === 'success') scheduleAutoClose()
  }
}

const handleUpdate = () => {
  if (isClickSuppressed('update')) return
  if (!updating.value) startUpdate(shiftPressed.value)
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleShiftDown)
  window.removeEventListener('keyup', handleShiftUp)
  window.removeEventListener('blur', resetShift)
  clearTimeout(autoCloseTimer)
  autoCloseTimer = null
})
</script>

<style scoped>
.bot-option-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 主題設定的按鈕間距約 10px；覆蓋 Element Plus 相鄰按鈕的預設 margin */
.bot-option-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* 按住 Shift 或長按時切換為強制操作；標籤與量測文字疊放在同一格，避免切換文字時撐開按鈕 */
.bot-option-button {
  padding-left: 22px;
  padding-right: 22px;
  /* 長按切換強制操作：避免行動端長按觸發選字或系統選單 */
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.button-label {
  display: inline-grid;
  align-items: center;
  justify-items: center;
}

/* Vue 會移除元素間的換行空白，需自行補上圖示與文字的間距 */
.bot-option-button:not(.is-loading) .button-label {
  margin-left: 6px;
}

/*
 * 標籤切換：進入強制狀態時一般文案先快速淡出，強制文案延遲一點點再淡入，
 * 兩段動畫略微交疊又不會讓兩種文案長時間重疊；時間刻意壓短，避免拖慢 Shift 預覽。
 */
.button-label-text {
  grid-area: 1 / 1;
  white-space: nowrap;
  opacity: 1;
  visibility: visible;
  transition:
    opacity 0.08s ease,
    visibility 0s linear;
}

/* 隱形量測文字：兩個按鈕都預留最長文案寬度，使按鈕等長且切換文字時不撐開 */
.button-label-sizer {
  visibility: hidden;
}

/* 強制操作標籤預設隱藏；等淡出結束後才真正隱藏 */
.bot-option-button .force-label {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.08s ease,
    visibility 0s linear 0.08s;
}

.bot-option-button.force-mode:hover .button-label-text:not(.force-label),
.bot-option-button.force-latched .button-label-text:not(.force-label) {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.08s ease,
    visibility 0s linear 0.08s;
}

.bot-option-button.force-mode:hover .force-label,
.bot-option-button.force-latched .force-label {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 0.08s ease 0.04s,
    visibility 0s linear;
}

.update-terminal {
  height: min(50vh, 420px);
  min-height: 200px;
  overflow-y: auto;
  padding: 14px;
  border-radius: 8px;
  background-color: #0c0c0c;
  color: #d4d4d4;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-line {
  display: flex;
  gap: 8px;
}

.terminal-prompt {
  flex: 0 0 auto;
  color: #4ec9b0;
}

.terminal-text {
  min-width: 0;
}

.terminal-line.command .terminal-text {
  color: #dcdcaa;
}

.terminal-line.info .terminal-text {
  color: #4fc1ff;
}

.terminal-line.success .terminal-text {
  color: #6a9955;
}

.terminal-line.warning .terminal-text {
  color: #d7ba7d;
}

.terminal-line.error .terminal-text {
  color: #f48771;
}

.terminal-cursor {
  color: #d4d4d4;
  animation: terminal-blink 1s step-end infinite;
}

@keyframes terminal-blink {
  50% {
    opacity: 0;
  }
}

.update-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.update-status {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.update-status.running {
  color: var(--el-color-primary);
}

.update-status.success {
  color: var(--el-color-success);
}

.update-status.error {
  color: var(--el-color-danger);
}
</style>
