<template>
  <div class="chat-embed">
    <div
      class="chat-embed-colorbar"
      :style="{ backgroundColor: colorToHex(block.content.color) }"
    ></div>
    <div class="chat-embed-content">
      <a
        v-if="block.content.url && !disabled"
        :href="block.content.url"
        target="_blank"
        rel="noopener"
        class="chat-embed-title chat-embed-title-link"
        @click="$emit('external-button-click', { event: $event, url: block.content.url })"
      >
        {{ block.content.title }}
      </a>
      <div v-else class="chat-embed-title">{{ block.content.title }}</div>

      <div v-if="block.content.description" class="chat-embed-description">
        {{ block.content.description }}
      </div>

      <div v-if="block.content.fields && block.content.fields.length" class="chat-embed-fields">
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
        @click="$emit('image-click', block.content.image)"
      />
      <img
        v-if="block.content.thumbnail"
        :src="block.content.thumbnail"
        class="chat-embed-thumbnail"
        alt=""
        @click="$emit('image-click', block.content.thumbnail)"
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
</template>

<script setup>
import { colorToHex, formatTimestamp } from '@/utils/chatMessage.js'

defineProps({
  block: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['image-click', 'external-button-click'])
</script>

<style scoped>
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
