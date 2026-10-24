/**
 * 主题色派生工具。
 *
 * 由一个主色推导出整套强调色：Element Plus 的 light/dark 梯度、
 * 渐变用的副色（色相偏移后的「浅紫」）、主色块上的文字色，以及可直接作正文的主色文字色。
 */

export const AKARI_PINK = '#f2a7c6'
export const TEAHOUSE_BLUE = '#0091ff'
export const DEFAULT_THEME_COLOR = AKARI_PINK

// 旧版小可粉，已保存该值的用户自动迁移到新的默认色
const LEGACY_AKARI_PINK = '#edaab3'

// 与主色块搭配的深色文字（梅紫墨色），在粉彩底色上比白字更清楚
export const INK = '#3b2a3d'
const WHITE = '#ffffff'
const LIGHT_SURFACE = '#ffffff'
const DARK_SURFACE = '#1a151d'

// 副色由主色色相向薰衣草紫靠拢得到：粉色（≈335°）落在浅紫，蓝色落在靛紫
const LAVENDER_HUE = 270
const MAX_HUE_DRIFT = 65

export function normalizeThemeColor(color) {
  if (!color || color.toLowerCase() === LEGACY_AKARI_PINK) return DEFAULT_THEME_COLOR
  return color
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value.slice(0, 6)
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

function rgbToHex(rgb) {
  return `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

export function mix(color, weight, mixWith = WHITE) {
  const a = hexToRgb(color)
  const b = hexToRgb(mixWith)
  return rgbToHex(a.map((v, i) => v * (1 - weight) + b[i] * weight))
}

function luminance(color) {
  const [r, g, b] = hexToRgb(color).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function rgbToHsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [h * 60, s, l]
}

function hslToRgb([h, s, l]) {
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

function driftToLavender(color) {
  const [h, s, l] = rgbToHsl(hexToRgb(color))
  // 取最短方向的色相差，限制在 ±MAX_HUE_DRIFT 内
  const distance = ((LAVENDER_HUE - h + 540) % 360) - 180
  const drift = Math.max(-MAX_HUE_DRIFT, Math.min(MAX_HUE_DRIFT, distance))
  return rgbToHex(hslToRgb([(h + drift + 360) % 360, s * 0.85, l]))
}

/** 逐步向目标色混合，直到与背景的对比度达到正文要求 */
function ensureReadable(color, surface, towards) {
  let result = color
  for (let weight = 0.05; contrast(result, surface) < 4.5 && weight <= 1; weight += 0.05) {
    result = mix(color, weight, towards)
  }
  return result
}

export function applyThemeColor(rawColor) {
  const color = normalizeThemeColor(rawColor)
  const isDark = document.documentElement.classList.contains('dark')
  // 暗色模式下的浅色梯度混向带紫调的底色，而不是纯黑
  const lightBase = isDark ? DARK_SURFACE : WHITE
  const darkBase = isDark ? WHITE : '#000000'
  const secondary = driftToLavender(color)

  const vars = {
    '--el-color-primary': color,
    '--el-color-primary-light-3': mix(color, 0.3, lightBase),
    '--el-color-primary-light-5': mix(color, 0.5, lightBase),
    '--el-color-primary-light-7': mix(color, 0.7, lightBase),
    '--el-color-primary-light-8': mix(color, 0.8, lightBase),
    '--el-color-primary-light-9': mix(color, 0.9, lightBase),
    '--el-color-primary-dark-2': mix(color, 0.2, darkBase),
    '--ak-secondary': secondary,
    '--ak-on-primary': contrast(WHITE, color) >= 3 ? WHITE : INK,
    '--ak-primary-text': isDark
      ? ensureReadable(color, DARK_SURFACE, WHITE)
      : ensureReadable(color, LIGHT_SURFACE, INK),
  }

  const root = document.documentElement
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
}

/** ECharts 画在 canvas 上读不到 CSS 变量，绘制前取一次当前计算值 */
export function getChartTheme() {
  const style = getComputedStyle(document.documentElement)
  const read = (name) => style.getPropertyValue(name).trim()
  const primary = read('--el-color-primary')
  const secondary = read('--ak-secondary') || primary
  const textColor = read('--el-text-color-secondary')
  const lineColor = read('--el-border-color-light')

  return {
    primary,
    secondary,
    /** 给 #rrggbb 加透明度；其它格式原样返回 */
    withAlpha: (color, alpha) =>
      /^#[0-9a-f]{6}$/i.test(color)
        ? color +
          Math.round(alpha * 255)
            .toString(16)
            .padStart(2, '0')
        : color,
    axis: {
      axisLine: { lineStyle: { color: lineColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor, type: 'dashed' } },
    },
    /** 上下方向的线性渐变 */
    verticalGradient: (top, bottom) => ({
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: top },
        { offset: 1, color: bottom },
      ],
    }),
  }
}
