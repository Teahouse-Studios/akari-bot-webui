<template>
  <div v-if="isDemoMode" class="demo-watermark">
    <div
      v-for="(item, index) in watermarks"
      :key="index"
      class="watermark-item"
      :style="{ top: item.top + 'px', left: item.left + 'px' }"
    >
      DEMO MODE
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { IS_DEMO } from '@/const'

const isDemoMode = IS_DEMO
const watermarks = ref([])
const spacingX = 300
const spacingY = 200

const generateWatermarks = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  const cols = Math.ceil(width / spacingX)
  const rows = Math.ceil(height / spacingY)
  const marks = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      marks.push({
        top: r * spacingY,
        left: c * spacingX,
      })
    }
  }
  watermarks.value = marks
}

onMounted(() => {
  if (isDemoMode) {
    generateWatermarks()
    window.addEventListener('resize', generateWatermarks)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', generateWatermarks)
})
</script>

<style scoped>
.demo-watermark {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.watermark-item {
  position: absolute;
  font-size: 36px;
  color: rgba(0, 0, 0, 0.1);
  transform: rotate(-30deg);
  white-space: nowrap;
  user-select: none;
}
</style>
