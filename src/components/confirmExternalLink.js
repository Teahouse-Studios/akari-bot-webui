import { ElMessageBox } from 'element-plus'

function isLocalUrl(url) {
  try {
    const { hostname } = new URL(url)

    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    )
  } catch (e) {
    return false
  }
}

export async function confirmExternalLink(url, t) {
  if (isLocalUrl(url)) {
    window.open(url, '_blank')
    return true
  }

  try {
    await ElMessageBox.confirm(t('chat.external_link.confirm.message', { url }), t('chat.external_link.confirm.title'), {
      confirmButtonText: t('yes'),
      cancelButtonText: t('no'),
      type: 'warning',
    })

    window.open(url, '_blank')
    return true
  } catch {
    return false
  }
}