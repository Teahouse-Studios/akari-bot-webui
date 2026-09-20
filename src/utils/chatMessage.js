/**
 * 聊天消息的工具函数：Markdown 渲染、消息块归一化与展示辅助。
 *
 * 消息内容来自机器人的通用消息格式（块数组），这里统一归一化为
 * `{ type, content, ... }` 结构，便于模板按类型渲染。
 */
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import linkAttributes from 'markdown-it-link-attributes'

export const MAX_IMAGES = 10
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const md = new MarkdownIt('zero')
  .set({ html: false, linkify: true, breaks: true })
  .use(linkAttributes, {
    pattern: /^(https?:)?\/\//,
    attrs: {
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  })
  .use((md_) => {
    md_.enable(['blockquote', 'fence', 'heading', 'list'])
    md_.enable([
      'autolink',
      'backticks',
      'emphasis',
      'escape',
      'link',
      'linkify',
      'newline',
      'strikethrough',
      'text',
    ])

    md_.renderer.rules.paragraph_open = () => ''
    md_.renderer.rules.paragraph_close = () => '<br />'

    md_.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
      const hrefIndex = tokens[idx].attrIndex('href')
      if (hrefIndex >= 0) {
        const href = tokens[idx].attrs[hrefIndex][1]
        if (!/^(https?:)?\/\//.test(href) && !href.startsWith('/')) {
          tokens[idx].attrs[hrefIndex][1] = `https://${href}`
        }
      }
      return self.renderToken(tokens, idx, options)
    }

    md_.renderer.rules.fence = (tokens, idx) => {
      const content = tokens[idx].content
      return `<pre class="chat-pre">${md_.utils.escapeHtml(content)}</pre>`
    }

    md_.renderer.rules.code_inline = (tokens, idx) => {
      const content = tokens[idx].content
      return `<code class="chat-code">${md_.utils.escapeHtml(content)}</code>`
    }

    md_.renderer.rules.blockquote_open = () => {
      return '<blockquote class="chat-blockquote">'
    }
  })

export const ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'a',
  'code',
  'pre',
  'blockquote',
  'br',
  'img',
  'p',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]

export const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'class', 'alt', 'title']

export function renderMarkdown(text) {
  if (!text) return ''

  let raw = md.render(text).replace(/\[image:([^\]]+)\]/g, (match, src) => {
    return `<img src="${src}" class="chat-img" />`
  })

  const leadingNewlines = text.match(/^\n+/)
  if (leadingNewlines) {
    const count = leadingNewlines[0].length
    raw = '<br />'.repeat(count) + raw
  }

  raw = raw.replace(/(?:<br\s*\/?>\s*)+$/, '')

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

export function isDataImage(src) {
  return typeof src === 'string' && /^data:image\//i.test(src)
}

export function normalizeMessageBlocks(data) {
  const list = Array.isArray(data) ? data : data == null ? [] : [data]
  return list
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null
      switch (item.type) {
        case 'text': {
          if (typeof item.content !== 'string') return null
          let html = renderMarkdown(item.content)
          if (list[idx + 1]?.type === 'text') {
            html += '<br />'
          }
          return { type: 'text', content: item.content, html }
        }
        case 'image':
          return isDataImage(item.content) ? { type: 'image', content: item.content } : null
        case 'audio':
          return typeof item.content === 'string' ? { type: 'audio', content: item.content } : null
        case 'video':
          return typeof item.content === 'string' ? { type: 'video', content: item.content } : null
        case 'action_text':
          return typeof item.content === 'string'
            ? {
                type: 'action_text',
                content: item.content,
                show: typeof item.show === 'string' ? item.show : item.content,
              }
            : null
        case 'button_frame':
          return Array.isArray(item.content)
            ? { type: 'button_frame', content: item.content }
            : null
        case 'embed':
          return item.content && typeof item.content === 'object'
            ? { type: 'embed', content: item.content }
            : null
        case 'nodes': {
          const content = item.content
          if (!content || typeof content !== 'object' || !Array.isArray(content.nodes)) {
            return null
          }
          return {
            type: 'nodes',
            content: {
              name: typeof content.name === 'string' ? content.name : '',
              nodes: content.nodes.map((chain) => normalizeMessageBlocks(chain)),
            },
          }
        }
        default:
          return null
      }
    })
    .filter(Boolean)
}

export function renderMessageText(data) {
  const list = Array.isArray(data) ? data : data == null ? [] : [data]
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      if (item.type === 'text' && typeof item.content === 'string') return item.content
      if (item.type === 'action_text' && typeof item.content === 'string') {
        return item.content
      }
      return ''
    })
    .filter((s) => s !== '')
    .join('\n')
}

export function nodesPreviewText(node, t) {
  if (!Array.isArray(node)) return ''
  const parts = []
  for (const block of node) {
    if (!block) continue
    if (block.type === 'text' && typeof block.content === 'string') {
      const oneLine = block.content.replace(/\s+/g, ' ').trim()
      if (oneLine) parts.push(oneLine)
    } else if (block.type === 'action_text') {
      const show = block.show || block.content || ''
      if (show) parts.push(show)
    } else if (block.type === 'image') {
      parts.push(t('chat.nodes.image'))
    } else if (block.type === 'audio') {
      parts.push(t('chat.nodes.audio'))
    } else if (block.type === 'video') {
      parts.push(t('chat.nodes.video'))
    } else if (block.type === 'button_frame') {
      parts.push(t('chat.nodes.button'))
    } else if (block.type === 'embed') {
      parts.push(block.content?.title || t('chat.nodes.embed'))
    }
  }
  return parts.join(' ')
}

export function isExternalUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

export function colorToHex(color) {
  const toHex = (n) =>
    '#' +
    (Number.isFinite(n) ? Math.floor(n) & 0xffffff : 0x0091ff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()

  if (typeof color === 'number') return toHex(color)

  if (typeof color === 'string') {
    const s = color.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) return s.toUpperCase()
    if (/^0x[0-9a-fA-F]+$/.test(s)) return toHex(parseInt(s, 16))
    const n = Number(s)
    if (Number.isFinite(n)) return toHex(n)
  }

  return '#0091FF'
}

export function formatTimestamp(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return ''
  return new Date(n * 1000).toLocaleString()
}

export function msgHasImage(msg) {
  return Array.isArray(msg?.blocks) && msg.blocks.some((b) => b && b.type === 'image')
}
