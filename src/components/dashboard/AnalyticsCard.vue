<template>
  <el-row :gutter="20">
    <el-col :span="16" :xs="24">
      <el-card :body-style="{ height: '400px' }" 
        v-loading="loading">
        <div class="card-header">
          <h3><i class="mdi mdi-chart-line"></i> 命令统计</h3>
          <el-select v-model="selectedDays" @change="onTimeRangeChange" class="time-range-select">
            <el-option label="过去 1 天" value="1"></el-option>
            <el-option label="过去 3 天" value="3"></el-option>
            <el-option label="过去 7 天" value="7"></el-option>
            <el-option label="过去 30 天" value="30"></el-option>
            <el-option label="过去 365 天" value="365"></el-option>
          </el-select>
        </div>
        <div class="statistics-content">
  <div class="data-group">
    <strong class="data-title">总命令数</strong>
    <span class="data-text">{{ count || 0 }}</span>
  </div>
  <div class="data-group">
    <strong class="data-title">平均命令数</strong>
    <span class="data-text">{{ averageCount || 0 }}</span>
  </div>
  <div class="data-group">
    <strong class="data-title">改变率</strong>
    <span
      :class="{
        positive: changeRate > 0,
        negative: changeRate < 0,
        'data-text': changeRate === 0
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
      <el-card :body-style="{ height: '400px' }"
        v-loading="loading">
        <div class="card-header">
          <h3><i class="mdi mdi-format-list-numbered"></i> 平台命令统计</h3>
        </div>
        <el-scrollbar>
          <div v-for="(item, index) in commandStats" :key="item.prefix" class="ranking-item">
            <div class="ranking-label">
              <strong>{{ index + 1 }}. {{ item.prefix }}</strong>
              <span>{{ item.count }} 条</span>
            </div>
          </div>
        <div class="proportion-bar">
          <div
            v-for="item in commandStats"
            :key="item.prefix"
            class="proportion-segment"
            :style="{
              width: ((item.count / count) * 100).toFixed(2) + '%',
              backgroundColor: getColorByIndex(item.prefix)
            }"
            :title="`${item.prefix}: ${item.count} (${((item.count / count) * 100).toFixed(1)}%)`"
          ></div>
        </div>
        </el-scrollbar>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
import axios from "@/axios";
import * as echarts from "echarts";

export default {
  data() {
    return {
      trendData: [],
      selectedDays: "1",
      count: 0,
      averageCount: 0,
      changeRate: 0,
      commandStats: [],
      loading: false,
      chartInstance: null,
      resizeObserver: null,
    };
  },
  mounted() {
    this.fetchAnalyticsData(this.selectedDays);

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeChart();
    });

    this.resizeObserver.observe(this.$refs.chartContainer);
  },
  beforeUnmount() {
    if (this.resizeObserver && this.$refs.chartContainer) {
      this.resizeObserver.unobserve(this.$refs.chartContainer);
      this.resizeObserver.disconnect();
    }
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  },
  methods: {
    async fetchAnalyticsData(days) {
      this.loading = true;
      try {
        const response = await axios.get("/api/analytics", { params: { days } });
        const { data } = response;
        this.processData(data, days);
        this.renderChart(days);
      } catch (error) {
        this.$message.error("数据加载失败，请稍后再试");
      } finally {
    this.loading = false;
  }
    },

    processData(data, days) {
      const timeGroupedData = this.groupDataByTimeInterval(data.data);
      this.fillMissingData(timeGroupedData, days);

      this.trendData = timeGroupedData.map(item => ({
        date: this.formatTimestamp(item.date),
        count: item.count,
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      this.count = timeGroupedData.reduce((sum, item) => sum + item.count, 0);
      this.averageCount = Math.round(this.count / days);

      this.changeRate = Math.floor(data.change_rate * 100);
      const prefixCountMap = {};
      data.data.forEach(item => {
        const prefix = item.target_id?.split("|")[0] || "未知";
        prefixCountMap[prefix] = (prefixCountMap[prefix] || 0) + 1;
      });

      const sorted = Object.entries(prefixCountMap)
        .map(([prefix, count]) => ({ prefix, count }))
        .sort((a, b) => b.count - a.count);

      this.commandStats = sorted;
    },

    fillMissingData(timeGroupedData, days) {
      const allTimeIntervals = this.generateAllTimeIntervals(days);
      const timeKeys = new Set(timeGroupedData.map(item => item.date));

      allTimeIntervals.forEach(time => {
        if (!timeKeys.has(time)) {
          timeGroupedData.push({ date: time, count: 0 });
        }
      });

      timeGroupedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    generateAllTimeIntervals(days) {
    const timeIntervals = [];
    const now = new Date();
    const interval = 48 * days
    const baseTime = new Date(now.getTime() - 30 * 60 * 1000);

    for (let i = 0; i < interval; i++) {
        const newTime = new Date(baseTime.getTime() - i * 30 * 60 * 1000);
        timeIntervals.push(newTime.toISOString());
      }

    return timeIntervals;
  },

    groupDataByTimeInterval(data) {
      const groupedData = {};
      const now = new Date();
      const baseTime = new Date(now.getTime() - 30 * 60 * 1000);

      data.forEach(item => {
        const timestamp = new Date(item.timestamp);
        const diff = baseTime.getTime() - timestamp.getTime();
        const steps = Math.floor(diff / (30 * 60 * 1000));
        const alignedTime = new Date(baseTime.getTime() - steps * 30 * 60 * 1000);
        const timeKey = alignedTime.toISOString();

        if (!groupedData[timeKey]) {
          groupedData[timeKey] = { date: timeKey, count: 0 };
        }
        groupedData[timeKey].count += 1;
      });

      return Object.values(groupedData);
    },

    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: false 
      }).replace(',', '');
    },

    renderChart() {
      this.$nextTick(() => {
        if (this.chartInstance) {
          this.chartInstance.dispose();
        }

        const chartDom = this.$refs.chartContainer;
        if (!chartDom || chartDom.offsetWidth === 0) return;

        const chart = echarts.init(this.$refs.chartContainer);
        const option = {
          tooltip: { trigger: 'axis' },
          dataZoom: [
            { type: 'slider', start: 0, end: 100 },
            { type: 'inside', start: 0, end: 100 }
          ],
          xAxis: {
            type: 'category',
            data: this.trendData.map(item => item.date),
          },
          yAxis: {
            type: 'value',
          },
          series: [
            {
              name: '命令数量',
              data: this.trendData.map(item => item.count),
              type: 'line',
              smooth: true,
            },
          ],
        };
        chart.setOption(option);
        this.chartInstance = chart;
      });
    },

    resizeChart() {
      this.$nextTick(() => {
        if (this.chartInstance) {
          this.chartInstance.resize();
        }
      });
    },

    onTimeRangeChange(newValue) {
      this.fetchAnalyticsData(newValue);
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
      ];
      // 使用 prefix 的哈希来选颜色
      let hash = 0;
      for (let i = 0; i < prefix.length; i++) {
        hash += prefix.charCodeAt(i);
      }
      return colors[hash % colors.length];
    }
  },
};
</script>

<style scoped>
.el-card {
  box-shadow: none;
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
  gap: 60px;
  margin: 20px 0;
  margin-bottom: 0;
}

.data-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.data-title, .data-text {
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
}

.ranking-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.proportion-bar {
  display: flex;
  height: 12px;
  overflow: hidden;
  margin-top: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 10px;
}

.proportion-segment {
  height: 100%;
  transition: width 0.3s ease;
}
</style>
