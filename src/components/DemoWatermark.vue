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

<script>
import { IS_DEMO } from '@/const'

export default {
  name: 'DemoWatermark',
  data() {
    return {
      isDemoMode: IS_DEMO,
      watermarks: [],
      spacingX: 300,
      spacingY: 200,
    }
  },
  mounted() {
    if (this.isDemoMode) {
      this.generateWatermarks()
      window.addEventListener('resize', this.generateWatermarks)
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.generateWatermarks)
  },
  methods: {
    generateWatermarks() {
      const width = window.innerWidth
      const height = window.innerHeight
      const cols = Math.ceil(width / this.spacingX)
      const rows = Math.ceil(height / this.spacingY)
      const marks = []

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          marks.push({
            top: r * this.spacingY,
            left: c * this.spacingX,
          })
        }
      }
      this.watermarks = marks
    },
  },
}
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
