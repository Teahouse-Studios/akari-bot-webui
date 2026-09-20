export const WEBRENDER_MODES = ['status', 'source', 'screenshot']

export const WAIT_UNTIL_OPTIONS = ['commit', 'domcontentloaded', 'load', 'networkidle']

export const OUTPUT_TYPE_OPTIONS = ['jpeg', 'png']

/** 错误码 → i18n 键（后端文案不稳定，前端本地化展示） */
export const WEBRENDER_ERROR_KEYS = {
  browser_unavailable: 'webrender.error.browser_unavailable',
  render_failed: 'webrender.error.render_failed',
  invalid_options: 'webrender.error.invalid_options',
  init_failed: 'webrender.error.init_failed',
  control_failed: 'webrender.error.control_failed',
  web_render_disabled: 'webrender.error.web_render_disabled',
  missing_target: 'webrender.tester.validate.target',
}

const COMMON_OPTION_FIELDS = [
  'css',
  'width',
  'height',
  'counttime',
  'stealth',
  'wait_until',
  'wait_after_load',
  'locale',
]

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

/**
 * 按模式裁剪参数：`status` 只探测可用性，`source` 需要 url，
 * `screenshot` 需要 url 或 content。
 */
export function buildTestPayload(form) {
  const payload = { mode: form.mode || 'status' }

  if (form.mode === 'source') {
    payload.url = form.url
    if (form.raw_text) payload.raw_text = true
  }

  if (form.mode === 'screenshot') {
    if (form.target === 'content') {
      payload.content = form.content
    } else {
      payload.url = form.url
    }
    if (form.element?.length) payload.element = form.element
    payload.output_type = form.output_type || 'jpeg'
    if (payload.output_type === 'jpeg') payload.output_quality = form.output_quality
  }

  for (const field of COMMON_OPTION_FIELDS) {
    const value = form[field]
    if (!isEmpty(value)) payload[field] = value
  }

  return payload
}

/** 生成等价的 cURL 与 JSON，便于复制到终端或其他工具重放 */
export function buildRequestPreview(payload, origin) {
  const base = (origin || window.location.origin).replace(/\/$/, '')
  const url = `${base}/api/webrender/test`
  const json = JSON.stringify(payload, null, 2)

  const curl = [
    `curl -X POST '${url}' \\`,
    `  -H 'Authorization: Bearer <JWT>' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${JSON.stringify(payload)}'`,
  ].join('\n')

  return { url, json, curl }
}

/** 后端返回裸 base64，前端自行拼接 data URL */
export function imageDataUrl(base64, outputType = 'jpeg') {
  const type = outputType === 'png' ? 'png' : 'jpeg'
  return `data:image/${type};base64,${base64}`
}

/** 校验当前表单是否满足对应模式的必填项 */
export function validateForm(form) {
  if (form.mode === 'source') return Boolean(form.url)
  if (form.mode === 'screenshot') {
    if (form.target === 'content') return Boolean(form.content?.trim())
    return Boolean(form.url)
  }
  return true
}
