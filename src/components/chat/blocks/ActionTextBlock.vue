<template>
  <span v-if="disabled" class="chat-action-text-disabled">
    {{ block.show }}
  </span>
  <span v-else class="chat-action-text" @click="$emit('click', block)">
    {{ block.show }}
  </span>
</template>

<script setup>
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

defineEmits(['click'])
</script>

<style scoped>
.chat-action-text {
  color: var(--el-color-primary);
  cursor: pointer;
  white-space: nowrap;
}

.chat-action-text:hover {
  text-decoration: underline;
}

.chat-action-text-disabled {
  color: inherit;
  cursor: default;
  white-space: nowrap;
}
</style>
