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
          <template v-for="(block, blockIdx) in msg.blocks" :key="blockIdx">
            <SafeHtml
              v-if="block.type === 'text'"
              :html="block.html"
              @click="handleMarkdownClick"
              class="chat-message-content"
            />

            <img
              v-else-if="block.type === 'image'"
              :src="block.content"
              class="chat-img"
              alt=""
              @click="showImagePreview(block.content)"
            />

            <audio
              v-else-if="block.type === 'audio'"
              class="chat-audio"
              controls
              preload="metadata"
              :src="block.content"
            ></audio>

            <video
              v-else-if="block.type === 'video'"
              class="chat-video"
              controls
              preload="metadata"
              :src="block.content"
            ></video>

            <span
              v-else-if="block.type === 'action_text'"
              class="chat-action-text"
              @click="handleActionTextClick(block)"
            >
              {{ block.show }}
            </span>

            <div v-else-if="block.type === 'button_frame'" class="chat-button-frame">
              <div v-for="(row, rowIdx) in block.content" :key="rowIdx" class="chat-button-row">
                <template v-for="(btn, btnIdx) in row" :key="btnIdx">
                  <a
                    v-if="isExternalUrl(btn.value)"
                    :href="btn.value"
                    target="_blank"
                    rel="noopener"
                    class="chat-button chat-button-link"
                    @click="handleExternalButtonClick($event, btn.value)"
                  >
                    {{ btn.show }}
                  </a>
                  <button
                    v-else
                    type="button"
                    class="chat-button"
                    :class="{ 'chat-button-clicked': btn._clicked }"
                    :disabled="btn._clicked"
                    @click="handleButtonClick(btn)"
                  >
                    {{ btn.show }}
                  </button>
                </template>
              </div>
            </div>

            <div v-else-if="block.type === 'embed'" class="chat-embed">
              <div
                class="chat-embed-colorbar"
                :style="{ backgroundColor: colorToHex(block.content.color) }"
              ></div>
              <div class="chat-embed-content">
                <a
                  v-if="block.content.url"
                  :href="block.content.url"
                  target="_blank"
                  rel="noopener"
                  class="chat-embed-title chat-embed-title-link"
                >
                  {{ block.content.title }}
                </a>
                <div v-else class="chat-embed-title">{{ block.content.title }}</div>

                <div v-if="block.content.description" class="chat-embed-description">
                  {{ block.content.description }}
                </div>

                <div
                  v-if="block.content.fields && block.content.fields.length"
                  class="chat-embed-fields"
                >
                  <div
                    v-for="(field, fieldIdx) in block.content.fields"
                    :key="fieldIdx"
                    class="chat-embed-field"
                    :class="{ 'chat-embed-field-inline': field.inline }"
                  >
                    <div class="chat-embed-field-name">{{ field.name }}</div>
                    <div class="chat-embed-field-value">{{ field.value }}</div>
                  </div>
                </div>

                <img
                  v-if="block.content.image"
                  :src="block.content.image"
                  class="chat-embed-image"
                  alt=""
                  @click="showImagePreview(block.content.image)"
                />
                <img
                  v-if="block.content.thumbnail"
                  :src="block.content.thumbnail"
                  class="chat-embed-thumbnail"
                  alt=""
                  @click="showImagePreview(block.content.thumbnail)"
                />

                <div
                  v-if="block.content.author || block.content.footer || block.content.timestamp"
                  class="chat-embed-footer"
                >
                  <span v-if="block.content.author" class="chat-embed-author">
                    {{ block.content.author }}
                  </span>
                  <span v-if="block.content.timestamp" class="chat-embed-timestamp">
                    {{ formatTimestamp(block.content.timestamp) }}
                  </span>
                  <span v-if="block.content.footer" class="chat-embed-footer-text">
                    {{ block.content.footer }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-else-if="block.type === 'nodes'"
              class="chat-nodes"
              @click="openNodesDialog(block)"
            >
              <div class="chat-nodes-title">
                <i class="mdi mdi-forward"></i>
                <span>{{ block.content.name }}</span>
              </div>
              <div
                v-for="(node, nodeIdx) in block.content.nodes.slice(0, 3)"
                :key="nodeIdx"
                class="chat-nodes-preview"
              >
                <span class="chat-nodes-preview-index">{{ nodeIdx + 1 }}.</span>
                <span class="chat-nodes-preview-text">{{ nodesPreviewText(node) }}</span>
              </div>
              <div v-if="block.content.nodes.length > 3" class="chat-nodes-more">
                {{ $t('chat.nodes.more', { count: block.content.nodes.length - 3 }) }}
              </div>
            </div>
          </template>

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
        <div class="chat-actions" v-if="msg.text && msg.text.trim()">
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
              msg.from === 'bot' && msgHasImage(msg)
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
        ref="chatInput"
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

  <el-dialog
    v-model="nodesDialogVisible"
    :title="activeNodes?.name || ''"
    width="640px"
    class="nodes-dialog"
    append-to-body
  >
    <div class="nodes-dialog-list">
      <div
        v-for="(node, nodeIdx) in activeNodes?.nodes || []"
        :key="nodeIdx"
        class="nodes-dialog-item"
      >
        <div class="nodes-dialog-item-index">{{ nodeIdx + 1 }}</div>
        <div class="nodes-dialog-item-content">
          <template v-for="(block, blockIdx) in node" :key="blockIdx">
            <SafeHtml
              v-if="block.type === 'text'"
              :html="block.html"
              @click="handleMarkdownClick"
              class="chat-message-content"
            />

            <img
              v-else-if="block.type === 'image'"
              :src="block.content"
              class="chat-img"
              alt=""
              @click="showImagePreview(block.content)"
            />

            <audio
              v-else-if="block.type === 'audio'"
              class="chat-audio"
              controls
              preload="metadata"
              :src="block.content"
            ></audio>

            <video
              v-else-if="block.type === 'video'"
              class="chat-video"
              controls
              preload="metadata"
              :src="block.content"
            ></video>

            <span v-else-if="block.type === 'action_text'" class="chat-action-text-disabled">
              {{ block.show }}
            </span>

            <div v-else-if="block.type === 'button_frame'" class="chat-button-frame">
              <div v-for="(row, rowIdx) in block.content" :key="rowIdx" class="chat-button-row">
                <template v-for="(btn, btnIdx) in row" :key="btnIdx">
                  <a
                    v-if="isExternalUrl(btn.value)"
                    class="chat-button chat-button-link"
                    @click.prevent
                  >
                    {{ btn.show }}
                  </a>
                  <button v-else type="button" class="chat-button" disabled>
                    {{ btn.show }}
                  </button>
                </template>
              </div>
            </div>

            <div v-else-if="block.type === 'embed'" class="chat-embed">
              <div
                class="chat-embed-colorbar"
                :style="{ backgroundColor: colorToHex(block.content.color) }"
              ></div>
              <div class="chat-embed-content">
                <div class="chat-embed-title">{{ block.content.title }}</div>

                <div v-if="block.content.description" class="chat-embed-description">
                  {{ block.content.description }}
                </div>

                <div
                  v-if="block.content.fields && block.content.fields.length"
                  class="chat-embed-fields"
                >
                  <div
                    v-for="(field, fieldIdx) in block.content.fields"
                    :key="fieldIdx"
                    class="chat-embed-field"
                    :class="{ 'chat-embed-field-inline': field.inline }"
                  >
                    <div class="chat-embed-field-name">{{ field.name }}</div>
                    <div class="chat-embed-field-value">{{ field.value }}</div>
                  </div>
                </div>

                <img
                  v-if="block.content.image"
                  :src="block.content.image"
                  class="chat-embed-image"
                  alt=""
                  @click="showImagePreview(block.content.image)"
                />
                <img
                  v-if="block.content.thumbnail"
                  :src="block.content.thumbnail"
                  class="chat-embed-thumbnail"
                  alt=""
                  @click="showImagePreview(block.content.thumbnail)"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, h, useAttrs } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import linkAttributes from 'markdown-it-link-attributes'
import { v4 as uuidv4 } from 'uuid'
import { useI18n } from 'vue-i18n'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import DOMPurify from 'dompurify'
import { confirmExternalLink } from '@/components/confirmExternalLink.js'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'

const { t } = useI18n()
const inputText = ref('')
const chatInput = ref(null)
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
const nodesDialogVisible = ref(false)
const activeNodes = ref(null)
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
  if (!text) return ''

  let raw = md.render(text).replace(/\[image:([^\]]+)\]/g, (match, src) => {
    return `<img src="${src}" class="chat-img" />`
  })

  const leadingNewlines = text.match(/^\n+/)
  if (leadingNewlines) {
    const count = leadingNewlines[0].length
    raw = '<br />'.repeat(count) + raw
  }

  raw = raw.replace(/(?:<br\s*\/?>\s*)+$/, '')

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

const isDataImage = (src) => typeof src === 'string' && /^data:image\//i.test(src)

const normalizeMessageBlocks = (data) => {
  const list = Array.isArray(data) ? data : data == null ? [] : [data]
  return list
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null
      switch (item.type) {
        case 'text': {
          if (typeof item.content !== 'string') return null
          let html = renderMarkdown(item.content)
          if (list[idx + 1]?.type === 'text') {
            html += '<br />'
          }
          return { type: 'text', content: item.content, html }
        }
        case 'image':
          return isDataImage(item.content) ? { type: 'image', content: item.content } : null
        case 'audio':
          return typeof item.content === 'string' ? { type: 'audio', content: item.content } : null
        case 'video':
          return typeof item.content === 'string' ? { type: 'video', content: item.content } : null
        case 'action_text':
          return typeof item.content === 'string'
            ? {
                type: 'action_text',
                content: item.content,
                show: typeof item.show === 'string' ? item.show : item.content,
              }
            : null
        case 'button_frame':
          return Array.isArray(item.content)
            ? { type: 'button_frame', content: item.content }
            : null
        case 'embed':
          return item.content && typeof item.content === 'object'
            ? { type: 'embed', content: item.content }
            : null
        case 'nodes': {
          const content = item.content
          if (!content || typeof content !== 'object' || !Array.isArray(content.nodes)) {
            return null
          }
          return {
            type: 'nodes',
            content: {
              name: typeof content.name === 'string' ? content.name : '',
              nodes: content.nodes.map((chain) => normalizeMessageBlocks(chain)),
            },
          }
        }
        default:
          return null
      }
    })
    .filter(Boolean)
}

const renderMessageText = (data) => {
  const list = Array.isArray(data) ? data : data == null ? [] : [data]
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      if (item.type === 'text' && typeof item.content === 'string') return item.content
      if (item.type === 'action_text' && typeof item.content === 'string') {
        return item.content
      }
      return ''
    })
    .filter((s) => s !== '')
    .join('\n')
}

const nodesPreviewText = (node) => {
  if (!Array.isArray(node)) return ''
  const parts = []
  for (const block of node) {
    if (!block) continue
    if (block.type === 'text' && typeof block.content === 'string') {
      const oneLine = block.content.replace(/\s+/g, ' ').trim()
      if (oneLine) parts.push(oneLine)
    } else if (block.type === 'action_text') {
      const show = block.show || block.content || ''
      if (show) parts.push(show)
    } else if (block.type === 'image') {
      parts.push(t('chat.nodes.image'))
    } else if (block.type === 'audio') {
      parts.push(t('chat.nodes.audio'))
    } else if (block.type === 'video') {
      parts.push(t('chat.nodes.video'))
    } else if (block.type === 'button_frame') {
      parts.push(t('chat.nodes.button'))
    } else if (block.type === 'embed') {
      parts.push(block.content?.title || t('chat.nodes.embed'))
    }
  }
  return parts.join(' ')
}

const isExternalUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value)

const colorToHex = (color) => {
  const toHex = (n) =>
    '#' +
    (Number.isFinite(n) ? Math.floor(n) & 0xffffff : 0x0091ff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()

  if (typeof color === 'number') return toHex(color)

  if (typeof color === 'string') {
    const s = color.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) return s.toUpperCase()
    if (/^0x[0-9a-fA-F]+$/.test(s)) return toHex(parseInt(s, 16))
    const n = Number(s)
    if (Number.isFinite(n)) return toHex(n)
  }

  return '#0091FF'
}

const formatTimestamp = (ts) => {
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return ''
  return new Date(n * 1000).toLocaleString()
}

const msgHasImage = (msg) =>
  Array.isArray(msg?.blocks) && msg.blocks.some((b) => b && b.type === 'image')

const focusChatInput = () => {
  nextTick(() => {
    chatInput.value?.focus()
  })
}

const sendUserMessage = (text) => {
  const content = typeof text === 'string' ? text : ''
  if (!content) return

  const uuid = uuidv4()
  messages.value.push({
    from: 'user',
    blocks: [{ type: 'text', content, html: renderMarkdown(content) }],
    text: content,
    id: uuid,
    showEmojiPicker: false,
    reactions: {},
    userReactions: [],
  })

  if (!IS_DEMO) {
    websocket.value?.send(
      JSON.stringify({
        action: 'send',
        message: [{ type: 'text', content }],
        id: uuid,
      }),
    )
  }
  inputText.value = ''
  scrollToBottom()
}

const handleActionTextClick = (block) => {
  const text = block && typeof block.content === 'string' ? block.content : ''
  if (!text) return

  inputText.value = text
  focusChatInput()
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

const handleExternalButtonClick = (event, url) => {
  event.preventDefault()
  confirmExternalLink(url, t)
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
          const content = parsed.message?.[0]?.content ?? ''
          messages.value.push({
            from: 'user',
            blocks: [{ type: 'text', content, html: renderMarkdown(content) }],
            text: content,
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
          blocks: normalizeMessageBlocks(data.message),
          text: renderMessageText(data.message),
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
  sendUserMessage(text)
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

const openNodesDialog = (block) => {
  activeNodes.value = block?.content || null
  nodesDialogVisible.value = true
}

const SafeHtml = {
  props: { html: { type: String, default: '' } },
  emits: ['click'],
  setup(props, { emit }) {
    const root = ref(null)
    const attrs = useAttrs()

    const sanitizeAndSet = (val) => {
      if (!root.value) return
      const clean = DOMPurify.sanitize(val || '', {
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
      root.value.innerHTML = clean
    }

    onMounted(() => {
      sanitizeAndSet(props.html)
    })

    watch(
      () => props.html,
      (v) => {
        nextTick(() => sanitizeAndSet(v))
      },
    )

    const onClick = (e) => emit('click', e)

    return () => h('div', { ref: root, onClick, ...attrs })
  },
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
    const textWithoutImages = (msg.text || '').trim()
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
  display: block;
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

.chat-audio {
  max-width: 100%;
  margin: 8px 0;
  display: block;
}

.chat-video {
  display: block;
  max-width: 100%;
  max-height: 400px;
  margin: 8px 0;
  background-color: #000;
}

.chat-message-content {
  display: contents;
}

.chat-message-content a {
  color: var(--el-color-primary);
}

.chat-action-text {
  color: var(--el-color-primary);
  cursor: pointer;
  white-space: nowrap;
}

.chat-action-text:hover {
  text-decoration: underline;
}

.chat-button-frame {
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chat-button {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  text-decoration: none;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.chat-button-link {
  text-decoration: underline;
}

.chat-button:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.chat-button:active,
.chat-button-clicked {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.chat-button-clicked:hover,
.chat-button:disabled:hover {
  color: white;
}

.chat-button:disabled {
  cursor: default;
}

.chat-embed {
  display: flex;
  max-width: 340px;
  margin: 8px 0;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.chat-embed-colorbar {
  width: 4px;
  flex-shrink: 0;
}

.chat-embed-content {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
}

.chat-embed-title {
  font-size: 15px;
  font-weight: 600;
  word-break: break-word;
}

a.chat-embed-title-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

a.chat-embed-title-link:hover {
  text-decoration: underline;
}

.chat-embed-description {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-embed-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 8px;
}

.chat-embed-field {
  width: 100%;
  min-width: 0;
}

.chat-embed-field.chat-embed-field-inline {
  width: auto;
  flex: 1 1 40%;
}

.chat-embed-field-name {
  font-size: 13px;
  font-weight: 600;
}

.chat-embed-field-value {
  font-size: 13px;
  opacity: 0.9;
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-embed-image {
  display: block;
  max-width: 100%;
  margin-top: 8px;
  border-radius: 4px;
  cursor: pointer;
}

.chat-embed-thumbnail {
  display: block;
  max-width: 80px;
  max-height: 80px;
  margin-top: 8px;
  border-radius: 4px;
  cursor: pointer;
}

.chat-embed-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
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

.chat-nodes {
  margin: 4px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  cursor: pointer;
  min-width: 220px;
  max-width: 320px;
  transition: background-color 0.2s;
}

.chat-nodes:hover {
  background: var(--el-fill-color);
}

.chat-nodes-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 8px;
  word-break: break-word;
}

.chat-nodes-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.9;
  padding: 2px 0;
}

.chat-nodes-preview-index {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.chat-nodes-preview-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-nodes-more {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.7;
}

.chat-action-text-disabled {
  color: inherit;
  cursor: default;
  white-space: nowrap;
}

.nodes-dialog-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.nodes-dialog-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.nodes-dialog-item-index {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.nodes-dialog-item-content {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
</style>
