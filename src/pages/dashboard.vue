<template>
  <div class="dashboard">
    <RealtimeOverviewCard
      :running-seconds="runningSeconds"
      :command-parsed="bot.command_parsed"
      :message-parsed="bot.message_parsed"
      :process-count="processCount"
      :server-offline="serverOffline"
    />

    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :lg="10">
        <div class="info-column">
          <BotInfoCard :bot="bot" />
          <SystemInfoCard :cpu="cpu" :os="os" />
        </div>
      </el-col>
      <el-col :xs="24" :lg="14">
        <ResourceUsageCard
          :cpu-percent="cpu.cpu_percent"
          :memory="memory"
          :disk="disk"
          :items="processes.items"
          :failures="processes.failures"
          :error="processes.error"
        />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :lg="16">
        <CommandStatsCard
          :trend-data="trendData"
          :count="count"
          :average-count="averageCount"
          :change-rate="changeRate"
          :selected-days="selectedDays"
          :loading="analyticsLoading"
          @update:selected-days="setSelectedDays"
        />
      </el-col>
      <el-col :xs="24" :lg="8">
        <PlatformStatsCard :items="platformStats" :count="count" />
      </el-col>
      <el-col :span="24">
        <ModuleUsageChartCard
          :modules="modules"
          :total-modules="totalModules"
          :limit="limit"
          @update:limit="setLimit"
        />
      </el-col>
    </el-row>

    <el-tooltip
      :content="$t('dashboard.update_time.title', { time: formatDateTime(lastUpdateTime) })"
      placement="left"
    >
      <el-button
        class="refresh-button"
        circle
        size="large"
        type="primary"
        :disabled="loading || analyticsLoading || modulesLoading"
        @click="refreshData"
      >
        <i class="mdi mdi-refresh"></i>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CommandStatsCard from '@/components/dashboard/analytics/CommandStatsCard.vue'
import ModuleUsageChartCard from '@/components/dashboard/analytics/ModuleUsageChartCard.vue'
import PlatformStatsCard from '@/components/dashboard/analytics/PlatformStatsCard.vue'
import BotInfoCard from '@/components/dashboard/BotInfoCard.vue'
import RealtimeOverviewCard from '@/components/dashboard/RealtimeOverviewCard.vue'
import ResourceUsageCard from '@/components/dashboard/ResourceUsageCard.vue'
import SystemInfoCard from '@/components/dashboard/SystemInfoCard.vue'
import { useAnalytics } from '@/composables/useAnalytics.js'
import { useServerInfo } from '@/composables/useServerInfo.js'
import { formatDateTime } from '@/utils/systemFormat.js'

const {
  loading,
  lastUpdateTime: serverUpdateTime,
  bot,
  cpu,
  os,
  memory,
  disk,
  processes,
  runningSeconds,
  serverOffline,
  fetchServerInfo,
} = useServerInfo()

const {
  selectedDays,
  limit,
  loading: analyticsLoading,
  modulesLoading,
  lastUpdateTime: analyticsUpdateTime,
  trendData,
  count,
  averageCount,
  changeRate,
  platformStats,
  modules,
  totalModules,
  fetchAnalytics,
  setSelectedDays,
  setLimit,
} = useAnalytics()

/** 采集失败时没有可信的进程列表，展示为未知 */
const processCount = computed(() => (serverOffline.value ? null : processes.items.length))

/** 实时数据与统计各拉各的，页面只展示两者中较新的一次更新时间 */
const lastUpdateTime = computed(() => Math.max(serverUpdateTime.value, analyticsUpdateTime.value))

const refreshData = async () => {
  await Promise.all([fetchServerInfo(true), fetchAnalytics(true)])
}
</script>

<style scoped>
.dashboard-row {
  row-gap: 20px;
  margin-top: 20px;
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important;
}
</style>
