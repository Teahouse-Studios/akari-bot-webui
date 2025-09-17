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

<script>
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
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

export default {
  name: 'AnalyticsCard',
  data() {
    const { t } = useI18n()

    return {
      t,
      trendData: [],
      selectedDays: '1',
      count: 0,
      averageCount: 0,
      changeRate: 0,
      commandStats: [],
      chartInstance: null,
      resizeObserver: null,
      abortController: new AbortController(),
      loading: false,
    }
  },
  mounted() {
    this.fetchAnalyticsData(this.selectedDays)

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeChart()
    })

    this.resizeObserver.observe(this.$refs.chartContainer)
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
  },
  beforeUnmount() {
    this.abortController.abort()
    if (this.resizeObserver && this.$refs.chartContainer) {
      this.resizeObserver.unobserve(this.$refs.chartContainer)
      this.resizeObserver.disconnect()
    }
    if (this.chartInstance) {
      this.chartInstance.dispose()
    }
  },
  methods: {
    async fetchAnalyticsData(days) {
      this.loading = true
      try {
        const response = await axios.get('/api/analytics', {
          signal: this.abortController.signal,
          params: { days },
        })
        const { data } = response
        this.processData(data, days)
        this.renderChart(days)
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled')
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      } finally {
        this.loading = false
      }
    },

    processData(data, days) {
      const timeGroupedData = this.groupDataByTimeInterval(data.data)
      this.fillMissingData(timeGroupedData, days)

      this.trendData = timeGroupedData
        .map((item) => ({
          date: this.formatTimestamp(item.date),
          count: item.count,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      this.count = timeGroupedData.reduce((sum, item) => sum + item.count, 0)
      this.averageCount = Math.round(this.count / days)

      this.changeRate = Math.floor(data.change_rate * 100)
      const prefixCountMap = {}
      data.data.forEach((item) => {
        const prefix = item.target_id?.split('|')[0] || this.t('unknown')
        prefixCountMap[prefix] = (prefixCountMap[prefix] || 0) + 1
      })

      const sorted = Object.entries(prefixCountMap)
        .map(([prefix, count]) => ({ prefix, count }))
        .sort((a, b) => b.count - a.count)

      this.commandStats = sorted
    },

    fillMissingData(timeGroupedData, days) {
      const allTimeIntervals = this.generateAllTimeIntervals(days)
      const timeKeys = new Set(timeGroupedData.map((item) => item.date))

      allTimeIntervals.forEach((time) => {
        if (!timeKeys.has(time)) {
          timeGroupedData.push({ date: time, count: 0 })
        }
      })

      timeGroupedData.sort((a, b) => new Date(a.date) - new Date(b.date))
    },

    generateAllTimeIntervals(days) {
      const timeIntervals = []
      const now = new Date()
      const interval = 48 * days
      const baseTime = new Date(now.getTime() - 30 * 60 * 1000)

      for (let i = 0; i < interval; i++) {
        const newTime = new Date(baseTime.getTime() - i * 30 * 60 * 1000)
        timeIntervals.push(newTime.toISOString())
      }

      return timeIntervals
    },

    groupDataByTimeInterval(data) {
      const groupedData = {}
      const now = new Date()
      const baseTime = new Date(now.getTime() - 30 * 60 * 1000)

      data.forEach((item) => {
        const timestamp = new Date(item.timestamp)
        const diff = baseTime.getTime() - timestamp.getTime()
        const steps = Math.floor(diff / (30 * 60 * 1000))
        const alignedTime = new Date(baseTime.getTime() - steps * 30 * 60 * 1000)
        const timeKey = alignedTime.toISOString()

        if (!groupedData[timeKey]) {
          groupedData[timeKey] = { date: timeKey, count: 0 }
        }
        groupedData[timeKey].count += 1
      })

      return Object.values(groupedData)
    },

    formatTimestamp(timestamp) {
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
    },

    getPrimaryColor() {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--el-color-primary')
        .trim()
    },

    renderChart() {
      this.$nextTick(() => {
        if (this.chartInstance) {
          this.chartInstance.dispose()
        }

        const chartDom = this.$refs.chartContainer
        if (!chartDom || chartDom.offsetWidth === 0) return

        const primaryColor = this.getPrimaryColor()
        const chart = init(this.$refs.chartContainer)
        const option = {
          color: [primaryColor],
          tooltip: { trigger: 'axis' },
          dataZoom: [
            { type: 'slider', start: 0, end: 100 },
            { type: 'inside', start: 0, end: 100 },
          ],
          xAxis: {
            type: 'category',
            data: this.trendData.map((item) => item.date),
          },
          yAxis: {
            type: 'value',
          },
          series: [
            {
              name: this.t('dashboard.analytics.command.chart.command'),
              data: this.trendData.map((item) => item.count),
              type: 'line',
              smooth: true,
            },
          ],
        }
        chart.setOption(option)
        this.chartInstance = chart
      })
    },

    resizeChart() {
      this.$nextTick(() => {
        if (this.chartInstance) {
          this.chartInstance.resize()
        }
      })
    },

    onTimeRangeChange(newValue) {
      this.fetchAnalyticsData(newValue)
    },

    getColorByIndex(prefix) {
      const colors = [
        '#F56C6C', // 红
        '#E6A23C', // 橙
        '#FAE384', // 黄
        '#67C23A', // 绿
        '#1ABC9C', // 青
        '#409EFF', // 蓝
        '#9B59B6', // 紫
        '#E84393', // 粉
      ]
      // 使用 prefix 的哈希来选颜色
      let hash = 0
      for (let i = 0; i < prefix.length; i++) {
        hash += prefix.charCodeAt(i)
      }
      return colors[hash % colors.length]
    },
  },
}
</script>

<style scoped>
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
