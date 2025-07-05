<template>
  <el-row :gutter="20">
    <el-col :span="10" :xs="24">
      <el-card
       :body-style="{ height: '200px' }"
        shadow="never"
        v-loading="loading">
        <h3><i class="mdi mdi-robot-outline"></i> {{ $t("dashboard.server_info.bot.title") }}</h3>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.bot.label.python_version") }}</strong
          ><span class="data-text">{{ bot.python_version || "-" }}</span>
        </p>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.bot.label.bot_version") }}</strong
          ><span class="data-text">{{
            bot.version ? bot.version.slice(0, 6) : "-"
          }}</span>
        </p>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.bot.label.web_render_status") }}</strong
          ><span class="data-text">{{
            bot.web_render_status ? $t("true") : $t("false")
          }}</span>
        </p>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.bot.label.running_time") }}</strong
          ><span class="data-text">{{
            formatRunningTime(bot.running_time || 0)
          }}</span>
        </p>
      </el-card>
      <el-card
       :body-style="{ height: '160px' }"
        shadow="never"
        v-loading="loading">
        <h3><i class="mdi mdi-laptop"></i> {{ $t("dashboard.server_info.system.title") }}</h3>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.system.label.machine") }}</strong
          ><span class="data-text"
            >{{ os.system || "-" }} {{ os.machine ? "-" : "" }}
            {{ os.machine || "" }}</span
          >
        </p>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.system.label.version") }}</strong
          ><span class="data-text">{{ os.version || "-" }}</span>
        </p>
        <p>
          <strong class="data-title">{{ $t("dashboard.server_info.system.label.boot_time") }}</strong
          ><span class="data-text">{{ formatTime(os.boot_time || 0) }}</span>
        </p>
      </el-card>
    </el-col>

    <el-col :span="14" :xs="24">
      <el-card
       :body-style="{ height: '420px' }"
        shadow="never"
        v-loading="loading">
        <h3><i class="mdi mdi-memory"></i> {{ $t("dashboard.server_info.cpu.title") }}</h3>
        <p><strong class="data-title">{{ $t("dashboard.server_info.cpu.label.brand") }}</strong></p>
        <p>
          <span class="data-text">{{ cpu.cpu_brand || "-" }}</span>
        </p>
        <h3><i class="mdi mdi-sd"></i> {{ $t("dashboard.server_info.memory.title") }}</h3>
        <p>
          <span class="data-text"
            >{{ memory.used ? memory.used.toFixed() : 0 }} MB /
            {{ memory.total ? memory.total.toFixed() : 0 }} MB</span
          >
        </p>
        <h3><i class="mdi mdi-server-outline"></i> {{ $t("dashboard.server_info.disk.title") }}</h3>
        <p>
          <span class="data-text"
            >{{ disk.used ? disk.used.toFixed(1) : 0 }} GB /
            {{ disk.total ? disk.total.toFixed(1) : 0 }} GB</span
          >
        </p>
        <br />
        <div :class="['memory-dashboards', { leftAlign: dashboardOverflow, centerAlign: !dashboardOverflow }]">
          <el-progress
            type="dashboard"
            :percentage="cpu.cpu_percent ? cpu.cpu_percent.toFixed(1) : 0"
            :color="getProgressColor(cpu.cpu_percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">{{ $t("dashboard.server_info.cpu.title") }}</span>
            </template>
          </el-progress>
          <el-progress
            type="dashboard"
            :percentage="memory.percent ? memory.percent.toFixed(1) : 0"
            :color="getProgressColor(memory.percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">{{ $t("dashboard.server_info.memory.title") }}</span>
            </template>
          </el-progress>
          <el-progress
            type="dashboard"
            :percentage="disk.percent ? disk.percent.toFixed(1) : 0"
            :color="getProgressColor(disk.percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">{{ $t("dashboard.server_info.disk.title") }}</span>
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
import { useI18n } from 'vue-i18n';

const progress_colors = ["#1989fa", "#e6a23c", "#f56c6c"];

export default {
  data() {
    const { t } = useI18n();

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
      dashboardOverflow: false,
      t
    };
  },
  mounted() {
    this.checkOverflow();
    window.addEventListener('resize', this.checkOverflow);
    this.fetchServerInfoData();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkOverflow);
    this.cancelTokenSource.cancel("Component unmounted");
  },
  methods: {
    formatRunningTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return this.t("dashboard.server_info.text.format_time", { hours: hours, minutes: minutes, seconds: remainingSeconds });
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
          ElMessage.error(this.t("message.error.fetch") + error.message);
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
    checkOverflow() {
      this.$nextTick(() => {
        const el = this.$el.querySelector('.memory-dashboards');
        if (el) {
          this.dashboardOverflow = el.scrollWidth > el.clientWidth;
        }
      });
    },
  },
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
  overflow-x: auto;
}

.memory-dashboards.centerAlign {
  justify-content: center;
}

.memory-dashboards.leftAlign {
  justify-content: flex-start;
}

.el-progress--dashboard {
  margin: 5px;
}
</style>
