import LocalStorageJson from '@/localStorageJson.js'

/**
 * 系统信息展示用的格式化工具。
 */

const KIB = 1024

const LOCALE_MAP = {
  zh_cn: 'zh-CN',
  zh_tw: 'zh-TW',
  en_us: 'en-US',
  ja_jp: 'ja-JP',
  ko_kr: 'ko-KR',
}

/** 当前界面语言对应的 BCP 47 locale 标签 */
export function getLocaleTag() {
  const language = (LocalStorageJson.getItem('language') || 'zh_cn').toLowerCase()
  return LOCALE_MAP[language] || 'zh-CN'
}

/** 秒级时间戳 → 本地化的「年-月-日 时:分:秒」 */
export function formatDateTime(timestamp) {
  const date = new Date((Number(timestamp) || 0) * 1000)
  const locale = getLocaleTag()

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

/**
 * 运行时长 → 等宽时钟串；超过一天时前缀「N 天」（文案取自 i18n）。
 * 例：`3 天 02:14:33` / `02:14:33`
 */
export function formatUptime(seconds, t) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const days = Math.floor(total / 86400)
  const clock = [Math.floor((total % 86400) / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')

  return days > 0 ? `${days} ${t('dashboard.overview.days')} ${clock}` : clock
}

const MIB = KIB * 1024
const GIB = MIB * 1024

/** 字节数 → 人类可读（`/api/server-info` 的 processes.items[].memory 是字节） */
export function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value >= GIB) return `${(value / GIB).toFixed(2)} GB`
  if (value >= MIB) return `${(value / MIB).toFixed(1)} MB`
  if (value >= KIB) return `${(value / KIB).toFixed(1)} KB`
  return `${value} B`
}

const USAGE_COLORS = {
  normal: '#1989fa',
  warning: '#e6a23c',
  danger: '#f56c6c',
}

/** 占用率 → 语义色（<60 正常、60–90 警告、≥90 危险），资源环与进程条共用 */
export function getUsageColor(percent) {
  const value = Number(percent) || 0
  if (value >= 90) return USAGE_COLORS.danger
  if (value >= 60) return USAGE_COLORS.warning
  return USAGE_COLORS.normal
}

/** 后端返回的 0–100 百分比数值 */
