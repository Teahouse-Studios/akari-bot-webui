<template>
  <el-row :gutter="20">
    <el-col :span="16" :xs="24">
      <el-card :body-style="{ height: '360px' }" shadow="never" v-loading="loading">
        <div class="card-header">
          <h3>
            <i class="mdi mdi-chart-line"></i>
            {{ $t('dashboard.analytics.command.title') }}
          </h3>
          <el-select v-model="selectedDays" @change="onTimeRangeChange" class="time-range-select">
            <el-option :label="$t('dashboard.analytics.command.select.1day')" value="1"></el-option>
            <el-option
              :label="$t('dashboard.analytics.command.select.3days')"
              value="3"
            ></el-option>
            <el-option
              :label="$t('dashboard.analytics.command.select.7days')"
              value="7"
            ></el-option>
            <el-option
              :label="$t('dashboard.analytics.command.select.30days')"
              value="30"
            ></el-option>
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
            <strong class="data-title">{{
              $t('dashboard.analytics.command.label.average')
            }}</strong>
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
    </el-col>
    <el-col :span="8" :xs="24">
      <el-card :body-style="{ height: '360px' }" shadow="never" v-loading="loading">
        <div class="card-header">
          <h3>
            <i class="mdi mdi-format-list-numbered"></i>
            {{ $t('dashboard.analytics.platform.title') }}
          </h3>
        </div>
        <div v-if="commandStats.length > 0">
          <div class="proportion-bar">
            <div
              v-for="item in commandStats"
              :key="item.prefix"
              class="proportion-segment"
              :style="{
                width: Math.round((item.count / count) * 100 * 100) / 100 + '%',
                backgroundColor: getColorByIndex(item.prefix),
              }"
              :title="`${item.prefix}: ${item.count} (${Math.round((item.count / count) * 100 * 100) / 100}%)`"
            ></div>
          </div>
          <div class="ranking-total-label">
            <strong>{{ $t('dashboard.analytics.command.label.total') }}</strong>
            <span>{{ count || 0 }}</span>
          </div>
          <el-scrollbar height="260px">
            <div v-for="(item, index) in commandStats" :key="item.prefix" class="ranking-item">
              <span
                :style="{
                  backgroundColor: getColorByIndex(item.prefix),
                  color: '#fff',
                  borderRadius: '100%',
                  padding: '6px 10px',
                  display: 'inline-block',
                  marginRight: '8px',
                }"
                >{{ index + 1 }}
              </span>
              <div class="ranking-label">
                <strong>{{ item.prefix }}</strong>
                <span>{{ item.count }}</span>
              </div>
            </div>
          </el-scrollbar>
        </div>
        <el-empty v-else />
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import axios from '@/axios.mjs'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  DataZoomComponent,
} from 'echarts/components'
import { init, use } from 'echarts/core'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

const { t } = useI18n()

const trendData = ref([])
const selectedDays = ref('1')
const count = ref(0)
const averageCount = ref(0)
const changeRate = ref(0)
const commandStats = ref([])
const chartInstance = ref(null)
const chartContainer = ref(null)
const loading = ref(false)
const abortController = new AbortController()
let resizeObserver = null

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

const getPrimaryColor = () => {
  return getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  return date
    .toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')
}

const getAlignedTime = (date, now, intervalMinutes = 30) => {
  const diffMs = now.getTime() - date.getTime()
  const step = Math.floor(diffMs / (intervalMinutes * 60 * 1000))
  return new Date(now.getTime() - step * intervalMinutes * 60 * 1000)
}
const groupDataByTimeInterval = (data, _days, now) => {
  const groupedData = {}
  const intervalMinutes = 30

  data.forEach((item) => {
    const timestamp = new Date(item.timestamp)
    const alignedTime = getAlignedTime(timestamp, now, intervalMinutes)
    const timeKey = alignedTime.getTime()

    if (!groupedData[timeKey]) {
      groupedData[timeKey] = { date: alignedTime, count: 0 }
    }
    groupedData[timeKey].count += 1
  })

  return Object.values(groupedData).sort((a, b) => a.date - b.date)
}

const fillMissingData = (timeGroupedData, days, now) => {
  const intervalMinutes = 30
  const totalIntervals = (days * 24 * 60) / intervalMinutes
  const filledData = []

  const dataMap = new Map(timeGroupedData.map((item) => [item.date.getTime(), item]))

  for (let i = totalIntervals - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * intervalMinutes * 60 * 1000)
    const alignedDate = getAlignedTime(date, now, intervalMinutes)
    const timestamp = alignedDate.getTime()
    if (dataMap.has(timestamp)) {
      filledData.push(timeGroupedData.find((item) => item.date.getTime() === timestamp))
    } else {
      filledData.push({ date: alignedDate, count: 0 })
    }
  }

  return filledData
}

const processData = (data, days) => {
  const now = new Date()
  const timeGroupedData = groupDataByTimeInterval(data.data, days, now)

  trendData.value = fillMissingData(timeGroupedData, days, now).map((item) => ({
    date: formatTimestamp(item.date),
    count: item.count,
  }))

  count.value = timeGroupedData.reduce((sum, item) => sum + item.count, 0)
  averageCount.value = Math.round(count.value / days)
  changeRate.value = Math.floor(data.change_rate * 100)

  const prefixCountMap = {}
  data.data.forEach((item) => {
    const prefix = item.target_id?.split('|')[0] || t('unknown')
    prefixCountMap[prefix] = (prefixCountMap[prefix] || 0) + 1
  })

  commandStats.value = Object.entries(prefixCountMap)
    .map(([prefix, count]) => ({ prefix, count })) // skipcq: JS-0123 - Shadowing is safe here
    .sort((a, b) => b.count - a.count)
}

const renderChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.dispose()
  const chartDom = chartContainer.value
  if (!chartDom || chartDom.offsetWidth === 0) return

  const primaryColor = getPrimaryColor()
  const chart = init(chartDom)
  chart.setOption({
    color: [primaryColor],
    tooltip: { trigger: 'axis' },
    dataZoom: [
      { type: 'slider', start: 0, end: 100 },
      { type: 'inside', start: 0, end: 100 },
    ],
    xAxis: { type: 'category', data: trendData.value.map((item) => item.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('dashboard.analytics.command.chart.command'),
        type: 'line',
        smooth: true,
        data: trendData.value.map((item) => item.count),
      },
    ],
  })
  chartInstance.value = chart
}

const resizeChart = async () => {
  await nextTick()
  if (chartInstance.value) chartInstance.value.resize()
}

const fetchAnalyticsData = async (days) => {
  loading.value = true
  try {
    const response = await axios.get('/api/analytics', {
      signal: abortController.signal,
      params: { days },
    })
    processData(response.data, days)
    renderChart()
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    loading.value = false
  }
}

const onTimeRangeChange = (newValue) => {
  fetchAnalyticsData(newValue)
}

const getColorByIndex = (prefix) => {
  const colors = [
    '#F56C6C',
    '#E6A23C',
    '#FAE384',
    '#67C23A',
    '#1ABC9C',
    '#409EFF',
    '#9B59B6',
    '#E84393',
  ]
  let hash = 0
  for (let i = 0; i < prefix.length; i++) hash += prefix.charCodeAt(i)
  return colors[hash % colors.length]
}

defineExpose({
  fetchAnalyticsData,
  selectedDays,
})

onMounted(() => {
  fetchAnalyticsData(selectedDays.value)

  resizeObserver = new ResizeObserver(resizeChart)
  if (chartContainer.value) resizeObserver.observe(chartContainer.value)
})

onBeforeUnmount(() => {
  abortController.abort()
  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value)
    resizeObserver.disconnect()
  }
  if (chartInstance.value) chartInstance.value.dispose()
})
</script>

<style scoped>
h3 {
  cursor: default;
}

.el-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.ranking-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.ranking-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
  width: 100%;
}

.ranking-total-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 14px;
  width: 100%;
}

.proportion-bar {
  display: flex;
  height: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 10px;
}

.proportion-segment {
  height: 100%;
  transition: width 0.3s ease;
}
</style>
