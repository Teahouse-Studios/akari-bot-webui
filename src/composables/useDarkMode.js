import { computed, ref } from 'vue'
import LocalStorageJson from '@/localStorageJson.js'
import { startThemeTransition } from '@/utils/themeTransition.js'

const DARK_MODE_KEY = 'darkMode'
const LEGACY_DARK_MODE_KEY = 'isDarkMode'
const DARK_MODE_OPTIONS = ['on', 'off', 'system']

const currentMode = ref('system')
const isDarkMode = ref(false)
const systemPrefersDark = ref(false)

let mediaQuery = null
let mediaListener = null
let initialized = false

function readStoredMode() {
  const storedMode = LocalStorageJson.getItem(DARK_MODE_KEY)
  if (DARK_MODE_OPTIONS.includes(storedMode)) {
    return storedMode
  }

  // 兼容舊版僅儲存布林值的 isDarkMode 設定
  const legacyMode = LocalStorageJson.getItem(LEGACY_DARK_MODE_KEY)
  if (legacyMode !== null) {
    return legacyMode === true || legacyMode === 'true' ? 'on' : 'off'
  }

  return 'system'
}

function applyDarkMode({ animate = true } = {}) {
  const wasDark = isDarkMode.value
  if (currentMode.value === 'system') {
    isDarkMode.value = systemPrefersDark.value
  } else {
    isDarkMode.value = currentMode.value === 'on'
  }
  if (animate && wasDark !== isDarkMode.value) {
    startThemeTransition()
  }
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

export function initDarkMode() {
  if (initialized) return
  initialized = true

  currentMode.value = readStoredMode()

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches
    mediaListener = (event) => {
      systemPrefersDark.value = event.matches
      if (currentMode.value === 'system') {
        applyDarkMode()
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', mediaListener)
    } else {
      mediaQuery.addListener(mediaListener)
    }
  }

  // 首次加载直接套用，不做过渡
  applyDarkMode({ animate: false })
}

export function setDarkMode(mode) {
  if (!DARK_MODE_OPTIONS.includes(mode)) return

  currentMode.value = mode
  LocalStorageJson.setItem(DARK_MODE_KEY, mode)
  // 清除舊版設定，避免與新模式互相覆蓋
  LocalStorageJson.removeItem(LEGACY_DARK_MODE_KEY)
  applyDarkMode()
}

export function toggleDarkMode() {
  setDarkMode(isDarkMode.value ? 'off' : 'on')
}

export function useDarkMode() {
  initDarkMode()

  const darkMode = computed({
    get: () => currentMode.value,
    set: (mode) => setDarkMode(mode),
  })

  return {
    darkMode,
    isDarkMode,
    setDarkMode,
    toggleDarkMode,
  }
}
