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

<script>
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import ServerInfoCard from '@/components/dashboard/ServerInfoCard.vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'DashboardPage',
  components: {
    AnalyticsCard,
    ServerInfoCard,
  },
  data() {
    const { t } = useI18n()

    return {
      loading: false,
      refreshInterval: null,
      lastUpdateTime: Math.floor(Date.now() / 1000),
      t,
    }
  },
  mounted() {
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.clearAutoRefresh()
  },
  methods: {
    refreshData() {
      this.loading = true
      this.lastUpdateTime = Math.floor(Date.now() / 1000)
      this.$refs.serverInfoCard.fetchServerInfoData().finally(() => {
        this.loading = false
      })
      if (this.$refs.analyticsCard) {
        const selectedDays = this.$refs.analyticsCard.selectedDays
        this.$refs.analyticsCard.fetchAnalyticsData(selectedDays)
      }
      this.resetAutoRefresh()
    },
    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.refreshData()
      }, 3600000)
    },
    resetAutoRefresh() {
      this.clearAutoRefresh()
      this.startAutoRefresh()
    },
    clearAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },
    formatTime(timestamp) {
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
    },
  },
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
