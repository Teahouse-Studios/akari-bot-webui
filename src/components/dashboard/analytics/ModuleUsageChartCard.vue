<template>
  <el-card class="module-card" shadow="never" v-loading="loading">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-puzzle"></i>
        {{ $t('analytics.module.title') }}
      </h3>
      <el-select
        :model-value="limit"
        class="limit-select"
        @update:model-value="$emit('update:limit', $event)"
      >
        <el-option
          v-for="option in limitOptions"
          :key="option"
          :label="String(option)"
          :value="option"
        />
      </el-select>
    </div>

    <div v-show="modules.length" ref="chartContainer" class="chart-container"></div>
    <el-empty v-if="!modules.length" :description="$t('analytics.empty')" :image-size="60" />

    <div v-if="truncated" class="truncated-hint">
      {{ $t('analytics.module.truncated', { total: totalModules, limit: modules.length }) }}
    </div>
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
import { ANALYTICS_LIMIT_OPTIONS } from '@/utils/analytics.js'

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
  totalModules: {
    type: Number,
    default: 0,
  },
  limit: {
    type: Number,
    default: 50,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:limit'])

const { t } = useI18n()

const limitOptions = ANALYTICS_LIMIT_OPTIONS
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

const truncated = computed(() => props.totalModules > props.modules.length)

const getPrimaryColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()

const renderChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.dispose()
  const chartDom = chartContainer.value
  if (!chartDom || chartDom.offsetWidth === 0 || !chartData.value.length) return

  const needZoom = chartData.value.length > 12
  const chart = init(chartDom)
  chart.setOption({
    color: [getPrimaryColor()],
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
      axisLabel: { interval: 0, rotate: needZoom ? 40 : 0, fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('analytics.module.table.count'),
        type: 'bar',
        barMaxWidth: 36,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
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

h3 {
  cursor: default;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.limit-select {
  width: 110px;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.truncated-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #888;
}

.dark .truncated-hint {
  color: #aaa;
}
</style>
