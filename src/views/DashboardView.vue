<template>
  <el-row :gutter="20" class="dashboard">
    <!-- Time and Python Version -->
    <el-col :span="8">
      <el-card :body-style="{ padding: '20px' }">
        <h3>Server Uptime: {{ serverInfo.timeDiff }}</h3>
        <p>Python Version: {{ serverInfo.pythonVersion }}</p>
      </el-card>
    </el-col>

    <!-- CPU Usage -->
    <el-col :span="8">
      <el-card :body-style="{ padding: '20px' }">
        <h3>CPU Usage</h3>
        <el-progress :percentage="serverInfo.cpuUsage" status="active"></el-progress>
        <p>{{ serverInfo.cpuBrand }}</p>
      </el-card>
    </el-col>

    <!-- Memory & Swap -->
    <el-col :span="8">
      <el-card :body-style="{ padding: '20px' }">
        <h3>Memory</h3>
        <p>RAM: {{ serverInfo.ram }} MB</p>
        <p>Swap: {{ serverInfo.swap }} MB</p>
      </el-card>
    </el-col>

    <!-- Disk Usage -->
    <el-col :span="8">
      <el-card :body-style="{ padding: '20px' }">
        <h3>Disk Usage</h3>
        <p>Used: {{ serverInfo.disk }} GB / {{ serverInfo.diskTotal }} GB</p>
        <el-progress :percentage="(serverInfo.disk / serverInfo.diskTotal) * 100" status="active"></el-progress>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
import axios from 'axios';

export default {
  name: 'DashboardView',
  data() {
    return {
      serverInfo: {
        timeDiff: '',
        pythonVersion: '',
        cpuBrand: '',
        cpuUsage: 0,
        ram: 0,
        swap: 0,
        disk: 0,
        diskTotal: 0,
      }
    };
  },
  created() {
    this.fetchServerInfo();
  },
  methods: {
    async fetchServerInfo() {
      try {
        const response = await axios.get('http://localhost:5000/serverinfo');
        if (response.data.message === 'Success') {
          this.serverInfo = response.data;
        } else {
          console.error('Failed to fetch server info');
        }
      } catch (error) {
        console.error('Error fetching server info:', error);
      }
    }
  }
};
</script>

<style scoped>
.dashboard {
  margin: 20px;
}
</style>
