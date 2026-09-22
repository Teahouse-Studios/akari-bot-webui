<template>
  <el-dialog
    :model-value="visible"
    :title="nodes?.name || ''"
    width="640px"
    class="nodes-dialog"
    append-to-body
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="nodes-dialog-list">
      <div v-for="(node, nodeIdx) in nodes?.nodes || []" :key="nodeIdx" class="nodes-dialog-item">
        <div class="nodes-dialog-item-index">{{ nodeIdx + 1 }}</div>
        <div class="nodes-dialog-item-content">
          <MessageBlocks
            :blocks="node"
            disabled
            @image-click="$emit('image-click', $event)"
            @markdown-click="$emit('markdown-click', $event)"
            @external-button-click="$emit('external-button-click', $event)"
          />
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import MessageBlocks from '@/components/chat/MessageBlocks.vue'

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  nodes: {
    type: Object,
    default: null,
  },
})

defineEmits(['update:visible', 'image-click', 'markdown-click', 'external-button-click'])
</script>

<style scoped>
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
  color: var(--el-color-white);
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
