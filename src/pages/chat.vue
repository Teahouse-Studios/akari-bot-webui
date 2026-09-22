<template>
  <div
    class="chat-container"
    :class="{ 'drag-over': isDraggingOver }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleImageDrop"
  >
    <ChatHeader :connection-status="connectionStatus" @reset="resetChat" />

    <div ref="chatBox" class="chat-box">
      <ChatPlaceholder
        v-if="messages.length === 0"
        :command-prefix="commandPrefix"
        :is-mobile-view="isMobileView"
      />

      <ChatMessage
        v-for="(msg, idx) in messages"
        :key="msg.id || idx"
        :msg="msg"
        :debug="debug"
        :copied="copiedId === msg.id"
        :emoji-theme="emojiTheme"
        :group-names="groupNames"
        @copy="copyMessage"
        @reaction-toggle="(emoji) => toggleReaction(msg, emoji)"
        @reaction-select="(emoji) => selectEmoji(msg, emoji)"
        @emoji-picker-open="openEmojiPicker(msg)"
        @emoji-picker-visible="msg.showEmojiPicker = $event"
        @markdown-click="handleMarkdownClick"
        @image-click="showImagePreview"
        @action-text-click="handleActionTextClick"
        @button-click="handleButtonClick"
        @external-button-click="handleExternalButtonClick"
        @nodes-click="openNodesDialog"
      />
    </div>

    <PendingImagesBar
      :images="pendingImages"
      @preview-image="showImagePreview"
      @remove-image="removePendingImage"
    />

    <ChatInput
      ref="chatInput"
      v-model:text="inputText"
      :images="pendingImages"
      :connection-status="connectionStatus"
      @send="sendMessage"
      @enter="handleEnterKey"
      @select-files="addImageFiles"
    />

    <div class="chat-tip">
      {{ $t('chat.tip') }}
    </div>

    <ImagePreview
      v-model:visible="fullscreenPreviewVisible"
      :src="previewImageSrc"
      @open-new-window="openImageInNewWindow"
    />
  </div>

  <NodesDialog
    v-model:visible="nodesDialogVisible"
    :nodes="activeNodes"
    @image-click="showImagePreview"
    @markdown-click="handleMarkdownClick"
    @external-button-click="handleExternalButtonClick"
  />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatPlaceholder from '@/components/chat/ChatPlaceholder.vue'
import ImagePreview from '@/components/chat/ImagePreview.vue'
import NodesDialog from '@/components/chat/NodesDialog.vue'
import PendingImagesBar from '@/components/chat/PendingImagesBar.vue'
import { confirmExternalLink } from '@/components/confirmExternalLink.js'
import { useChatImages } from '@/composables/useChatImages.js'
import { useChatSocket } from '@/composables/useChatSocket.js'
import LocalStorageJson from '@/localStorageJson.js'

const { t } = useI18n()

const {
  messages,
  connectionStatus,
  commandPrefix,
  sendUserMessage,
  handleButtonClick,
  openEmojiPicker,
  selectEmoji,
  toggleReaction,
  resetChat,
} = useChatSocket()

const {
  pendingImages,
  isDraggingOver,
  addImageFiles,
  removePendingImage,
  clearPendingImages,
  handleDragOver,
  handleDragLeave,
  handleImageDrop,
} = useChatImages(connectionStatus)

const inputText = ref('')
const chatBox = ref(null)
const chatInput = ref(null)
const copiedId = ref(null)
const debug = ref(false)
const isMobileView = ref(window.innerWidth < 1024)
const fullscreenPreviewVisible = ref(false)
const previewImageSrc = ref('')
const nodesDialogVisible = ref(false)
const activeNodes = ref(null)
const isDarkMode = ref(LocalStorageJson.getItem('isDarkMode') === 'true')
const observer = ref(null)

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

const focusChatInput = () => {
  nextTick(() => {
    chatInput.value?.focus()
  })
}

const sendMessage = () => {
  const sent = sendUserMessage(inputText.value.trim(), pendingImages.value)
  if (!sent) return
  inputText.value = ''
  clearPendingImages()
  scrollToBottom()
}

const handleActionTextClick = (block) => {
  const text = block && typeof block.content === 'string' ? block.content : ''
  if (!text) return

  inputText.value = text
  focusChatInput()
}

const handleExternalButtonClick = (payload) => {
  payload.event.preventDefault()
  confirmExternalLink(payload.url, t)
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

const showImagePreview = (src) => {
  previewImageSrc.value = src
  fullscreenPreviewVisible.value = true
}

const openImageInNewWindow = (src) => {
  if (src) window.open(src, '_blank')
}

const openNodesDialog = (block) => {
  activeNodes.value = block?.content || null
  nodesDialogVisible.value = true
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

const handleResize = () => {
  isMobileView.value = window.innerWidth < 1024
}

const handleEnterKey = (event) => {
  if (isMobileView.value) return
  if (event.shiftKey) return
  event.preventDefault()
  sendMessage()
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
)

onMounted(() => {
  window.addEventListener('resize', handleResize)

  const html = document.documentElement
  isDarkMode.value = html.classList.contains('dark')

  observer.value = new MutationObserver(() => {
    isDarkMode.value = html.classList.contains('dark')
  })

  observer.value.observe(html, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.chat-container {
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  overflow: hidden;
}

.chat-container :deep(.chat-header),
.chat-container :deep(.pending-images-bar),
.chat-container :deep(.send-box),
.chat-tip {
  flex: 0 0 auto;
}

.chat-container.drag-over {
  outline: 2px dashed var(--el-color-primary);
  outline-offset: -4px;
}

.chat-box {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--el-fill-color-light);
}

.chat-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  margin: 10px 0 0 0;
}
</style>
