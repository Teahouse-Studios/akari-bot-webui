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
    }
  }
}
</script>

<style>
.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important; 
}
</style>