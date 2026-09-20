<template>
  <div class="dashboard">
    <StatTileGroup
      :running-seconds="runningSeconds"
      :command-parsed="bot.command_parsed"
      :message-parsed="bot.message_parsed"
      :command-rate="commandRate"
      :message-rate="messageRate"
      :jobqueue-backend="bot.jobqueue_backend"
      :web-render-ready="bot.web_render_status"
      :process-total-memory="processTotalMemory"
      :processes-available="processes.error !== 'unavailable'"
      :server-offline="serverOffline"
      :loading="loading"
    />

    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :lg="10">
        <ServerInfoCard :os="os" :bot="bot" :cpu="cpu" :loading="loading" />
      </el-col>
      <el-col :xs="24" :lg="14">
        <ResourceGaugeCard
          :cpu-percent="cpu.cpu_percent"
          :memory="memory"
          :disk="disk"
          :loading="loading"
        />
      </el-col>

      <el-col :span="24">
        <ProcessUsageCard
          :items="processes.items"
          :failures="processes.failures"
          :error="processes.error"
          :loading="loading"
        />
      </el-col>
    </el-row>

    <el-tooltip
      :content="$t('dashboard.update_time.title', { time: formatTime(lastUpdateTime) })"
      placement="left"
    >
      <el-button
        class="refresh-button"
        circle
        size="large"
        type="primary"
        :disabled="loading"
        @click="refreshData"
      >
        <i class="mdi mdi-refresh"></i>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import ProcessUsageCard from '@/components/dashboard/ProcessUsageCard.vue'
import ResourceGaugeCard from '@/components/dashboard/ResourceGaugeCard.vue'
import ServerInfoCard from '@/components/dashboard/ServerInfoCard.vue'
import StatTileGroup from '@/components/dashboard/StatTileGroup.vue'
import { useServerInfo } from '@/composables/useServerInfo.js'
import LocalStorageJson from '@/localStorageJson.js'

const {
  loading,
  lastUpdateTime,
  os,
  bot,
  cpu,
  memory,
  disk,
  processes,
  commandRate,
  messageRate,
  runningSeconds,
  serverOffline,
  processTotalMemory,
  fetchServerInfo,
} = useServerInfo()

const refreshData = async () => {
  await fetchServerInfo(true)
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000)
  const language = (LocalStorageJson.getItem('language') || 'zh_cn').toLowerCase()

  const langMap = {
    zh_cn: 'zh-CN',
    zh_tw: 'zh-TW',
    en_us: 'en-US',
    ja_jp: 'ja-JP',
    ko_kr: 'ko-KR',
  }

  const locale = langMap[language] || 'zh-CN'

  if (locale === 'ja-JP') {
    return new Intl.DateTimeFormat(locale, {
      calendar: 'japanese',
      era: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}
</script>

<style scoped>
.dashboard-row {
  row-gap: 20px;
  margin-top: 20px;
}

.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important;
}
</style>
