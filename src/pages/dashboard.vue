<template>
  <div>
    <ServerInfoCard ref="serverInfoCard" />
    <AnalyticsCard ref="analyticsCard" />
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import ServerInfoCard from '@/components/dashboard/ServerInfoCard.vue'

const loading = ref(false)
const refreshInterval = ref(null)
const lastUpdateTime = ref(Math.floor(Date.now() / 1000))

const serverInfoCard = ref(null)
const analyticsCard = ref(null)

function refreshData() {
  loading.value = true
  lastUpdateTime.value = Math.floor(Date.now() / 1000)

  serverInfoCard.value?.fetchServerInfoData().finally(() => {
    loading.value = false
  })

  if (analyticsCard.value) {
    const selectedDays = analyticsCard.value.selectedDays
    analyticsCard.value.fetchAnalyticsData(selectedDays)
  }

  resetAutoRefresh()
}

function startAutoRefresh() {
  refreshInterval.value = setInterval(() => {
    refreshData()
  }, 3600000)
}

function resetAutoRefresh() {
  clearAutoRefresh()
  startAutoRefresh()
}

function clearAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000)
  const language = (localStorage.getItem('language') || 'zh_cn').toLowerCase()

  const langMap = {
    zh_cn: 'zh-CN',
    zh_tw: 'zh-TW',
    en_us: 'en-US',
    ja_jp: 'ja-JP',
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

onMounted(() => {
  startAutoRefresh()
})

onBeforeUnmount(() => {
  clearAutoRefresh()
})
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
