<template>
  <el-card class="module-card" shadow="never">
    <div class="card-header">
      <h3 class="dashboard-card-title">
        <i class="mdi mdi-puzzle"></i>
        {{ $t('analytics.module.title') }}
      </h3>
    </div>

    <div ref="chartContainer" class="chart-container"></div>
  </el-card>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BarChart } from 'echarts/charts'
import {
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components'
import { init, use } from 'echarts/core'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { getChartTheme } from '@/utils/themeColor.js'

use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  DataZoomComponent,
])

const props = defineProps({
  // [{ module_name, count, percent }]
  modules: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()

const chartContainer = ref(null)
const chartInstance = ref(null)
let resizeObserver = null

/** 空 module_name 表示未归属模块的调用，本地化为「未知模块」 */
const chartData = computed(() =>
  props.modules.map((item) => ({
    name: item.module_name || t('analytics.module.unknown'),
    count: item.count,
    percent: item.percent,
  })),
)

const renderChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.dispose()
  const chartDom = chartContainer.value
  if (!chartDom || chartDom.offsetWidth === 0) return

  const needZoom = chartData.value.length > 12
  const theme = getChartTheme()
  const chart = init(chartDom)
  chart.setOption({
    color: [theme.primary],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 10, right: 20, top: 20, bottom: needZoom ? 40 : 10, containLabel: true },
    dataZoom: needZoom
      ? [
          { type: 'slider', start: 0, end: 100 },
          { type: 'inside', start: 0, end: 100 },
        ]
      : undefined,
    xAxis: {
      type: 'category',
      data: chartData.value.map((item) => item.name),
      ...theme.axis,
      axisLabel: { ...theme.axis.axisLabel, interval: 0, rotate: needZoom ? 40 : 0, fontSize: 11 },
    },
    yAxis: { type: 'value', ...theme.axis },
    series: [
      {
        name: t('analytics.module.table.count'),
        type: 'bar',
        barMaxWidth: 36,
        // 柱子顶部粉、底部浅紫，圆角呼应整体的圆润造型
        itemStyle: {
          borderRadius: [8, 8, 2, 2],
          color: theme.verticalGradient(theme.primary, theme.secondary),
        },
        data: chartData.value.map((item) => item.count),
      },
    ],
  })
  chartInstance.value = chart
}

const resizeChart = () => {
  if (chartInstance.value) chartInstance.value.resize()
}

watch(
  () => props.modules,
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
.module-card {
  line-height: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.chart-container {
  height: 320px;
  width: 100%;
}
</style>
