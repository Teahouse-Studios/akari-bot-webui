/**
 * 日志行解析与高亮工具。
 *
 * 日志由 `/ws/logs` 以文本流的形式推送，格式为：
 * `[平台][模块:函数:行号][时间][级别]:内容`
 * 非 `[...][...][...][...]:` 开头的行会拼接为上一条日志的续行（多行日志）。
 */

export const LOG_LEVELS = ['DEBUG', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']

export const DEFAULT_ACTIVE_LOG_LEVELS = ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']

export const MAX_VISIBLE_LOGS = 16384

const LOG_LINE_PATTERN = /^\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]:(.*)$/s

const LOG_LINE_PREFIX_PATTERN = /^\[.*?\]\[.*?\]\[.*?\]\[.*?\]:/

const LOG_PLATFORM_COLOR = '#11a8cd'
const LOG_MODULES_COLOR = '#e5e510'
const LOG_DATETIME_COLOR = '#0dbc79'

const LOG_LEVEL_COLORS = {
  DEBUG: '#3b8ec9',
  INFO: '#ffffff',
  SUCCESS: '#23d18b',
  WARNING: '#f5f543',
  ERROR: '#f14c4c',
  CRITICAL: '#ffffff',
}

export function isLogLineStart(line) {
  return LOG_LINE_PREFIX_PATTERN.test(line)
}

/** 把一行日志切分为带样式的片段，供模板渲染 */
export function formatLogLine(line) {
  const match = line.match(LOG_LINE_PATTERN)

  if (!match) {
    return [{ text: line, style: { color: '#fff' } }]
  }

  const [, logPlatform, logModules, logDatetime, logLevel, logContent] = match
  const isCritical = logLevel === 'CRITICAL'

  return [
    { text: `[${logPlatform}]`, style: { color: LOG_PLATFORM_COLOR } },
    { text: `[${logModules}]`, style: { color: LOG_MODULES_COLOR } },
    { text: `[${logDatetime}]`, style: { color: LOG_DATETIME_COLOR } },
    {
      text: `[${logLevel}]:${logContent}`,
      style: {
        color: LOG_LEVEL_COLORS[logLevel] || '#ffffff',
        backgroundColor: isCritical ? '#cd3131' : 'transparent',
      },
    },
  ]
}

/** 把文本中的 URL 切分为可点击的外链片段 */
export function splitTextIntoSegments(text) {
  const urlRegex = /((?:https?:\/\/|www\.)[^\s[\]]+)/gi
  const segments = []
  let lastIndex = 0
  let match = null

  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    "'": "'",
    '"': '"',
  }

  while ((match = urlRegex.exec(text)) !== null) {
    const idx = match.index
    let rawUrl = match[0]

    const prevChar = text[idx - 1]
    const expectedEndChar = pairs[prevChar]

    if (expectedEndChar && rawUrl.endsWith(expectedEndChar)) {
      rawUrl = rawUrl.slice(0, -1)
      urlRegex.lastIndex -= 1
    }
    if (idx > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, idx) })
    }

    let url = rawUrl
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    segments.push({ type: 'link', text: rawUrl, url })
    lastIndex = idx + rawUrl.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return segments
}

/**
 * 解析原始日志文本：先按“行首标记”合并多行日志，再按关键词与级别过滤。
 * 只保留最后 `MAX_VISIBLE_LOGS` 条，避免长会话下 DOM 过大。
 */
export function parseLogData(rawText, { searchText = '', activeLogLevels = [] } = {}) {
  const rawLines = rawText.split('\n')
  const formattedLines = []
  let buffer = ''

  rawLines.forEach((line) => {
    if (isLogLineStart(line)) {
      if (buffer) formattedLines.push(formatLogLine(buffer))
      buffer = line
    } else {
      buffer += `\n${line}`
    }
  })

  if (buffer) formattedLines.push(formatLogLine(buffer))

  const keyword = searchText.trim().toLowerCase()
  let visibleLogs = formattedLines

  if (keyword) {
    visibleLogs = visibleLogs.filter((logLine) =>
      logLine.some((part) => part.text.toLowerCase().includes(keyword)),
    )
  }

  // 未选择任何级别时不额外过滤（显示全部），避免出现「什么都没有」的空视图
  if (activeLogLevels.length) {
    visibleLogs = visibleLogs.filter((logLine) =>
      activeLogLevels.some((level) => logLine.some((part) => part.text.includes(level))),
    )
  }

  if (visibleLogs.length > MAX_VISIBLE_LOGS) {
    visibleLogs = visibleLogs.slice(-MAX_VISIBLE_LOGS)
  }

  return visibleLogs
}
