<template>
  <ServerInfoCard ref="serverInfoCard"/>
  <AnalyticsCard ref="analyticsCard"/>
  <el-button
    class="refresh-button"
    circle
    size="large"
    type="primary"
    @click="refreshData"
  >
    <i class="mdi mdi-refresh"></i>
  </el-button>
</template>

<script>
import AnalyticsCard from "@/components/dashboard/AnalyticsCard.vue";
import ServerInfoCard from "@/components/dashboard/ServerInfoCard.vue";

export default {
  components: {
    AnalyticsCard,
    ServerInfoCard
  },
  data() {
    return {
      loading: false,
      refreshInterval: null
    }
  },
  mounted() {
    this.startAutoRefresh();
  },
  beforeUnmount() {
    this.clearAutoRefresh();
  },
  methods: {
    refreshData() {
      this.loading = true;
      this.$refs.serverInfoCard.fetchServerInfoData().finally(() => {
        this.loading = false;
      });
      if (this.$refs.analyticsCard) {
        const selectedDays = this.$refs.analyticsCard.selectedDays;
        this.$refs.analyticsCard.fetchAnalyticsData(selectedDays);
      }
      this.resetAutoRefresh();
    },
    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.refreshData();
      }, 3600000);
    },
    resetAutoRefresh() {
      this.clearAutoRefresh();
      this.startAutoRefresh();
    },
    clearAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }
  }
}
</script>

<style scoped>
.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important; 
}
</style>
