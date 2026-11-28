import { computed } from 'vue'
import logoDark from '@/assets/akaribot_logo_dark.png'
import logoLight from '@/assets/akaribot_logo.png'
import { useDarkMode } from '@/composables/useDarkMode.js'

/**
 * 品牌 logo：深色模式使用深色版，其余情况使用浅色版。
 *
 * 深色模式由 <html class="dark"> 控制，支持手动切换与跟随系统，
 * 因此这里跟随 useDarkMode 的响应式状态，而不是 CSS 媒体查询。
 */
export function useLogo() {
  const { isDarkMode } = useDarkMode()
  const logoSrc = computed(() => (isDarkMode.value ? logoDark : logoLight))

  return { logoSrc }
}
