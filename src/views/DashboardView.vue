<template>
  <el-row :gutter="20">
    <el-col :span="10" :xs="24">
      <el-card :body-style="{ height: '180px' }">
        <h3><i class="mdi mdi-robot-outline"></i> 机器人</h3>
        <p><strong class="data-title">Python 版本</strong> <span class="data-text">{{ bot.python_version || '-' }}</span></p>
        <p><strong class="data-title">机器人版本</strong> <span class="data-text">{{ bot.version ? bot.version.slice(0, 6) : '-' }}</span></p>
        <p><strong class="data-title">运行时间</strong></p> 
        <p><span class="data-text">{{ formatRunningTime(bot.running_time || 0) }}</span></p>
      </el-card>
      <el-card :body-style="{ height: '180px' }">
        <h3><i class="mdi mdi-laptop"></i> 系统</h3>
        <p><strong class="data-title">架构</strong> <span class="data-text">{{ os.system || '-' }} {{ os.machine || '' }}</span></p>
        <p><strong class="data-title">版本</strong> <span class="data-text">{{ os.version || '-' }}</span></p>
        <p><strong class="data-title">启动时间</strong></p>
        <p> <span class="data-text">{{ formatTime(os.boot_time || 0) }}</span></p>
      </el-card>
    </el-col>

    <el-col :span="14" :xs="24">
      <el-card :body-style="{ height: '420px' }">
        <h3><i class="mdi mdi-memory"></i> CPU</h3>
        <p><strong class="data-title">型号</strong></p>
        <p><span class="data-text">{{ cpu.cpu_brand || '-' }}</span></p>
        <h3><i class="mdi mdi-sd"></i> 内存</h3>
        <p><span class="data-text">{{ memory.used ? memory.used.toFixed() : 0 }} MB / {{ memory.total ? memory.total.toFixed() : 0 }} MB</span></p>
        <h3><i class="mdi mdi-server-outline"></i> 磁盘</h3>
        <p><span class="data-text">{{ disk.used ? disk.used.toFixed(1) : 0 }} GB / {{ disk.total ? disk.total.toFixed(1) : 0 }} GB</span></p>
        <br />
        <el-progress 
          type="dashboard" 
          :percentage="cpu.cpu_percent ? cpu.cpu_percent.toFixed(1) : 0" 
          :color="getProgressColor(cpu.cpu_percent)">
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">CPU</span>
          </template>
        </el-progress>
        <el-progress 
          type="dashboard" 
          :percentage="memory.percent ? memory.percent.toFixed(1) : 0"
          :color="getProgressColor(memory.percent)">
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">内存</span>
          </template>
        </el-progress>
        <el-progress 
          type="dashboard" 
          :percentage="disk.percent ? disk.percent.toFixed(1) : 0" 
          :color="getProgressColor(disk.percent)">
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">磁盘</span>
          </template>
        </el-progress>
      </el-card>
    </el-col>
  </el-row>
</template>


<script>
import axios from '@/axios';

const progress_colors = ['#1989fa', '#e6a23c', '#f56c6c']

export default {
  data() {
    return {
      os: {
        system: '',
        version: '',
        machine: '',
        boot_time: 0
      },
      bot: {
        running_time: 0,
        python_version: '',
        version: '',
      },
      cpu: {
        cpu_brand: '',
        cpu_percent: 0
      },
      memory: {
        total: 0,
        used: 0,
        percent: 0
      },
      disk: {
        total: 0,
        used: 0,
        percent: 0
      }
    };
  },
  mounted() {
    this.fetchDashboardData();
  },
  methods: {
    // 格式化时间为 "xx小时xx分xx秒"
    formatRunningTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${hours}小时${minutes}分${remainingSeconds}秒`;
    },
    // 格式化时间戳
    formatTime(timestamp) {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('zh-CN', {
        hour12: false,  // 禁用12小时制，使用24小时制
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    // 获取 API 数据
    async fetchDashboardData() {
      try {
        const response = await axios.get('/server-info');
        const data = response.data;

        if (data.message === 'success') {
          this.os = { ...this.os, ...data.os };
          this.bot = { ...this.bot, ...data.bot };
          this.cpu = { ...this.cpu, ...data.cpu };
          this.memory = { ...this.memory, ...data.memory };
          this.disk = { ...this.disk, ...data.disk };
        } else {
          console.error('API 请求失败');
        }
      } catch (error) {
        console.error('请求失败:', error);
      }
    },
    // 根据百分比值返回合适的颜色
    getProgressColor(percentage) {
      if (percentage >= 90) {
        return progress_colors[2];  // 红色
      }
      else {
        if (percentage >= 60) {
        return progress_colors[1];  // 黄色
        }
        else {
          return progress_colors[0];  // 蓝色
        }
      }
    }
  }
};
</script>

<style scoped>
.el-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.data-text {
  color: #666;
  text-overflow: ellipsis;
}

.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 20px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 14px;
}
</style>
