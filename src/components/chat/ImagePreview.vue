<template>
  <div v-if="rendered" class="fullscreen-preview" :class="{ show: animationShown }" @click="close">
    <img :src="src" class="fullscreen-image" alt="" @click="$emit('open-new-window', src)" />
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  src: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'open-new-window'])

// 保留关闭时的淡出动画：先播放动画再卸载元素
const EXIT_DURATION = 300
const rendered = ref(false)
const animationShown = ref(false)
let exitTimer = null

const close = () => emit('update:visible', false)

watch(
  () => props.visible,
  (value) => {
    clearTimeout(exitTimer)
    if (value) {
      rendered.value = true
      animationShown.value = false
      nextTick(() => {
        exitTimer = setTimeout(() => {
          animationShown.value = true
        }, 10)
      })
    } else {
      animationShown.value = false
      if (rendered.value) {
        exitTimer = setTimeout(() => {
          rendered.value = false
        }, EXIT_DURATION)
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.fullscreen-preview {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 60px);
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-preview.show {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.85);
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  display: block;
  transform: scale(0.8);
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  opacity: 0;
}

.fullscreen-preview.show .fullscreen-image {
  transform: scale(1);
  opacity: 1;
}

.fullscreen-preview img {
  cursor: pointer;
  object-fit: contain;
}
</style>
