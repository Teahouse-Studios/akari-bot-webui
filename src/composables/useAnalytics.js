import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'
import { buildCommandAnalytics } from '@/utils/analytics.js'

export function useAnalytics() {
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

  /** 命令调用记录：命令趋势与平台统计共用同一份数据 */
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

  /** 模块调用排行 */
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

  /** 一次拉齐两份统计 */
  function fetchAnalytics(noCache = false) {
    return Promise.all([fetchCommandAnalytics(noCache), fetchModules(noCache)])
  }

  function setSelectedDays(value) {
    selectedDays.value = value
    return fetchAnalytics()
  }

  function setLimit(value) {
    limit.value = value
    return fetchModules()
  }

  onBeforeUnmount(() => {
    abortController.abort()
  })

  return {
    selectedDays,
    limit,
    loading,
    modulesLoading,
    lastUpdateTime,
    trendData,
    count,
    averageCount,
    changeRate,
    platformStats,
    modules,
    totalModules,
    fetchAnalytics,
    fetchModules,
    setSelectedDays,
    setLimit,
  }
}
