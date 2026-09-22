<template>
  <SafeHtml
    class="chat-message-content"
    :html="block.html"
    @click="$emit('markdown-click', $event)"
  />
</template>

<script setup>
import SafeHtml from '@/components/chat/SafeHtml.vue'

defineProps({
  block: {
    type: Object,
    required: true,
  },
})

defineEmits(['markdown-click'])
</script>

<style>
/* Markdown 渲染出的 HTML 不带 scoped 属性，因此这里使用全局样式 */
.chat-img {
  display: block;
  max-width: 80%;
  max-height: 300px;
  margin: 8px 0;
  object-fit: contain;
  cursor: pointer;
}

.chat-blockquote {
  border-left: 4px solid var(--el-border-color-dark);
  padding-left: 10px;
  margin: 10px 0;
}

.chat-pre {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  padding: 15px;
  border-radius: 8px;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.chat-code {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color);
  border: 1px solid var(--el-border-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

.chat-message-content {
  display: contents;
}

.chat-message-content a {
  color: var(--el-color-primary);
}
</style>
