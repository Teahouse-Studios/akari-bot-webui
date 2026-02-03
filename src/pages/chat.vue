<template>
  <div class="chat-container">
    <div class="chat-header">
      <div
        :style="{
          backgroundColor:
            connectionStatus === 'connected'
              ? 'limegreen'
              : connectionStatus === 'connecting'
                ? 'orange'
                : 'red',
        }"
        class="connection-indicator"
        :title="
          connectionStatus === 'connected'
            ? $t('chat.status.tooltip.connected')
            : connectionStatus === 'connecting'
              ? $t('chat.status.tooltip.connecting')
              : $t('chat.status.tooltip.disconnected')
        "
      ></div>
      <div class="chat-title"># {{ $t('chat.title') }}</div>
      <el-tooltip :content="$t('chat.button.reset')" placement="right-end">
        <el-button class="reset-button" @click="resetChat" circle>
          <i class="mdi mdi-restart"></i>
        </el-button>
      </el-tooltip>
    </div>

    <div class="chat-box" ref="chatBox">
      <div v-if="messages.length === 0" class="chat-placeholder">
        <div class="placeholder-title">{{ $t('chat.chatbox.title') }}</div>
        <template v-if="!isMobileView">
          <div class="placeholder-sub">
            {{ $t('chat.chatbox.text.prompt1.prefix') }}
            <code class="chat-code">{{ commandPrefix }}help</code>
            {{ $t('chat.chatbox.text.prompt1.suffix') }}
          </div>
          <div class="placeholder-sub">
            {{ $t('chat.chatbox.text.prompt2.prefix') }}
            <code class="chat-code">Enter</code>
            {{ $t('chat.chatbox.text.prompt2.suffix') }}
          </div>
          <div class="placeholder-sub">
            {{ $t('chat.chatbox.text.prompt3.prefix') }}
            <code class="chat-code">Shift + Enter</code>
            {{ $t('chat.chatbox.text.prompt3.suffix') }}
          </div>
        </template>
        <template v-else>
          <div class="placeholder-sub">
            {{ $t('chat.chatbox.text.prompt1.prefix') }}
            <code class="chat-code">{{ commandPrefix }}help</code>
            {{ $t('chat.chatbox.text.prompt1.suffix') }}
          </div>
          <div class="placeholder-sub">
            {{ $t('chat.chatbox.text.prompt3.prefix') }}
            <code class="chat-code">Enter</code>
            {{ $t('chat.chatbox.text.prompt3.suffix') }}
          </div>
        </template>
      </div>

      <div
        v-for="(msg, idx) in messages"
        :key="msg.id || idx"
        class="chat-message-wrapper"
        :class="msg.from"
        :data-id="msg.id"
      >
        <div class="chat-message" :class="msg.from">
          <div v-html="msg.html" @click="handleMarkdownClick"></div>
          <div v-if="debug" class="debug-uuid">{{ msg.id }}</div>
        </div>
        <div class="chat-reactions">
          <el-button
            v-for="(count, emoji) in msg.reactions"
            :key="emoji"
            class="reaction-button"
            size="small"
            :class="{ active: userReacted(msg, emoji) }"
            @click="toggleReaction(msg, emoji)"
          >
            {{ emoji }} {{ count }}
          </el-button>

          <el-popover
            :placement="msg.from === 'bot' ? 'bottom-end' : 'bottom-start'"
            trigger="manual"
            v-model:visible="msg.showEmojiPicker"
            width="310"
          >
            <EmojiPicker
              :key="emojiTheme"
              @select="(emoji) => selectEmoji(msg, emoji)"
              :native="true"
              :disable-skin-tones="true"
              :display-recent="true"
              :theme="emojiTheme"
              :group-names="groupNames"
              :static-texts="{ placeholder: $t('emojipicker.placeholder') }"
            />
            <template #reference>
              <el-button circle size="small" class="reaction-button" @click="openEmojiPicker(msg)">
                <i class="mdi mdi-plus"></i>
              </el-button>
            </template>
          </el-popover>
        </div>
        <div class="chat-actions" v-if="msg.text.replace(/\[image:[^\]]+\]/g, '').trim()">
          <i
            v-if="msg.typingStatus"
            :class="[
              'mdi',
              msg.typingStatus === 'start'
                ? 'mdi-message-processing-outline'
                : msg.typingStatus === 'end'
                  ? 'mdi-message-check-outline'
                  : msg.typingStatus === 'error'
                    ? 'mdi-message-alert-outline'
                    : '',
            ]"
            class="typing-status-icon"
          ></i>

          <el-tooltip
            :content="
              msg.from === 'bot' && /\[image:[^\]]+\]/.test(msg.text)
                ? $t('chat.button.copy_text')
                : $t('button.copy')
            "
            placement="bottom"
          >
            <el-button class="copy-button" circle size="small" @click="copyMessage(msg)">
              <i :class="copiedId === msg.id ? 'mdi mdi-check' : 'mdi mdi-content-copy'"></i>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <div class="send-box">
      <el-input
        v-model="inputText"
        :placeholder="$t('chat.input.send')"
        @keydown.enter="handleEnterKey"
        class="chat-send-input"
        type="textarea"
        resize="none"
        clearable
        autosize
        :disabled="connectionStatus != 'connected'"
      />
      <el-button
        type="primary"
        @click="sendMessage"
        style="margin-left: 10px"
        :disabled="connectionStatus != 'connected' || inputText.trim() === ''"
      >
        {{ $t('chat.button.send') }}
      </el-button>
    </div>
    <div
      v-if="fullscreenPreviewVisible"
      class="fullscreen-preview"
      @click="closeFullscreenPreview"
      :class="{ show: showFullscreenPreviewAnim }"
    >
      <img
        :src="previewImageSrc"
        @click="openImageInNewWindow"
        class="fullscreen-image"
        ref="fullscreenImage"
      />
    </div>
  </div>
  <div class="chat-tip">
    {{ $t('chat.tip') }}
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import linkAttributes from 'markdown-it-link-attributes'
import { v4 as uuidv4 } from 'uuid'
import { useI18n } from 'vue-i18n'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import DOMPurify from 'dompurify'
import { confirmExternalLink } from '@/components/confirmExternalLink.js'
// import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const { t } = useI18n()
const inputText = ref('')
const messages = ref([])
const chatBox = ref(null)
const websocket = ref(null)
const connectionStatus = ref('connecting')
const copiedId = ref(null)
const heartbeatTimer = ref(null)
const heartbeatTimeoutTimer = ref(null)
const heartbeatRetryCount = ref(0)
const heartbeatInterval = ref(30000)
const heartbeatTimeout = ref(5000)
const heartbeatAttempt = ref(3)
const fullscreenPreviewVisible = ref(false)
const showFullscreenPreviewAnim = ref(false)
const isMobileView = ref(window.innerWidth < 1024)
const previewImageSrc = ref('')
const activeReactionMsg = ref(null)
const abortController = ref(new AbortController())
const debug = ref(false)
const isDarkMode = ref(LocalStorageJson.getItem('isDarkMode') === 'true')
const observer = ref(null)

const md = new MarkdownIt('zero')
  .set({ html: false, linkify: true, breaks: true })
  .use(linkAttributes, {
    pattern: /^(https?:)?\/\//,
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  })
  .use((md_) => {
    md_.enable(['blockquote', 'fence', 'heading', 'list'])
    md_.enable([
      'autolink',
      'backticks',
      'emphasis',
      'escape',
      'link',
      'linkify',
      'newline',
      'strikethrough',
      'text',
    ])

    md_.renderer.rules.paragraph_open = () => ''
    md_.renderer.rules.paragraph_close = () => '<br />'

    md_.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
      const hrefIndex = tokens[idx].attrIndex('href')
      if (hrefIndex >= 0) {
        const href = tokens[idx].attrs[hrefIndex][1]
        if (!/^(https?:)?\/\//.test(href) && !href.startsWith('/')) {
          tokens[idx].attrs[hrefIndex][1] = `https://${href}`
        }
      }
      return self.renderToken(tokens, idx, options)
    }

    md_.renderer.rules.fence = (tokens, idx) => {
      const content = tokens[idx].content
      return `<pre class="chat-pre">${md_.utils.escapeHtml(content)}</pre>`
    }

    md_.renderer.rules.code_inline = (tokens, idx) => {
      const content = tokens[idx].content
      return `<code class="chat-code">${md_.utils.escapeHtml(content)}</code>`
    }

    md_.renderer.rules.blockquote_open = () => {
      return '<blockquote class="chat-blockquote">'
    }
  })

const commandPrefix = ref('~')

const emojiTheme = computed(() => (isDarkMode.value ? 'dark' : 'light'))

const groupNames = computed(() => ({
  smileys_people: t('emojipicker.group.smileys_people'),
  animals_nature: t('emojipicker.group.animals_nature'),
  food_drink: t('emojipicker.group.food_drink'),
  activities: t('emojipicker.group.activities'),
  travel_places: t('emojipicker.group.travel_places'),
  objects: t('emojipicker.group.objects'),
  symbols: t('emojipicker.group.symbols'),
  flags: t('emojipicker.group.flags'),
  recent: t('emojipicker.group.recent'),
}))

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) {
      chatBox.value.scrollTop = chatBox.value.scrollHeight
    }
  })
}

const renderMarkdown = (text) => {
  const raw = md.render(text).replace(/\[image:([^\]]+)\]/g, (match, src) => {
    return `<img src="${src}" class="chat-img" />`
  })

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'code',
      'pre',
      'blockquote',
      'br',
      'img',
      'p',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'class', 'alt', 'title'],
  })
}

const renderResponse = (data) => {
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (item.type === 'text') {
          return item.content
        }
        if (item.type === 'image') {
          const base64Content = item.content
          if (
            base64Content.startsWith('data:image/png;base64,') ||
            base64Content.startsWith('data:image/jpeg;base64,') ||
            base64Content.startsWith('data:image/gif;base64,')
          ) {
            return `[image:${base64Content}]`
          }
          return ''
        }
        return ''
      })
      .join('\n')
  }
  return data
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

const connectWebSocket = async () => {
  if (IS_DEMO) {
    connectionStatus.value = 'connected'
    ElMessage.warning(t('chat.message.warning.demo'))

    websocket.value = {
      send: (data) => {
        const parsed = JSON.parse(data)
        if (parsed.action === 'send') {
          const uuid = parsed.id || uuidv4()
          messages.value.push({
            from: 'user',
            text: parsed.message[0].content,
            html: renderMarkdown(parsed.message[0].content),
            id: uuid,
            showEmojiPicker: false,
            reactions: {},
            userReactions: [],
          })
          scrollToBottom()
        }
      },
      close: () => {
        // empty
      },
    }
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
    const wsUrl = `${wsProtocol}//${url.hostname}${url.port ? `:${url.port}` : ''}/ws/chat`

    websocket.value = new WebSocket(wsUrl)

    websocket.value.onopen = () => {
      const interval = parseFloat(config.heartbeat_interval)
      const timeout = parseFloat(config.heartbeat_timeout)
      const attempt = parseInt(config.heartbeat_attempt)

      heartbeatInterval.value = isNaN(interval) || interval <= 0 ? 30000 : interval * 1000
      heartbeatTimeout.value = isNaN(timeout) || timeout <= 0 ? 5000 : timeout * 1000
      heartbeatAttempt.value = isNaN(attempt) || attempt <= 0 ? 3 : attempt

      startHeartbeat()
    }

    websocket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)

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
          } else {
            if (msg.reactions[data.emoji]) {
              msg.reactions[data.emoji]--
              if (msg.reactions[data.emoji] <= 0) {
                delete msg.reactions[data.emoji]
              }
            }
          }
        }
        return
      }

      if (data.action === 'send') {
        messages.value.push({
          from: 'bot',
          text: renderResponse(data.message),
          html: renderMarkdown(renderResponse(data.message)),
          id: data.id || uuidv4(),
          typingStatus: null,
          showEmojiPicker: false,
          reactions: {},
          userReactions: [],
        })

        scrollToBottom()
        return
      }

      if (data.action === 'typing') {
        const msg = messages.value.find((m) => m.id === data.id)
        if (msg) {
          if (['start', 'end', 'error'].includes(data.status)) {
            if (msg.typingStatus === 'error' && data.status === 'end') {
              return
            }
            msg.typingStatus = data.status
          }
        }
      }
    }

    websocket.value.onerror = () => {
      connectionStatus.value = 'disconnected'
      ElMessage.error(t('message.error.connect.server'))
    }
  } catch (e) {
    connectionStatus.value = 'disconnected'
    ElMessage.error(t('message.error.connect') + e.message)
  }
}

const authenticateToken = () => {
  connectWebSocket()
}

const sendMessage = () => {
  const text = inputText.value.trim()
  if (!text) return

  const uuid = uuidv4()
  messages.value.push({
    from: 'user',
    text,
    html: renderMarkdown(text),
    id: uuid,
    showEmojiPicker: false,
    reactions: {},
    userReactions: [],
  })

  if (!IS_DEMO) {
    websocket.value?.send(
      JSON.stringify({
        action: 'send',
        message: [{ type: 'text', content: text }],
        id: uuid,
      }),
    )
  }
  inputText.value = ''
  scrollToBottom()
}

const resetChat = () => {
  connectionStatus.value = 'connecting'
  messages.value = []

  if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
    websocket.value.close()
  }

  authenticateToken()
}

const handleResize = () => {
  isMobileView.value = window.innerWidth < 1024
}

const handleEnterKey = (event) => {
  if (isMobileView.value) {
    return
  }
  if (event.shiftKey) {
    // empty for newline
  } else {
    event.preventDefault()
    sendMessage()
  }
}

const showImagePreview = (src) => {
  previewImageSrc.value = src
  fullscreenPreviewVisible.value = true
  showFullscreenPreviewAnim.value = false
  nextTick(() => {
    setTimeout(() => {
      showFullscreenPreviewAnim.value = true
    }, 10)
  })
}

const handleMarkdownClick = (event) => {
  const target = event.target
  if (target.tagName === 'A') {
    event.preventDefault()
    confirmExternalLink(target.href, t)
  } else if (target.tagName === 'IMG') {
    showImagePreview(target.src)
  }
}

const openEmojiPicker = (msg) => {
  messages.value.forEach((m) => {
    m.showEmojiPicker = false
  })
  activeReactionMsg.value = msg
  msg.showEmojiPicker = true
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

    websocket.value?.send(
      JSON.stringify({
        action: 'reaction',
        emoji: selected,
        id: msg.id,
        add: false,
      }),
    )
  } else {
    msg.reactions[selected] = (msg.reactions[selected] || 0) + 1
    msg.userReactions.push(selected)

    websocket.value?.send(
      JSON.stringify({
        action: 'reaction',
        emoji: selected,
        id: msg.id,
        add: true,
      }),
    )
  }

  msg.showEmojiPicker = false
}

const userReacted = (msg, emoji) => {
  return msg.userReactions?.includes(emoji)
}

const toggleReaction = (msg, emoji) => {
  if (!msg.reactions) msg.reactions = {}
  if (!msg.userReactions) msg.userReactions = []

  const hasReaction = msg.userReactions.includes(emoji)

  if (hasReaction) {
    msg.reactions[emoji]--
    if (msg.reactions[emoji] <= 0) delete msg.reactions[emoji]
    msg.userReactions = msg.userReactions.filter((e) => e !== emoji)

    websocket.value?.send(
      JSON.stringify({
        action: 'reaction',
        emoji,
        id: msg.id,
        add: false,
      }),
    )
  } else {
    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1
    msg.userReactions.push(emoji)

    websocket.value?.send(
      JSON.stringify({
        action: 'reaction',
        emoji,
        id: msg.id,
        add: true,
      }),
    )
  }
}

const copyMessage = async (msg) => {
  try {
    const textWithoutImages = msg.text.replace(/\[image:[^\]]+\]/g, '').trim()
    if (!textWithoutImages) {
      ElMessage.warning(t('chat.message.warning.nothing_to_copy'))
      return
    }

    await navigator.clipboard.writeText(textWithoutImages)
    copiedId.value = msg.id
    setTimeout(() => {
      if (copiedId.value === msg.id) {
        copiedId.value = null
      }
    }, 2000)
  } catch (e) {
    ElMessage.error(t('chat.message.error.copy') + e.message)
  }
}

const closeFullscreenPreview = () => {
  const imgEl = document.querySelector('.fullscreen-image')
  const wrapper = document.querySelector('.fullscreen-preview')

  if (imgEl && wrapper) {
    showFullscreenPreviewAnim.value = false
    setTimeout(() => {
      fullscreenPreviewVisible.value = false
      previewImageSrc.value = ''
    }, 300)
  } else {
    fullscreenPreviewVisible.value = false
    previewImageSrc.value = ''
  }
}

const openImageInNewWindow = () => {
  if (previewImageSrc.value) {
    window.open(previewImageSrc.value, '_blank')
  }
}

onMounted(() => {
  chatBox.value = chatBox.value || document.querySelector('.chat-box')
  authenticateToken()
  window.addEventListener('resize', handleResize)

  const html = document.documentElement
  isDarkMode.value = html.classList.contains('dark')

  observer.value = new MutationObserver(() => {
    isDarkMode.value = html.classList.contains('dark')
  })

  observer.value.observe(html, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  stopHeartbeat()
  if (websocket.value) {
    websocket.value.close()
  }
  abortController.value.abort()
  window.removeEventListener('resize', handleResize)
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style>
.chat-img {
  max-width: 80%;
  max-height: 300px;
  margin: 8px 0;
  object-fit: contain;
  cursor: pointer;
}

.chat-blockquote {
  border-left: 4px solid gray;
  padding-left: 10px;
  margin: 10px 0;
}

.chat-pre {
  color: black;
  background-color: #f7f7f7;
  border: 1px solid #dcdcdc;
  padding: 15px;
  border-radius: 8px;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.chat-code {
  color: black;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

.dark .chat-pre {
  color: white;
  background-color: #2a2a2a;
  border: 1px solid #444;
}

.dark .chat-code {
  color: white;
  background-color: #3a3a3a;
  border: 1px solid #555;
}
</style>

<style scoped>
.chat-container {
  border-radius: 10px;
  overflow-y: auto;
}

.chat-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  background: #f3f3f3;
  border-bottom: 1px solid #e0e0e0;
}

.dark .chat-header {
  background: #333;
  border-bottom: 1px solid #1f1f1f;
}

.connection-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
}

.connection-indicator:hover::after {
  content: attr(title);
  display: block;
  position: absolute;
  top: 20px;
  left: 0;
  background-color: #000;
  color: #fff;
  padding: 5px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.chat-title {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
  cursor: default;
}

.reset-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 22px;
  color: inherit;
}

.reset-button:hover {
  background-color: transparent;
  color: #888;
}

.dark .reset-button:hover {
  color: #aaa;
}

.chat-box {
  height: calc(100vh - 260px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: #e8e8e8;
}

.dark .chat-box {
  background-color: #242424;
}

.chat-placeholder {
  flex: 1;
  gap: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 28px;
}

.placeholder-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.placeholder-sub {
  color: #777;
  font-size: 14px;
  margin-top: 4px;
}

.dark .chat-placeholder {
  color: #aaa;
}

.dark .placeholder-title {
  color: #eee;
}

.dark .placeholder-sub {
  color: #888;
}

.chat-message {
  margin: 12px 20px;
  line-height: 1.6;
  display: inline-block;
  max-width: 70%;
  border-radius: 10px;
  padding: 10px;
  word-wrap: break-word;
  word-break: break-word;
  margin: 12px 20px 0 20px;
}

.chat-message.user {
  background-color: var(--el-color-primary);
  color: white;
  align-self: flex-end;
  border-top-right-radius: 0;
}

.chat-message.bot {
  background-color: white;
  color: black;
  align-self: flex-start;
  border-top-left-radius: 0;
}

.dark .chat-message.bot {
  background-color: #333;
  color: white;
}

.debug-uuid {
  margin-top: 4px;
  font-size: 10px;
  color: #666;
}

.chat-message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 8px;
}

.chat-actions {
  margin: 2px 20px 0 20px;
  text-align: right;
  align-self: flex-end;
}

.chat-message-wrapper.bot .chat-actions {
  align-self: flex-start;
  text-align: left;
}

.chat-reactions {
  margin: 4px 20px 0 20px;
  align-self: flex-start;
  text-align: left;
}

.chat-message-wrapper.user .chat-reactions {
  align-self: flex-end;
  text-align: right;
}

.reaction-button {
  background: white;
  border-radius: 16px;
  padding: 0 8px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}

.reaction-button + .reaction-button {
  margin-left: 6px;
}

.reaction-button.active {
  background-color: var(--el-color-primary);
  color: white;
}

.dark .reaction-button {
  background: #444;
  color: #fff;
}

.dark .reaction-button.active {
  background-color: var(--el-color-primary);
  color: white;
}

.typing-status-icon {
  font-size: 16px;
  margin-right: 6px;
  opacity: 0.8;
  vertical-align: middle;
}

.copy-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 14px;
  color: inherit;
}

.copy-button:hover {
  color: #888;
  background-color: transparent;
}

.dark .copy-button:hover {
  color: #aaa;
}

.send-box {
  height: auto;
  min-height: 50px;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: #f3f3f3;
  border-top: 1px solid #e0e0e0;
}

.dark .send-box {
  border-top: 1px solid #1f1f1f;
  background: #333;
}

.dark .chat-send-input {
  background-color: #181818;
  border-radius: 5px;
}

.el-button:disabled {
  cursor: default !important;
}

.fullscreen-preview {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 60px);
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-preview.show {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.85);
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  display: block;
  transform: scale(0.8);
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  opacity: 0;
}

.fullscreen-preview.show .fullscreen-image {
  transform: scale(1);
  opacity: 1;
}

.fullscreen-preview img {
  cursor: pointer;
  object-fit: contain;
}

.chat-tip {
  font-size: 12px;
  color: #888;
  text-align: center;
  margin: 10px 0 0 0;
}

.dark .chat-tip {
  color: #aaa;
}
</style>
