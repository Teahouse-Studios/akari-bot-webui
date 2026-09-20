<template>
  <div class="analytics-page">
    <el-row :gutter="20" class="responsive-row">
      <el-col :span="16" :xs="24">
        <CommandStatsCard
          :trend-data="trendData"
          :count="count"
          :average-count="averageCount"
          :change-rate="changeRate"
          :selected-days="selectedDays"
          :loading="loading"
          @update:selected-days="onDaysChange"
        />
      </el-col>
      <el-col :span="8" :xs="24">
        <PlatformStatsCard :items="platformStats" :count="count" :loading="loading" />
      </el-col>
      <el-col :span="24">
        <ModuleUsageChartCard
          :modules="modules"
          :total-modules="totalModules"
          :limit="limit"
          :loading="modulesLoading"
          @update:limit="onLimitChange"
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
        :disabled="loading || modulesLoading"
        @click="fetchAll(true)"
      >
        <i class="mdi mdi-refresh"></i>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'
import CommandStatsCard from '@/components/analytics/CommandStatsCard.vue'
import ModuleUsageChartCard from '@/components/analytics/ModuleUsageChartCard.vue'
import PlatformStatsCard from '@/components/analytics/PlatformStatsCard.vue'
import LocalStorageJson from '@/localStorageJson.js'
import { buildCommandAnalytics } from '@/utils/analytics.js'

const { t } = useI18n()

const selectedDays = ref('1')
const limit = ref(50)
const loading = ref(false)
const modulesLoading = ref(false)
const lastUpdateTime = ref(Math.floor(Date.now() / 1000))

const trendData = ref([])
const count = ref(0)
const averageCount = ref(0)
const changeRate = ref(0)
const platformStats = ref([])

const modules = ref([])
const totalModules = ref(0)

const abortController = new AbortController()

const buildHeaders = (noCache) => {
  if (!noCache) return {}
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }
}

/** 命令调用记录：命令统计与平台统计共用同一份数据 */
async function fetchCommandAnalytics(noCache = false) {
  if (loading.value) return
  loading.value = true

  try {
    const response = await axios.get('/api/analytics', {
      headers: buildHeaders(noCache),
      signal: abortController.signal,
      params: { days: Number(selectedDays.value) || 1 },
    })

    const data = response.data || {}
    const records = Array.isArray(data.data) ? data.data : []
    const days = Number(selectedDays.value) || 1
    const summary = buildCommandAnalytics(records, days, data.change_rate, t)

    trendData.value = summary.trendData
    count.value = summary.count
    averageCount.value = summary.averageCount
    changeRate.value = summary.changeRate
    platformStats.value = summary.platformStats
    lastUpdateTime.value = Math.floor(Date.now() / 1000)
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    loading.value = false
  }
}

/** 模块调用排行：`limit` 只影响返回条数，`total_modules` 始终是完整模块数 */
async function fetchModules(noCache = false) {
  if (modulesLoading.value) return
  modulesLoading.value = true

  try {
    const response = await axios.get('/api/analytics/modules', {
      headers: buildHeaders(noCache),
      signal: abortController.signal,
      params: { days: Number(selectedDays.value) || 1, limit: limit.value },
    })

    const data = response.data || {}
    modules.value = Array.isArray(data.modules) ? data.modules : []
    totalModules.value = data.total_modules || 0
    lastUpdateTime.value = Math.floor(Date.now() / 1000)
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    modulesLoading.value = false
  }
}

function fetchAll(noCache = false) {
  return Promise.all([fetchCommandAnalytics(noCache), fetchModules(noCache)])
}

function onDaysChange(value) {
  selectedDays.value = value
  fetchAll()
}

function onLimitChange(value) {
  limit.value = value
  fetchModules()
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

  return new Intl.DateTimeFormat(langMap[language] || 'zh-CN', {
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
  fetchAll()
})

onBeforeUnmount(() => {
  abortController.abort()
})
</script>

<style scoped>
.responsive-row {
  row-gap: 20px;
}

.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important;
}
</style>
