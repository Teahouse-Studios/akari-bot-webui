<template>
  <template v-for="(block, blockIdx) in blocks" :key="blockIdx">
    <TextBlock
      v-if="block.type === 'text'"
      :block="block"
      @markdown-click="$emit('markdown-click', $event)"
    />

    <MediaBlock
      v-else-if="block.type === 'image' || block.type === 'audio' || block.type === 'video'"
      :block="block"
      @image-click="$emit('image-click', $event)"
    />

    <ActionTextBlock
      v-else-if="block.type === 'action_text'"
      :block="block"
      :disabled="disabled"
      @click="$emit('action-text-click', $event)"
    />

    <ButtonFrameBlock
      v-else-if="block.type === 'button_frame'"
      :block="block"
      :disabled="disabled"
      @button-click="$emit('button-click', $event)"
      @external-button-click="$emit('external-button-click', $event)"
    />

    <EmbedBlock
      v-else-if="block.type === 'embed'"
      :block="block"
      :disabled="disabled"
      @image-click="$emit('image-click', $event)"
      @external-button-click="$emit('external-button-click', $event)"
    />

    <NodesBlock
      v-else-if="block.type === 'nodes' && !disabled"
      :block="block"
      @click="$emit('nodes-click', $event)"
    />
  </template>
</template>

<script setup>
import ActionTextBlock from '@/components/chat/blocks/ActionTextBlock.vue'
import ButtonFrameBlock from '@/components/chat/blocks/ButtonFrameBlock.vue'
import EmbedBlock from '@/components/chat/blocks/EmbedBlock.vue'
import MediaBlock from '@/components/chat/blocks/MediaBlock.vue'
import NodesBlock from '@/components/chat/blocks/NodesBlock.vue'
import TextBlock from '@/components/chat/blocks/TextBlock.vue'

defineProps({
  blocks: {
    type: Array,
    default: () => [],
  },
  // 只读模式：用于节点预览弹窗，按钮与链接不响应点击
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'markdown-click',
  'image-click',
  'action-text-click',
  'button-click',
  'external-button-click',
  'nodes-click',
])
</script>
