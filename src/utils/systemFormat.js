/**
 * 系统信息展示用的格式化工具。
 */

const KIB = 1024
const MIB = KIB * 1024
const GIB = MIB * 1024

/** 秒数 → `x 小时 y 分 z 秒`（文案取自 i18n，便于各语言调整顺序） */
export function formatDuration(seconds, t) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  return t('dashboard.server_info.text.format_time', {
    hours,
    minutes,
    seconds: secs,
  })
}

/** 字节数 → 人类可读（`/api/server-info` 的 processes.items[].memory 是字节） */
export function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value >= GIB) return `${(value / GIB).toFixed(2)} GB`
  if (value >= MIB) return `${(value / MIB).toFixed(1)} MB`
  if (value >= KIB) return `${(value / KIB).toFixed(1)} KB`
  return `${value} B`
}

/** 后端返回的 0–100 百分比数值 */
export function formatPercentNumber(value, digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0%'
  return `${number.toFixed(digits)}%`
}
