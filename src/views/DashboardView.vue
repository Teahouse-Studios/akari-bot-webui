<template>
  <div>
    <h1>配置</h1>
    <p>这是配置页面。</p>
  </div>
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
          this.$message.error('无法获取信息');
        }
      } catch (error) {
        console.error('无法获取信息', error);
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
