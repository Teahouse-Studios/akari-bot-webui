<template>
  <div ref="chartContainer" class="sparkline" :style="{ height: `${height}px` }"></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  // 采样序列（按时间先后排列的数值数组）
  values: {
    type: Array,
    default: () => [],
  },
  height: {
    type: Number,
    default: 40,
  },
  // 留空则跟随主题色
  color: {
    type: String,
    default: '',
  },
})

const chartContainer = ref(null)
const chartInstance = ref(null)
let resizeObserver = null

const getLineColor = () =>
  props.color ||
  getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()

const renderChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.dispose()

  const chartDom = chartContainer.value
  if (!chartDom || chartDom.offsetWidth === 0) return

  const values = props.values.length ? props.values : [0]
  const color = getLineColor()

  const chart = init(chartDom)
  chart.setOption({
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.16 },
        data: values,
      },
    ],
  })
  chartInstance.value = chart
}

const resizeChart = () => {
  if (chartInstance.value) chartInstance.value.resize()
}

watch(
  () => props.values,
  () => {
    renderChart()
  },
)

onMounted(() => {
  renderChart()

  resizeObserver = new ResizeObserver(resizeChart)
  if (chartContainer.value) resizeObserver.observe(chartContainer.value)
})

onBeforeUnmount(() => {
  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value)
    resizeObserver.disconnect()
  }
  if (chartInstance.value) chartInstance.value.dispose()
})
</script>

<style scoped>
.sparkline {
  width: 100%;
}
</style>
