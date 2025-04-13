<template>
  <el-row :gutter="20">
    <el-col :span="20" :xs="30">
      <el-card :body-style="{ height: '400px' }" v-loading="loading">
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
        <div ref="chartContainer" style="height: 300px;"></div>
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
      loading: false,
    };
  },
  mounted() {
    this.fetchAnalyticsData(this.selectedDays);
    window.addEventListener("resize", this.resizeChart);
    this.resizeChart();
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resizeChart);
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
    this.loading = false;  // 加载完成后，设置 loading 为 false
  }
    },

    processData(data) {
      const timeInterval = '30min';
      const timeGroupedData = this.groupDataByTimeInterval(data.data, timeInterval);
      this.fillMissingData(timeGroupedData, timeInterval); // 根据时间范围填充空数据

      this.trendData = timeGroupedData.map(item => ({
        date: this.formatTimestamp(item.date),
        count: item.count
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    fillMissingData(timeGroupedData, interval) {
      const allTimeIntervals = this.generateAllTimeIntervals(interval); // 生成对应的时间刻度
      const timeKeys = new Set(timeGroupedData.map(item => item.date));

      allTimeIntervals.forEach(time => {
        if (!timeKeys.has(time)) {
          timeGroupedData.push({ date: time, count: 0 });
        }
      });

      // 重新排序数据，确保时间顺序
      timeGroupedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    generateAllTimeIntervals() {
    const timeIntervals = [];
    const now = new Date();
    const baseTime = new Date(now.getTime() - 30 * 60 * 1000); // 當前時間減去30分鐘

    for (let i = 0; i < 48; i++) { // 24小時，每30分鐘一個
        const newTime = new Date(baseTime.getTime() - i * 30 * 60 * 1000);
        timeIntervals.push(newTime.toISOString());
      }

    return timeIntervals;
  },

    groupDataByTimeInterval(data) {
      const groupedData = {};
      const now = new Date();
      const baseTime = new Date(now.getTime() - 30 * 60 * 1000); // 當前時間減去30分鐘

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
      }).replace(',', '');  // 去除日期后面的逗号
    },

    renderChart() {
      const chart = echarts.init(this.$refs.chartContainer);
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: this.trendData.map(item => item.date),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: this.trendData.map(item => item.count),
            type: 'line',
            smooth: true,
          },
        ],
      };
      chart.setOption(option);
      this.chartInstance = chart;
    },

    resizeChart() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },

    onTimeRangeChange(newValue) {
      this.fetchAnalyticsData(newValue);
    }
  },
};
</script>

<style scoped>
.el-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  box-shadow: none;
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
</style>
