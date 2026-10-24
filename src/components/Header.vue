<template>
  <el-header class="header">
    <div class="header-left">
      <el-button class="menu-button" @click="switchSidebar" v-if="screenWidth < 1024">
        <i class="mdi mdi-menu"></i>
      </el-button>
      <div class="logo" @click="handleLogoClick">
        <img src="@/assets/akaribot_logo.png" alt="Logo" class="logo-image" />
        <span class="ak-badge" v-if="screenWidth >= 384">WebUI</span>
      </div>
    </div>

    <div class="header-right">
      <el-dropdown trigger="click" @command="changeLanguage">
        <el-button class="header-icon-button" :title="$t('setting.select_language.title')">
          <i class="mdi mdi-translate"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="lang in langList"
              :key="lang"
              :command="lang"
              :class="{ 'is-active-language': lang === locale }"
            >
              {{ $t('language', {}, { locale: lang }) }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button class="header-icon-button" @click="toggleDarkMode">
        <i :class="isDarkMode ? 'mdi mdi-weather-sunny' : 'mdi mdi-weather-night'"></i>
      </el-button>
    </div>
  </el-header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { ElMessage } from 'element-plus'
import LocalStorageJson from '@/localStorageJson.js'
import { elementPlusLangMap } from '@/element-plus-langmap.js'
import { useI18n } from 'vue-i18n'
import { useDarkMode } from '@/composables/useDarkMode.js'

const props = defineProps({
  userVerified: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-sidebar'])

const { isDarkMode, toggleDarkMode } = useDarkMode()
const screenWidth = ref(window.innerWidth)

function updateScreenWidth() {
  screenWidth.value = window.innerWidth
}

const { t, locale } = useI18n()
const elementLocale = inject('elementLocale')

const langModules = import.meta.glob('@/i18n/*.json')
const langList = Object.keys(langModules).map((path) => path.match(/\/([^/]+)\.json$/)[1])

function changeLanguage(lang) {
  if (lang === locale.value) return
  locale.value = lang
  LocalStorageJson.setItem('language', lang)
  if (elementLocale) {
    elementLocale.lang = elementPlusLangMap[lang]
  }
  window.location.reload()
}

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

function switchSidebar() {
  if (!props.userVerified) return
  emit('toggle-sidebar')
}

onMounted(() => {
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
  background-color: var(--el-bg-color);
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 底边那条粉→紫圆头虚线，呼应 logo 下方的轨迹 */
.header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 3px;
  background: var(--ak-gradient);
  mask: var(--ak-dash-mask) repeat-x;
  -webkit-mask: var(--ak-dash-mask) repeat-x;
  opacity: 0.7;
  pointer-events: none;
}

.menu-button {
  background: transparent;
  border: none;
  padding: 0;
  width: 36px;
  height: 36px;
  font-size: 24px;
  color: inherit;
  transition: color 0.3s ease;
  margin-right: 8px;
}

.menu-button:hover {
  background-color: var(--el-fill-color-light);
  color: var(--ak-primary-text);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
}

.logo-image {
  height: 42px;
  width: auto;
}

.header-icon-button {
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 20px;
  color: var(--el-text-color-regular);
  background-color: transparent;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ak-radius-control);
}

.header-icon-button:hover,
.header-icon-button:focus-visible {
  color: var(--ak-primary-text);
  background-color: var(--ak-tint);
  border-color: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
}

.header-right :deep(.el-dropdown) {
  display: flex;
}

/* el-button 相邻时自带的左外边距 */
.header-icon-button + .header-icon-button {
  margin-left: 0;
}
</style>
