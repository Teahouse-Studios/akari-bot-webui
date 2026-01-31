<template>
  <el-header class="header">
    <div class="header-left">
      <el-button class="menu-button" @click="switchSidebar" v-if="screenWidth < 1024">
        <i class="mdi mdi-menu"></i>
      </el-button>
      <div class="logo" @click="handleLogoClick">
        <img src="@/assets/akaribot_logo.png" alt="Logo" class="logo-image" />
        <span class="web-ui-text" v-if="screenWidth >= 384">WebUI</span>
      </div>
    </div>

    <div class="header-right">
      <el-button class="help-button" @click="goToHelp">{{ $t('header.button.doc') }}</el-button>
      <el-button class="theme-toggle-button" @click="toggleDarkMode">
        <i :class="isDarkMode ? 'mdi mdi-weather-sunny' : 'mdi mdi-weather-night'"></i>
      </el-button>
    </div>
  </el-header>

  <div
    v-if="showHelp"
    class="help-iframe-wrapper"
    :style="{
      top: helpIframeStyle.top,
      left: helpIframeStyle.left,
      width: helpIframeStyle.width,
      height: helpIframeStyle.height,
    }"
    @mousedown="startDrag"
  >
    <div class="help-iframe-header">
      <span>{{ $t('header.button.doc') }}</span>
      <div class="help-iframe-actions">
        <button @click="iframeOpenNew" :title="$t('iframe.button.open_new')">
          <i class="mdi mdi-dock-window"></i>
        </button>
        <button class="close-btn" :title="$t('button.close')" @click="showHelp = false">
          <i class="mdi mdi-window-close"></i>
        </button>
      </div>
    </div>
    <iframe ref="helpIframe" :src="helpUrl" frameborder="0" class="help-iframe-content"></iframe>
  </div>
</template>

<script setup>
import LocalStorageJson from '@/localStorageJson.js'
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  userVerified: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-sidebar'])

const isDarkMode = ref(false)
const screenWidth = ref(window.innerWidth)

const showHelp = ref(false)
const helpUrl = 'https://bot.teahouse.team'
const helpIframeStyle = ref({
  top: '50px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '375px',
  height: '667px',
})

let isDragging = false
let dragStartX = 0
let dragStartY = 0
let initialTop = 0
let initialLeft = 0

function updateScreenWidth() {
  screenWidth.value = window.innerWidth
}

const { t } = useI18n()

const devClickCount = ref(0)

function handleLogoClick() {
  if (!props.userVerified) {
    return
  }

  const current = LocalStorageJson.getItem('showDevelopMode') === 'true'
  if (current) {
    ElMessage.info(t('setting.develop_mode.message.info.already'))
    return
  }

  devClickCount.value++
  const remainingClicks = 7 - devClickCount.value

  if (remainingClicks > 0 && remainingClicks < 6) {
    ElMessage.info(t('setting.develop_mode.message.info.remain', { remain: remainingClicks }))
  }

  if (devClickCount.value >= 7) {
    LocalStorageJson.setItem('showDevelopMode', 'true')
    ElMessage.success(t('setting.develop_mode.message.success'))
    devClickCount.value = 0
    window.dispatchEvent(new Event('develop-mode-change'))
  }
}

function goToHelp() {
  if (screenWidth.value < 400) {
    window.open(helpUrl, '_blank')
  } else {
    showHelp.value = true
  }
}

function startDrag(e) {
  if (e.target.classList.contains('close-btn')) return
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  initialTop = parseInt(helpIframeStyle.value.top)
  initialLeft = parseInt(helpIframeStyle.value.left)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging) return
  const deltaX = e.clientX - dragStartX
  const deltaY = e.clientY - dragStartY
  helpIframeStyle.value.top = `${initialTop + deltaY}px`
  helpIframeStyle.value.left = `${initialLeft + deltaX}px`
}

function stopDrag() {
  isDragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

function iframeOpenNew() {
  window.open(helpUrl, '_blank')
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  LocalStorageJson.setItem('isDarkMode', JSON.stringify(isDarkMode.value))
}

function switchSidebar() {
  if (!props.userVerified) return
  emit('toggle-sidebar')
}

onMounted(() => {
  const savedTheme = LocalStorageJson.getItem('isDarkMode')
  if (savedTheme !== null) {
    isDarkMode.value = JSON.parse(savedTheme)
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }
  window.addEventListener('resize', updateScreenWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenWidth)
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #f4f4f4;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #e0e0e0;
}

.dark .header {
  background-color: #333;
  border-bottom: 1px solid #1f1f1f;
}

.menu-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 24px;
  color: inherit;
  transition: color 0.3s ease;
  margin-right: 12px;
}

.menu-button:hover {
  background-color: #f4f4f4;
  color: #888;
}

.dark .menu-button:hover {
  background-color: #333;
  color: #aaa;
}

.theme-toggle-button {
  background-color: #2e2e2e;
  color: white;
}

.dark .theme-toggle {
  background: white;
  color: #333;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 22px;
  font-weight: bold;
  display: flex;
  justify-content: left;
  padding: 20px 0;
}

.logo-image {
  height: 42px;
  width: auto;
  margin-right: 6px;
}

.web-ui-text {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #666;
  cursor: default;
  font-family:
    'Roboto',
    'Noto Sans SC',
    system-ui,
    -apple-system,
    sans-serif;
}

.dark .web-ui-text {
  color: #aaa;
}

.theme-toggle-button {
  font-size: 22px;
  padding: 6px;
  background-color: #2e2e2e;
  color: white;
  border: none;
}

.theme-toggle-button:hover {
  background-color: #666;
  color: white;
}

.dark .theme-toggle-button {
  background-color: #eee;
  color: #333;
}

.dark .theme-toggle-button:hover {
  background-color: #c0c0c0;
  color: #333;
}

.lang-select {
  min-width: 100px;
}
.help-iframe-wrapper {
  position: fixed;
  border: 1px solid #ccc;
  background-color: white;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.help-iframe-header {
  height: 36px;
  background: #323437;
  color: white;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  font-size: 14px;
}

.help-iframe-actions button {
  margin-left: 4px;
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.help-iframe-actions button:hover {
  color: var(--el-color-primary);
}

.help-iframe-content {
  flex: 1;
  width: 100%;
}
.close-btn {
  font-size: 16px;
  cursor: pointer;
  background: transparent;
  border: none;
  color: white;
}
.close-btn:hover {
  color: #666;
}
</style>
