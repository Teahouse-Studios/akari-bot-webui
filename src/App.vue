<template>
  <el-config-provider :locale="elementLocale.lang">
    <div id="app">
      <DemoWatermark />
      <div
        class="loading-overlay"
        v-if="userVerified === null"
        v-loading="userVerified === null"
      ></div>
      <AppHeader :userVerified="userVerified" @toggle-sidebar="toggleSidebar" />
      <LoginModal v-if="isPromptLogin" />
      <div v-if="!loading">
        <SuggestSetPasswordModal v-model="showSuggestPasswordModal" />
        <AppSidebar :visible="windowWidth > 1024" @menuSelect="handleMenuSelect" />
        <AppSidebarDrawer
          v-if="windowWidth <= 1024"
          v-model="isSidebarVisible"
          @menuSelect="handleMenuSelect"
        />
        <el-container :style="{ marginTop: '60px' }">
          <el-main class="content" :style="{ marginLeft: sidebarMarginLeft }">
            <RouterView v-if="userVerified" />
          </el-main>
        </el-container>
      </div>
      <el-skeleton v-else :rows="5" animated />
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import axios from '@/axios.mjs'
import LocalStorageJson from '@/localStorageJson.js'
import { elementPlusLangMap } from '@/element-plus-langmap.js'
import AppSidebarDrawer from './components/SidebarDrawer.vue'
import AppSidebar from './components/Sidebar.vue'
import AppHeader from './components/Header.vue'
import DemoWatermark from './components/DemoWatermark.vue'
import LoginModal from './components/LoginModal.vue'
import SuggestSetPasswordModal from './components/SuggestSetPasswordModal.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from './const'

const elementLocale = inject('elementLocale')
const { t, locale } = useI18n()

const loading = ref(true)
const userVerified = ref(false)
const isPromptLogin = ref(false)
const isSidebarVisible = ref(false)
const showSuggestPasswordModal = ref(false)
const windowWidth = ref(window.innerWidth)

const sidebarMarginLeft = computed(() => {
  return isSidebarVisible.value && windowWidth.value > 1024 ? '200px' : '0'
})

async function initializeUserVerification() {
  if (!LocalStorageJson.getItem('token')) {
    await checkPassword()
  } else {
    try {
      const response = await axios.get('/api/verify')
      if (response.status === 200) {
        userVerified.value = true
      }

      if (IS_DEMO) {
        showSuggestPasswordModal.value = true
      } else {
        const noPassword = response.data.no_password
        const promptDisabled = LocalStorageJson.getItem('noPasswordPromptDisabled') === 'true'
        if (noPassword && !promptDisabled) {
          showSuggestPasswordModal.value = true
        }
      }
    } catch (error) {
      await checkPassword()
      LocalStorageJson.removeItem('token')
    }
  }
}

async function checkPassword() {
  try {
    const response = await axios.post('/api/login', {})
    if (response.status === 200) {
      userVerified.value = true
      LocalStorageJson.setItem('token', response.data.data)
      const promptDisabled = LocalStorageJson.getItem('noPasswordPromptDisabled') === 'true'
      if (!promptDisabled) {
        showSuggestPasswordModal.value = true
      }
    }
  } catch (error) {
    if (error.response?.status === 401) {
      isPromptLogin.value = true
    } else if (error.response?.status === 429) {
      isPromptLogin.value = true
      ElMessage.error(t('login.message.error.abuse'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

function updateSidebarVisibility() {
  windowWidth.value = window.innerWidth
  isSidebarVisible.value = windowWidth.value > 1024
}

function handleMenuSelect(view) {
  const router = inject('router')
  router.push({ name: view })
}

function toggleSidebar() {
  if (windowWidth.value <= 1024) {
    isSidebarVisible.value = !isSidebarVisible.value
  }
}

function applyThemeColor(color) {
  if (!color) return
  const isDark = document.documentElement.classList.contains('dark')
  const white = isDark ? '#000000' : '#ffffff'
  const black = isDark ? '#ffffff' : '#000000'

  const mix = (_color, weight, mixWith = '#ffffff') => {
    const d2h = (d) => d.toString(16).padStart(2, '0')
    const h2d = (h) => parseInt(h, 16)

    const col1 = _color.slice(1)
    const col2 = mixWith.slice(1)

    const red = Math.round(h2d(col1.slice(0, 2)) * (1 - weight) + h2d(col2.slice(0, 2)) * weight)
    const green = Math.round(h2d(col1.slice(2, 4)) * (1 - weight) + h2d(col2.slice(2, 4)) * weight)
    const blue = Math.round(h2d(col1.slice(4, 6)) * (1 - weight) + h2d(col2.slice(4, 6)) * weight)

    return `#${d2h(red)}${d2h(green)}${d2h(blue)}`
  }

  const root = document.documentElement
  root.style.setProperty('--el-color-primary', color)
  root.style.setProperty('--el-color-primary-light-3', mix(color, 0.3, white))
  root.style.setProperty('--el-color-primary-light-5', mix(color, 0.5, white))
  root.style.setProperty('--el-color-primary-light-7', mix(color, 0.7, white))
  root.style.setProperty('--el-color-primary-light-8', mix(color, 0.8, white))
  root.style.setProperty('--el-color-primary-light-9', mix(color, 0.9, white))
  root.style.setProperty('--el-color-primary-dark-2', mix(color, 0.2, black))
}

function observeThemeChange() {
  const savedColor = LocalStorageJson.getItem('themeColor')
  if (savedColor) applyThemeColor(savedColor)

  const handleStorage = (event) => {
    if (event.key === 'themeColor') {
      applyThemeColor(event.newValue || '#edaab3')
    }
  }

  const handleThemeChange = () => {
    const color = LocalStorageJson.getItem('themeColor') || '#edaab3'
    applyThemeColor(color)
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener('theme-change', handleThemeChange)

  const observer = new MutationObserver(() => {
    const color = LocalStorageJson.getItem('themeColor') || '#edaab3'
    applyThemeColor(color)
  })

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  onBeforeUnmount(() => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('theme-change', handleThemeChange)
    observer.disconnect()
  })
}

onMounted(async () => {
  updateSidebarVisibility()
  window.addEventListener('resize', updateSidebarVisibility)
  observeThemeChange()

  if (!LocalStorageJson.getItem('language')) {
    await fetch('/api/init')
      .then((res) => res.json())
      .then((config) => {
        locale.value = config.lang
        LocalStorageJson.setItem('language', config.lang)
        elementLocale.lang = elementPlusLangMap[config.lang]
      })
  }

  await initializeUserVerification()
  loading.value = false
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSidebarVisibility)
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
}

.content {
  overflow-y: auto;
  background-color: transparent;
  z-index: 0;
  transition:
    margin-left 0.3s,
    transform 0.3s;
}

.content-with-sidebar {
  margin-left: 200px;
}
</style>
