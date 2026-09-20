/**
 * 统计数据的时间分桶与聚合工具（沿用旧版主页命令统计的实现）。
 *
 * `/api/analytics` 返回原始调用记录，前端按 30 分钟分桶绘图，
 * 并按 `target_id` 的平台前缀聚合「平台命令统计」。
 */

export const ANALYTICS_LIMIT_OPTIONS = [20, 50, 100, 200]

const INTERVAL_MINUTES = 30

const CHART_COLORS = [
  '#F56C6C',
  '#E6A23C',
  '#FAE384',
  '#67C23A',
  '#1ABC9C',
  '#409EFF',
  '#9B59B6',
  '#E84393',
]

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date
    .toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')
}

export function getAlignedTime(date, now, intervalMinutes = INTERVAL_MINUTES) {
  const diffMs = now.getTime() - date.getTime()
  const step = Math.floor(diffMs / (intervalMinutes * 60 * 1000))
  return new Date(now.getTime() - step * intervalMinutes * 60 * 1000)
}

export function groupDataByTimeInterval(records, now) {
  const groupedData = {}

  records.forEach((item) => {
    const timestamp = new Date(item.timestamp)
    if (Number.isNaN(timestamp.getTime())) return

    const alignedTime = getAlignedTime(timestamp, now, INTERVAL_MINUTES)
    const timeKey = alignedTime.getTime()

    if (!groupedData[timeKey]) {
      groupedData[timeKey] = { date: alignedTime, count: 0 }
    }
    groupedData[timeKey].count += 1
  })

  return Object.values(groupedData).sort((a, b) => a.date - b.date)
}

export function fillMissingData(timeGroupedData, days, now) {
  const totalIntervals = (days * 24 * 60) / INTERVAL_MINUTES
  const filledData = []
  const dataMap = new Map(timeGroupedData.map((item) => [item.date.getTime(), item]))

  for (let i = totalIntervals - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * INTERVAL_MINUTES * 60 * 1000)
    const alignedDate = getAlignedTime(date, now, INTERVAL_MINUTES)
    const bucket = dataMap.get(alignedDate.getTime())
    filledData.push(bucket || { date: alignedDate, count: 0 })
  }

  return filledData
}

export function getColorByIndex(prefix) {
  let hash = 0
  for (let i = 0; i < prefix.length; i++) hash += prefix.charCodeAt(i)
  return CHART_COLORS[hash % CHART_COLORS.length]
}

/**
 * 一次算出「命令统计」卡与「平台命令统计」卡需要的全部数据。
 *
 * @param records    `/api/analytics` 的 `data` 数组
 * @param days       时间窗口（天）
 * @param changeRate 接口返回的环比变化率
 * @param t          i18n 的 t，用于「未知」平台名
 */
export function buildCommandAnalytics(records, days, changeRate, t) {
  const now = new Date()
  const timeGroupedData = groupDataByTimeInterval(records, now)

  const trendData = fillMissingData(timeGroupedData, days, now).map((item) => ({
    date: formatTimestamp(item.date),
    count: item.count,
  }))

  const count = timeGroupedData.reduce((sum, item) => sum + item.count, 0)

  const prefixCountMap = {}
  records.forEach((item) => {
    const prefix = item.target_id?.split('|')[0] || t('unknown')
    prefixCountMap[prefix] = (prefixCountMap[prefix] || 0) + 1
  })

  const platformStats = Object.entries(prefixCountMap)
    .map(([prefix, platformCount]) => ({ prefix, count: platformCount }))
    .sort((a, b) => b.count - a.count)

  return {
    trendData,
    count,
    averageCount: Math.round(count / days),
    changeRate: Math.floor((changeRate || 0) * 100),
    platformStats,
  }
}
