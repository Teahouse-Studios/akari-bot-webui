/**
 * 切换明暗模式或主题色时，短暂地给 <html> 打上 data-theme-transition，
 * 让非 Element Plus 元素的颜色渐变过去，而不是瞬间跳变。
 * 只在切换期间生效，避免常驻的 transition 拖慢悬停等交互。
 */

export const THEME_TRANSITION_DURATION = 300

let timer = null

export function startThemeTransition() {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.setAttribute('data-theme-transition', '')

  clearTimeout(timer)
  timer = setTimeout(() => {
    root.removeAttribute('data-theme-transition')
    timer = null
  }, THEME_TRANSITION_DURATION + 50)
}
