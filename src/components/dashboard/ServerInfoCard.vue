<template>
  <el-row :gutter="20">
    <el-col :span="10" :xs="24">
      <el-card :body-style="{ height: '200px' }"
        v-loading="loading">
        <h3><i class="mdi mdi-robot-outline"></i> 机器人</h3>
        <p>
          <strong class="data-title">Python 版本</strong
          ><span class="data-text">{{ bot.python_version || "-" }}</span>
        </p>
        <p>
          <strong class="data-title">机器人版本</strong
          ><span class="data-text">{{
            bot.version ? bot.version.slice(0, 6) : "-"
          }}</span>
        </p>
        <p>
          <strong class="data-title">WebRender 已就绪</strong
          ><span class="data-text">{{
            bot.web_render_status ? "是" : "否"
          }}</span>
        </p>
        <p>
          <strong class="data-title">运行时间</strong
          ><span class="data-text">{{
            formatRunningTime(bot.running_time || 0)
          }}</span>
        </p>
      </el-card>
      <el-card :body-style="{ height: '160px' }"
        v-loading="loading">
        <h3><i class="mdi mdi-laptop"></i> 系统</h3>
        <p>
          <strong class="data-title">架构</strong
          ><span class="data-text"
            >{{ os.system || "-" }} {{ os.machine ? "-" : "" }}
            {{ os.machine || "" }}</span
          >
        </p>
        <p>
          <strong class="data-title">版本</strong
          ><span class="data-text">{{ os.version || "-" }}</span>
        </p>
        <p>
          <strong class="data-title">启动时间</strong
          ><span class="data-text">{{ formatTime(os.boot_time || 0) }}</span>
        </p>
      </el-card>
    </el-col>

    <el-col :span="14" :xs="24">
      <el-card :body-style="{ height: '420px' }"
        v-loading="loading">
        <h3><i class="mdi mdi-memory"></i> CPU</h3>
        <p><strong class="data-title">型号</strong></p>
        <p>
          <span class="data-text">{{ cpu.cpu_brand || "-" }}</span>
        </p>
        <h3><i class="mdi mdi-sd"></i> 内存</h3>
        <p>
          <span class="data-text"
            >{{ memory.used ? memory.used.toFixed() : 0 }} MB /
            {{ memory.total ? memory.total.toFixed() : 0 }} MB</span
          >
        </p>
        <h3><i class="mdi mdi-server-outline"></i> 磁盘</h3>
        <p>
          <span class="data-text"
            >{{ disk.used ? disk.used.toFixed(1) : 0 }} GB /
            {{ disk.total ? disk.total.toFixed(1) : 0 }} GB</span
          >
        </p>
        <br />
        <div class="memory-dashboards">
          <el-progress
            type="dashboard"
            :percentage="cpu.cpu_percent ? cpu.cpu_percent.toFixed(1) : 0"
            :color="getProgressColor(cpu.cpu_percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">CPU</span>
            </template>
          </el-progress>
          <el-progress
            type="dashboard"
            :percentage="memory.percent ? memory.percent.toFixed(1) : 0"
            :color="getProgressColor(memory.percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">内存</span>
            </template>
          </el-progress>
          <el-progress
            type="dashboard"
            :percentage="disk.percent ? disk.percent.toFixed(1) : 0"
            :color="getProgressColor(disk.percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">磁盘</span>
            </template>
          </el-progress>
        </div>
      </el-card>
    </el-col>
  </el-row>

</template>


<script>
import axios from "@/axios";
import { ElMessage } from 'element-plus';

const progress_colors = ["#1989fa", "#e6a23c", "#f56c6c"];

export default {
  data() {
    return {
      os: {
        system: "",
        version: "",
        machine: "",
        boot_time: 0,
      },
      bot: {
        running_time: 0,
        python_version: "",
        version: "",
        web_render_status: false,
      },
      cpu: {
        cpu_brand: "",
        cpu_percent: 0,
      },
      memory: {
        total: 0,
        used: 0,
        percent: 0,
      },
      disk: {
        total: 0,
        used: 0,
        percent: 0,
      },
      cancelTokenSource: axios.CancelToken.source(),
      loading: false,
    };
  },
  mounted() {
    this.fetchServerInfoData(this.selectedDays);
  },
  beforeUnmount() {
    this.cancelTokenSource.cancel("Component unmounted");
  },
  methods: {
    formatRunningTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${hours}小时${minutes}分${remainingSeconds}秒`;
    },
    formatTime(timestamp) {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString("zh-CN", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    async fetchServerInfoData() {
      try {
        this.loading = true;
        const response = await axios.get("/api/server-info", {
          cancelToken: this.cancelTokenSource.token,
        });
        const data = response.data;

        this.os = { ...this.os, ...data.os };
        this.bot = { ...this.bot, ...data.bot };
        this.cpu = { ...this.cpu, ...data.cpu };
        this.memory = { ...this.memory, ...data.memory };
        this.disk = { ...this.disk, ...data.disk };
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          ElMessage.error("请求失败：" + error.message);
        }
      } finally {
        this.loading = false;
      }
    },
    getProgressColor(percentage) {
      if (percentage >= 90) {
        return progress_colors[2];
      } else {
        if (percentage >= 60) {
          return progress_colors[1];
        } else {
          return progress_colors[0];
        }
      }
    },
  },
};
</script>

<style scoped>
.el-card {
  box-shadow: none !important;
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.data-text {
  color: #666;
  text-overflow: ellipsis;
}

.dark .data-text {
  color: #ccc;
}

.data-title {
  margin-right: 3ex;
  color: #333;
}

.dark .data-title {
  color: white;
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

.memory-dashboards {
  display: flex;
  justify-content: center;
}

.el-progress--dashboard {
  margin: 5px;
}
</style>
