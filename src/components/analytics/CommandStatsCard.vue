<template>
  <el-card class="fixed-card" shadow="never" v-loading="loading">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-chart-line"></i>
        {{ $t('dashboard.analytics.command.title') }}
      </h3>
      <el-select
        :model-value="selectedDays"
        class="time-range-select"
        @update:model-value="$emit('update:selectedDays', $event)"
      >
        <el-option :label="$t('dashboard.analytics.command.select.1day')" value="1"></el-option>
        <el-option :label="$t('dashboard.analytics.command.select.3days')" value="3"></el-option>
        <el-option :label="$t('dashboard.analytics.command.select.7days')" value="7"></el-option>
        <el-option :label="$t('dashboard.analytics.command.select.30days')" value="30"></el-option>
        <el-option
          :label="$t('dashboard.analytics.command.select.365days')"
          value="365"
        ></el-option>
      </el-select>
    </div>
    <div class="statistics-content">
      <div class="data-group">
        <strong class="data-title">{{ $t('dashboard.analytics.command.label.total') }}</strong>
        <span class="data-text">{{ count || 0 }}</span>
      </div>
      <div class="data-group">
        <strong class="data-title">{{ $t('dashboard.analytics.command.label.average') }}</strong>
        <span class="data-text">{{ averageCount || 0 }}</span>
      </div>
      <div class="data-group">
        <strong class="data-title">{{
          $t('dashboard.analytics.command.label.change_rate')
        }}</strong>
        <span
          :class="{
            positive: changeRate > 0,
            negative: changeRate < 0,
            'data-text': changeRate === 0,
          }"
        >
          {{ changeRate > 0 ? `+${changeRate}%` : changeRate === 0 ? '0%' : `${changeRate}%` }}
        </span>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container"></div>
  </el-card>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LineChart } from 'echarts/charts'
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

use([
  LineChart,
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
  // [{ date, count }]
  trendData: {
    type: Array,
    default: () => [],
  },
  count: {
    type: Number,
    default: 0,
  },
  averageCount: {
    type: Number,
    default: 0,
  },
  changeRate: {
    type: Number,
    default: 0,
  },
  selectedDays: {
    type: String,
    default: '1',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:selectedDays'])

const { t } = useI18n()

const chartContainer = ref(null)
const chartInstance = ref(null)
let resizeObserver = null

const getPrimaryColor = () => {
  return getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()
}

const renderChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.dispose()
  const chartDom = chartContainer.value
  if (!chartDom || chartDom.offsetWidth === 0) return

  const chart = init(chartDom)
  chart.setOption({
    color: [getPrimaryColor()],
    tooltip: { trigger: 'axis' },
    dataZoom: [
      { type: 'slider', start: 0, end: 100 },
      { type: 'inside', start: 0, end: 100 },
    ],
    xAxis: { type: 'category', data: props.trendData.map((item) => item.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('dashboard.analytics.command.chart.command'),
        type: 'line',
        smooth: true,
        data: props.trendData.map((item) => item.count),
      },
    ],
  })
  chartInstance.value = chart
}

const resizeChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.resize()
}

watch(
  () => props.trendData,
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
.el-card {
  line-height: 1;
}

.fixed-card {
  height: 450px;
  display: flex;
  flex-direction: column;
}

.fixed-card .el-card__body {
  flex: 1;
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

.time-range-select {
  width: 150px;
}

.statistics-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.data-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.data-title,
.data-text {
  display: inline-block;
}

.data-title {
  flex: 1 1 100%;
  margin-bottom: 4px;
  color: #333;
  cursor: default;
}

.dark .data-title {
  color: white;
}

.data-text {
  flex: 1 1 100%;
  color: #666;
  text-overflow: ellipsis;
}

.dark .data-text {
  color: #ccc;
}

.positive {
  color: forestgreen;
}

.negative {
  color: red;
}

.chart-container {
  height: 250px;
  width: 100%;
}
</style>
