import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from '@/const'
import { normalizeMessageBlocks, renderMarkdown, renderMessageText } from '@/utils/chatMessage.js'

/**
 * 聊天会话：负责与 `/ws/chat` 通信（含心跳、断线重连），
 * 并维护消息列表与连接状态；视图层订阅 `messages` 渲染。
 */
export function useChatSocket() {
  const { t } = useI18n()

  const messages = ref([])
  const websocket = ref(null)
  const connectionStatus = ref('connecting')
  const commandPrefix = ref('~')
  const heartbeatTimer = ref(null)
  const heartbeatTimeoutTimer = ref(null)
  const heartbeatRetryCount = ref(0)
  const heartbeatInterval = ref(30000)
  const heartbeatTimeout = ref(5000)
  const heartbeatAttempt = ref(3)
  const reconnectTimer = ref(null)
  const isUnmounted = ref(false)

  const sendUserMessage = (text, images = []) => {
    const messageText = typeof text === 'string' ? text : ''

    const blocks = []
    if (messageText) {
      blocks.push({ type: 'text', content: messageText, html: renderMarkdown(messageText) })
    }
    for (const image of images) {
      blocks.push({ type: 'image', content: image.dataUrl })
    }
    if (!blocks.length) return false

    const uuid = uuidv4()
    messages.value.push({
      from: 'user',
      blocks,
      text: messageText,
      id: uuid,
      showEmojiPicker: false,
      reactions: {},
      userReactions: [],
    })

    if (!IS_DEMO) {
      websocket.value?.send(
        JSON.stringify({
          action: 'send',
          message: blocks.map(({ type, content: blockContent }) => ({
            type,
            content: blockContent,
          })),
          id: uuid,
        }),
      )
    }

    return true
  }

  const handleButtonClick = (btn) => {
    if (!btn || typeof btn !== 'object' || btn._clicked) return

    const value = typeof btn.value === 'string' ? btn.value : ''
    if (!value) return

    const uuid = uuidv4()
    if (!IS_DEMO) {
      websocket.value?.send(
        JSON.stringify({
          action: 'send',
          message: [{ type: 'text', content: value }],
          id: uuid,
          reply_id: btn.reply_id ?? null,
        }),
      )
    }
    btn._clicked = true
  }

  const openEmojiPicker = (msg) => {
    messages.value.forEach((m) => {
      m.showEmojiPicker = false
    })
    msg.showEmojiPicker = true
  }

  const sendReaction = (msg, emoji, add) => {
    websocket.value?.send(
      JSON.stringify({
        action: 'reaction',
        emoji,
        id: msg.id,
        add,
      }),
    )
  }

  const selectEmoji = (msg, emoji) => {
    const selected = emoji.i
    if (!msg) return

    if (!msg.reactions) msg.reactions = {}
    if (!msg.userReactions) msg.userReactions = []

    const hasReaction = msg.userReactions.includes(selected)

    if (hasReaction) {
      msg.reactions[selected]--

      if (msg.reactions[selected] <= 0) {
        delete msg.reactions[selected]
      }

      msg.userReactions = msg.userReactions.filter((e) => e !== selected)
      sendReaction(msg, selected, false)
    } else {
      msg.reactions[selected] = (msg.reactions[selected] || 0) + 1
      msg.userReactions.push(selected)
      sendReaction(msg, selected, true)
    }

    msg.showEmojiPicker = false
  }

  const toggleReaction = (msg, emoji) => {
    if (!msg.reactions) msg.reactions = {}
    if (!msg.userReactions) msg.userReactions = []

    const hasReaction = msg.userReactions.includes(emoji)

    if (hasReaction) {
      msg.reactions[emoji]--
      if (msg.reactions[emoji] <= 0) delete msg.reactions[emoji]
      msg.userReactions = msg.userReactions.filter((e) => e !== emoji)
      sendReaction(msg, emoji, false)
    } else {
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1
      msg.userReactions.push(emoji)
      sendReaction(msg, emoji, true)
    }
  }

  const handleHeartbeatResponse = () => {
    clearTimeout(heartbeatTimeoutTimer.value)
    heartbeatRetryCount.value = 0
    connectionStatus.value = 'connected'
  }

  const disconnectWebSocket = () => {
    if (websocket.value) {
      websocket.value.close()
      websocket.value = null
    }

    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = null
    }

    if (heartbeatTimeoutTimer.value) {
      clearTimeout(heartbeatTimeoutTimer.value)
      heartbeatTimeoutTimer.value = null
    }
  }

  const stopHeartbeat = () => {
    clearInterval(heartbeatTimer.value)
    clearTimeout(heartbeatTimeoutTimer.value)
    heartbeatTimer.value = null
    heartbeatTimeoutTimer.value = null
  }

  const sendHeartbeat = (immediate = false) => {
    if (!websocket.value || websocket.value.readyState !== WebSocket.OPEN) {
      disconnectWebSocket()
      connectionStatus.value = 'unconnected'
      return
    }

    websocket.value.send(JSON.stringify({ action: 'heartbeat', message: 'ping!' }))

    clearTimeout(heartbeatTimeoutTimer.value)
    heartbeatTimeoutTimer.value = setTimeout(() => {
      heartbeatRetryCount.value++
      connectionStatus.value = 'connecting'

      if (heartbeatRetryCount.value >= heartbeatAttempt.value) {
        stopHeartbeat()
        disconnectWebSocket()
        connectionStatus.value = 'disconnected'
        ElMessage.error(t('message.error.connect.server'))
        scheduleReconnect()
      } else {
        sendHeartbeat(true)
      }
    }, heartbeatTimeout.value)

    if (!immediate) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = setInterval(() => {
        sendHeartbeat()
      }, heartbeatInterval.value)
    }
  }

  const startHeartbeat = () => {
    heartbeatRetryCount.value = 0
    sendHeartbeat()

    heartbeatTimer.value = setInterval(() => {
      sendHeartbeat()
    }, heartbeatInterval.value)
  }

  const scheduleReconnect = () => {
    if (IS_DEMO || isUnmounted.value || reconnectTimer.value) return

    connectionStatus.value = 'connecting'
    reconnectTimer.value = setTimeout(() => {
      reconnectTimer.value = null
      connectWebSocket()
    }, 1000)
  }

  const handleSocketMessage = (event) => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }

    if (!data || typeof data !== 'object') return

    clearTimeout(heartbeatTimeoutTimer.value)
    heartbeatRetryCount.value = 0

    if (data.action === 'heartbeat' && data.message === 'pong!') {
      handleHeartbeatResponse()
      return
    }

    connectionStatus.value = 'connected'

    if (data.action === 'delete' && Array.isArray(data.id)) {
      messages.value = messages.value.filter((msg) => !data.id.includes(msg.id))
      return
    }

    if (data.action === 'reaction') {
      const msg = messages.value.find((m) => m.id === data.id)
      if (msg) {
        if (!msg.reactions) msg.reactions = {}

        if (data.add) {
          msg.reactions[data.emoji] = (msg.reactions[data.emoji] || 0) + 1
        } else if (msg.reactions[data.emoji]) {
          msg.reactions[data.emoji]--
          if (msg.reactions[data.emoji] <= 0) {
            delete msg.reactions[data.emoji]
          }
        }
      }
      return
    }

    if (data.action === 'send') {
      messages.value.push({
        from: 'bot',
        blocks: normalizeMessageBlocks(data.message),
        text: renderMessageText(data.message),
        id: data.id || uuidv4(),
        typingStatus: null,
        showEmojiPicker: false,
        reactions: {},
        userReactions: [],
      })
      return
    }

    if (data.action === 'error') {
      ElMessage.error(data.message || t('chat.message.error.send'))
      return
    }

    if (data.action === 'typing') {
      const msg = messages.value.find((m) => m.id === data.id)
      if (msg && ['start', 'end', 'error'].includes(data.status)) {
        if (msg.typingStatus === 'error' && data.status === 'end') {
          return
        }
        msg.typingStatus = data.status
      }
    }
  }

  const connectWithDemoSocket = () => {
    connectionStatus.value = 'connected'
    ElMessage.warning(t('chat.message.warning.demo'))

    websocket.value = {
      send: (data) => {
        const parsed = JSON.parse(data)
        if (parsed.action === 'send') {
          const uuid = parsed.id || uuidv4()
          messages.value.push({
            from: 'user',
            blocks: normalizeMessageBlocks(parsed.message),
            text: renderMessageText(parsed.message),
            id: uuid,
            showEmojiPicker: false,
            reactions: {},
            userReactions: [],
          })
        }
      },
      close: () => {
        // empty
      },
    }
  }

  const connectWebSocket = async () => {
    if (IS_DEMO) {
      connectWithDemoSocket()
      return
    }

    if (
      websocket.value &&
      (websocket.value.readyState === WebSocket.OPEN ||
        websocket.value.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    connectionStatus.value = 'connecting'
    let config = {}
    try {
      const response = await fetch('/api/init')
      if (response.ok) {
        config = await response.json()
        commandPrefix.value = config.command_prefix || '~'
      }
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
      const wsUrl = `${wsProtocol}//${url.hostname}${url.port ? `:${url.port}` : ''}/ws/chat`

      const socket = new WebSocket(wsUrl)
      websocket.value = socket

      socket.onopen = () => {
        const interval = parseFloat(config.heartbeat_interval)
        const timeout = parseFloat(config.heartbeat_timeout)
        const attempt = parseInt(config.heartbeat_attempt)

        heartbeatInterval.value = Number.isNaN(interval) || interval <= 0 ? 30000 : interval * 1000
        heartbeatTimeout.value = Number.isNaN(timeout) || timeout <= 0 ? 5000 : timeout * 1000
        heartbeatAttempt.value = Number.isNaN(attempt) || attempt <= 0 ? 3 : attempt

        startHeartbeat()
      }

      socket.onmessage = handleSocketMessage

      socket.onerror = () => {
        connectionStatus.value = 'disconnected'
        ElMessage.error(t('message.error.connect.server'))
      }

      socket.onclose = () => {
        if (websocket.value !== socket) return
        stopHeartbeat()
        websocket.value = null
        scheduleReconnect()
      }
    } catch (e) {
      connectionStatus.value = 'disconnected'
      ElMessage.error(t('message.error.connect') + e.message)
      scheduleReconnect()
    }
  }

  const resetChat = () => {
    connectionStatus.value = 'connecting'
    messages.value = []

    disconnectWebSocket()
    connectWebSocket()
  }

  onMounted(() => {
    connectWebSocket()
  })

  onBeforeUnmount(() => {
    isUnmounted.value = true
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = null
    stopHeartbeat()
    if (websocket.value) {
      websocket.value.close()
    }
  })

  return {
    messages,
    connectionStatus,
    commandPrefix,
    sendUserMessage,
    handleButtonClick,
    openEmojiPicker,
    selectEmoji,
    toggleReaction,
    resetChat,
  }
}
