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
    <el-dialog v-model="imageDialogVisible" :show-close="false" :center="true">
      <img
        :src="previewImageSrc"
        style="width: 100%; height: 100%; cursor: pointer"
        @click="openImageInNewWindow"
      />
    </el-dialog>
  </div>
  <div class="chat-tip">
    {{ $t('chat.tip') }}
  </div>
</template>

<script>
// import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import linkAttributes from 'markdown-it-link-attributes'
import { v4 as uuidv4 } from 'uuid'
import { useI18n } from 'vue-i18n'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

export default {
  name: 'ChatPage',
  components: {
    EmojiPicker,
  },
  data() {
    const { t } = useI18n()
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
    return {
      commandPrefix: '~',
      inputText: '',
      messages: [],
      chatBox: null,
      websocket: null,
      connectionStatus: 'connecting',
      copiedId: null,
      heartbeatTimer: null,
      heartbeatTimeoutTimer: null,
      heartbeatRetryCount: 0,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      heartbeatAttempt: 3,
      imageDialogVisible: false,
      isMobileView: window.innerWidth < 1024,
      previewImageSrc: '',
      activeReactionMsg: null,
      abortController: new AbortController(),
      // debug: process.env.VUE_APP_DEBUG === 'true',
      debug: false,
      isDarkMode: localStorage.getItem('isDarkMode') === 'true',
      md,
      t,
    }
  },
  computed: {
    emojiTheme() {
      return this.isDarkMode ? 'dark' : 'light'
    },
    groupNames() {
      return {
        smileys_people: this.t('emojipicker.group.smileys_people'),
        animals_nature: this.t('emojipicker.group.animals_nature'),
        food_drink: this.t('emojipicker.group.food_drink'),
        activities: this.t('emojipicker.group.activities'),
        travel_places: this.t('emojipicker.group.travel_places'),
        objects: this.t('emojipicker.group.objects'),
        symbols: this.t('emojipicker.group.symbols'),
        flags: this.t('emojipicker.group.flags'),
        recent: this.t('emojipicker.group.recent'),
      }
    },
  },
  methods: {
    async connectWebSocket() {
      if (IS_DEMO) {
        this.connectionStatus = 'connected'
        ElMessage.warning(this.t('chat.message.warning.demo'))

        this.websocket = {
          send: (data) => {
            const parsed = JSON.parse(data)
            if (parsed.action === 'send') {
              const uuid = parsed.id || uuidv4()
              this.messages.push({
                from: 'user',
                text: parsed.message[0].content,
                html: this.renderMarkdown(parsed.message[0].content),
                id: uuid,
                showEmojiPicker: false,
                reactions: {},
                userReactions: [],
              })
              this.scrollToBottom()
            }
          },
          close: () => {
            // empty
          },
        }
        return
      }

      this.connectionStatus = 'connecting'
      let config = {}
      try {
        const response = await fetch('/api/init')
        if (response.ok) {
          config = await response.json()
          this.commandPrefix = config.command_prefix || '~'
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

        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = () => {
          const interval = parseFloat(config.heartbeat_interval)
          const timeout = parseFloat(config.heartbeat_timeout)
          const attempt = parseInt(config.heartbeat_attempt)

          this.heartbeatInterval = isNaN(interval) || interval <= 0 ? 30000 : interval * 1000
          this.heartbeatTimeout = isNaN(timeout) || timeout <= 0 ? 5000 : timeout * 1000
          this.heartbeatAttempt = isNaN(attempt) || attempt <= 0 ? 3 : attempt

          this.startHeartbeat()
        }

        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)

          clearTimeout(this.heartbeatTimeoutTimer)
          this.heartbeatRetryCount = 0

          if (data.action === 'heartbeat' && data.message === 'pong!') {
            this.handleHeartbeatResponse()
            return
          }

          this.connectionStatus = 'connected'

          if (data.action === 'delete' && Array.isArray(data.id)) {
            this.messages = this.messages.filter((msg) => !data.id.includes(msg.id))
            return
          }

          if (data.action === 'reaction') {
            const msg = this.messages.find((m) => m.id === data.id)
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
            this.messages.push({
              from: 'bot',
              text: this.renderResponse(data.message),
              html: this.renderMarkdown(this.renderResponse(data.message)),
              id: data.id || uuidv4(),
              typingStatus: null,
              showEmojiPicker: false,
              reactions: {},
              userReactions: [],
            })

            this.scrollToBottom()
            return
          }

          if (data.action === 'typing') {
            const msg = this.messages.find((m) => m.id === data.id)
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

        this.websocket.onerror = () => {
          this.connectionStatus = 'disconnected'
          ElMessage.error(this.t('message.error.connect.server'))
        }
      } catch (e) {
        this.connectionStatus = 'disconnected'
        ElMessage.error(this.t('message.error.connect') + e.message)
      }
    },

    startHeartbeat() {
      this.heartbeatRetryCount = 0
      this.sendHeartbeat()

      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat()
      }, this.heartbeatInterval)
    },

    sendHeartbeat(immediate = false) {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        this.disconnectWebSocket()
        this.connectionStatus = 'unconnected'
        return
      }

      this.websocket.send(JSON.stringify({ action: 'heartbeat', message: 'ping!' }))

      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = setTimeout(() => {
        this.heartbeatRetryCount++
        this.connectionStatus = 'connecting'

        if (this.heartbeatRetryCount >= this.heartbeatAttempt) {
          this.stopHeartbeat()
          this.disconnectWebSocket()
          this.connectionStatus = 'disconnected'
          ElMessage.error(this.t('message.error.connect.server'))
        } else {
          this.sendHeartbeat(true)
        }
      }, this.heartbeatTimeout)

      if (!immediate) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = setInterval(() => {
          this.sendHeartbeat()
        }, this.heartbeatInterval)
      }
    },

    handleHeartbeatResponse() {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatRetryCount = 0
      this.connectionStatus = 'connected'
    },

    stopHeartbeat() {
      clearInterval(this.heartbeatTimer)
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimer = null
      this.heartbeatTimeoutTimer = null
    },

    disconnectWebSocket() {
      if (this.websocket) {
        this.websocket.close()
        this.websocket = null
      }

      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
      }

      if (this.heartbeatTimeoutTimer) {
        clearTimeout(this.heartbeatTimeoutTimer)
        this.heartbeatTimeoutTimer = null
      }
    },

    authenticateToken() {
      // async authenticateToken() {
      // TODO 需要重新验证?
      // try {
      //   const response = await axios.get('/api/verify', {
      //     signal: this.abortController.signal,
      //   })

      //   if (response.status === 200) {
      this.connectWebSocket()
      //   } else {
      //     this.connectionStatus = 'disconnected'
      //     ElMessage.error(this.t('message.error.connect.auth'))
      //   }
      // } catch (error) {
      //   if (axios.isCancel(error)) {
      //     console.log('Request canceled')
      //   } else {
      //     this.connectionStatus = 'disconnected'
      //     ElMessage.error(this.t('message.error.fetch') + error.message)
      //   }
      // }
    },

    sendMessage() {
      const text = this.inputText.trim()
      if (!text) return

      const uuid = uuidv4()
      this.messages.push({
        from: 'user',
        text,
        html: this.renderMarkdown(text),
        id: uuid,
        showEmojiPicker: false,
        reactions: {},
        userReactions: [],
      })

      if (!IS_DEMO) {
        this.websocket?.send(
          JSON.stringify({
            action: 'send',
            message: [{ type: 'text', content: text }],
            id: uuid,
          }),
        )
      }
      this.inputText = ''
      this.scrollToBottom()
    },

    resetChat() {
      this.connectionStatus = 'connecting'
      this.messages = []

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close()
      }

      this.authenticateToken()
    },

    scrollToBottom() {
      setTimeout(() => {
        if (this.chatBox) {
          this.chatBox.scrollTop = this.chatBox.scrollHeight
        }
      }, 0)
    },

    handleResize() {
      this.isMobileView = window.innerWidth < 1024
    },

    handleEnterKey(event) {
      if (this.isMobileView) {
        return
      }
      if (event.shiftKey) {
        // empty for newline
      } else {
        event.preventDefault()
        this.sendMessage()
      }
    },

    renderMarkdown(text) {
      return this.md.render(text).replace(/\[image:([^\]]+)\]/g, (match, src) => {
        return `<img src="${src}" class="chat-img" />`
      })
    },

    handleMarkdownClick(event) {
      const target = event.target
      if (target.tagName === 'A') {
        event.preventDefault()
        this.confirmExternalLink(target.href)
      } else if (target.tagName === 'IMG') {
        this.showImagePreview(target.src)
      }
    },

    confirmExternalLink(url) {
      ElMessageBox.confirm(
        this.$t('chat.external_link.confirm.message', { url }),
        this.$t('chat.external_link.confirm.title'),
        {
          confirmButtonText: this.$t('yes'),
          cancelButtonText: this.$t('no'),
          type: 'warning',
        },
      )
        .then(() => {
          window.open(url, '_blank')
        })
        .catch(() => {
          console.log('Link blocked')
        })
    },

    renderResponse(data) {
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
    },

    openEmojiPicker(msg) {
      this.messages.forEach((m) => {
        m.showEmojiPicker = false // 明确执行赋值
      })
      this.activeReactionMsg = msg
      msg.showEmojiPicker = true
    },

    selectEmoji(msg, emoji) {
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

        this.websocket?.send(
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

        this.websocket?.send(
          JSON.stringify({
            action: 'reaction',
            emoji: selected,
            id: msg.id,
            add: true,
          }),
        )
      }

      msg.showEmojiPicker = false
    },

    userReacted(msg, emoji) {
      return msg.userReactions?.includes(emoji)
    },

    toggleReaction(msg, emoji) {
      if (!msg.reactions) msg.reactions = {}
      if (!msg.userReactions) msg.userReactions = []

      const hasReaction = msg.userReactions.includes(emoji)

      if (hasReaction) {
        msg.reactions[emoji]--
        if (msg.reactions[emoji] <= 0) delete msg.reactions[emoji]
        msg.userReactions = msg.userReactions.filter((e) => e !== emoji)

        this.websocket?.send(
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

        this.websocket?.send(
          JSON.stringify({
            action: 'reaction',
            emoji,
            id: msg.id,
            add: true,
          }),
        )
      }
    },

    async copyMessage(msg) {
      try {
        const textWithoutImages = msg.text.replace(/\[image:[^\]]+\]/g, '').trim()
        if (!textWithoutImages) {
          ElMessage.warning(this.t('chat.message.warning.nothing_to_copy'))
          return
        }

        await navigator.clipboard.writeText(textWithoutImages)
        this.copiedId = msg.id
        setTimeout(() => {
          if (this.copiedId === msg.id) {
            this.copiedId = null
          }
        }, 2000)
      } catch (e) {
        ElMessage.error(this.t('chat.message.error.copy') + e.message)
      }
    },

    showImagePreview(src) {
      this.previewImageSrc = src
      this.imageDialogVisible = true
    },

    openImageInNewWindow() {
      if (this.previewImageSrc) {
        window.open(this.previewImageSrc, '_blank')
      }
    },
  },

  mounted() {
    this.chatBox = this.$refs.chatBox
    this.authenticateToken()
    window.addEventListener('resize', this.handleResize)

    const html = document.documentElement
    this.isDarkMode = html.classList.contains('dark')

    this.observer = new MutationObserver(() => {
      this.isDarkMode = html.classList.contains('dark')
    })

    this.observer.observe(html, { attributes: true, attributeFilter: ['class'] })
  },

  beforeUnmount() {
    this.stopHeartbeat()
    if (this.websocket) {
      this.websocket.close()
    }
    this.abortController.abort()
    window.removeEventListener('resize', this.handleResize)
  },
}
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
