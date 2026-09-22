<template>
  <div class="chat-message-wrapper" :class="msg.from" :data-id="msg.id">
    <div class="chat-message" :class="msg.from">
      <MessageBlocks
        :blocks="msg.blocks"
        @markdown-click="$emit('markdown-click', $event)"
        @image-click="$emit('image-click', $event)"
        @action-text-click="$emit('action-text-click', $event)"
        @button-click="$emit('button-click', $event)"
        @external-button-click="$emit('external-button-click', $event)"
        @nodes-click="$emit('nodes-click', $event)"
      />

      <div v-if="debug" class="debug-uuid">{{ msg.id }}</div>
    </div>

    <div class="chat-reactions">
      <el-button
        v-for="(count, emoji) in msg.reactions"
        :key="emoji"
        class="reaction-button"
        size="small"
        :class="{ active: userReacted(emoji) }"
        @click="$emit('reaction-toggle', emoji)"
      >
        {{ emoji }} {{ count }}
      </el-button>

      <el-popover
        :placement="msg.from === 'bot' ? 'bottom-end' : 'bottom-start'"
        trigger="manual"
        :visible="msg.showEmojiPicker"
        width="310"
        @update:visible="$emit('emoji-picker-visible', $event)"
      >
        <EmojiPicker
          :key="emojiTheme"
          :native="true"
          :disable-skin-tones="true"
          :display-recent="true"
          :theme="emojiTheme"
          :group-names="groupNames"
          :static-texts="{ placeholder: $t('emojipicker.placeholder') }"
          @select="$emit('reaction-select', $event)"
        />
        <template #reference>
          <el-button
            circle
            size="small"
            class="reaction-button"
            @click="$emit('emoji-picker-open')"
          >
            <i class="mdi mdi-plus"></i>
          </el-button>
        </template>
      </el-popover>
    </div>

    <div v-if="msg.text && msg.text.trim()" class="chat-actions">
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
          msg.from === 'bot' && msgHasImage(msg) ? $t('chat.button.copy_text') : $t('button.copy')
        "
        placement="bottom"
      >
        <el-button class="copy-button" circle size="small" @click="$emit('copy', msg)">
          <i :class="copied ? 'mdi mdi-check' : 'mdi mdi-content-copy'"></i>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import MessageBlocks from '@/components/chat/MessageBlocks.vue'
import { msgHasImage } from '@/utils/chatMessage.js'

const props = defineProps({
  msg: {
    type: Object,
    required: true,
  },
  debug: {
    type: Boolean,
    default: false,
  },
  copied: {
    type: Boolean,
    default: false,
  },
  emojiTheme: {
    type: String,
    default: 'light',
  },
  groupNames: {
    type: Object,
    default: () => ({}),
  },
})

defineEmits([
  'copy',
  'reaction-toggle',
  'reaction-select',
  'emoji-picker-open',
  'emoji-picker-visible',
  'markdown-click',
  'image-click',
  'action-text-click',
  'button-click',
  'external-button-click',
  'nodes-click',
])

const userReacted = (emoji) => props.msg.userReactions?.includes(emoji)
</script>

<style scoped>
.chat-message {
  margin: 12px 20px;
  line-height: 1.6;
  display: inline-block;
  max-width: 70%;
  border-radius: 10px;
  padding: 10px;
  word-wrap: break-word;
  word-break: break-word;
}

.chat-message.user {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  align-self: flex-end;
  border-top-right-radius: 0;
}

.chat-message.bot {
  background-color: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  align-self: flex-start;
  border-top-left-radius: 0;
}

.chat-message.user,
.chat-message.user .chat-message-content {
  color: inherit;
}

.chat-message.user a,
.chat-message.user .chat-message-content a {
  color: currentColor !important;
  text-decoration: underline;
}

.debug-uuid {
  margin-top: 4px;
  font-size: 10px;
  color: var(--el-text-color-regular);
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
  background: var(--el-bg-color-overlay);
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
  color: var(--el-color-white);
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
  color: var(--el-text-color-secondary);
  background-color: transparent;
}
</style>
