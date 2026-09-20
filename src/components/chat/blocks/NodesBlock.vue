<template>
  <div class="chat-nodes" @click="$emit('click', block)">
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
      <span class="chat-nodes-preview-text">{{ nodesPreviewText(node, t) }}</span>
    </div>
    <div v-if="block.content.nodes.length > 3" class="chat-nodes-more">
      {{ $t('chat.nodes.more', { count: block.content.nodes.length - 3 }) }}
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { nodesPreviewText } from '@/utils/chatMessage.js'

defineProps({
  block: {
    type: Object,
    required: true,
  },
})

defineEmits(['click'])

const { t } = useI18n()
</script>

<style scoped>
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
</style>
