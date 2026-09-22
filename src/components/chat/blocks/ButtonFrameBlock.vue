<template>
  <div class="chat-button-frame">
    <div v-for="(row, rowIdx) in block.content" :key="rowIdx" class="chat-button-row">
      <template v-for="(btn, btnIdx) in row" :key="btnIdx">
        <a
          v-if="isExternalUrl(btn.value) && !disabled"
          :href="btn.value"
          target="_blank"
          rel="noopener"
          class="chat-button chat-button-link"
          @click="$emit('external-button-click', { event: $event, url: btn.value })"
        >
          {{ btn.show }}
        </a>
        <a v-else-if="isExternalUrl(btn.value)" class="chat-button chat-button-link" @click.prevent>
          {{ btn.show }}
        </a>
        <button v-else-if="disabled" type="button" class="chat-button" disabled>
          {{ btn.show }}
        </button>
        <button
          v-else
          type="button"
          class="chat-button"
          :class="{ 'chat-button-clicked': btn._clicked }"
          :disabled="btn._clicked"
          @click="$emit('button-click', btn)"
        >
          {{ btn.show }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { isExternalUrl } from '@/utils/chatMessage.js'

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

defineEmits(['button-click', 'external-button-click'])
</script>

<style scoped>
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
  color: var(--el-color-white);
}

.chat-button-clicked:hover,
.chat-button:disabled:hover {
  color: var(--el-color-white);
}

.chat-button:disabled {
  cursor: default;
}
</style>
