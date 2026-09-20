<template>
  <div class="send-box">
    <input
      ref="imageFileInput"
      class="chat-image-input"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileChange"
    />
    <div class="chat-composer-row">
      <el-tooltip :content="$t('chat.button.image')" placement="top">
        <el-button
          class="image-button"
          circle
          :disabled="connectionStatus !== 'connected' || images.length >= MAX_IMAGES"
          @click="openImagePicker"
        >
          <i class="mdi mdi-image-plus-outline"></i>
        </el-button>
      </el-tooltip>
      <el-input
        ref="chatInput"
        :model-value="text"
        :placeholder="$t('chat.input.send')"
        class="chat-send-input"
        type="textarea"
        resize="none"
        clearable
        autosize
        :disabled="connectionStatus !== 'connected'"
        @update:model-value="$emit('update:text', $event)"
        @keydown.enter="$emit('enter', $event)"
      />
      <el-button
        type="primary"
        style="margin-left: 10px"
        :disabled="connectionStatus !== 'connected' || (!text.trim() && !images.length)"
        @click="$emit('send')"
      >
        {{ $t('chat.button.send') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MAX_IMAGES } from '@/utils/chatMessage.js'

defineProps({
  text: {
    type: String,
    default: '',
  },
  images: {
    type: Array,
    default: () => [],
  },
  connectionStatus: {
    type: String,
    default: 'connecting',
  },
})

const emit = defineEmits(['update:text', 'send', 'enter', 'select-files'])

const imageFileInput = ref(null)
const chatInput = ref(null)

const openImagePicker = () => {
  imageFileInput.value?.click()
}

const handleFileChange = (event) => {
  const input = event.target
  const files = Array.from(input.files || [])
  input.value = ''
  emit('select-files', files)
}

const focus = () => {
  chatInput.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.send-box {
  height: auto;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 10px 20px;
  background: #f3f3f3;
  border-top: 1px solid #e0e0e0;
}

.chat-image-input {
  display: none;
}

.image-button {
  flex-shrink: 0;
  margin-right: 8px;
}

.chat-composer-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.chat-send-input {
  min-width: 0;
  flex: 1;
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
</style>
