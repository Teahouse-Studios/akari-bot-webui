<template>
  <el-config-provider :locale="elementLocale.lang">
    <div id="app">
      <DemoWatermark />
      <div class="loading-overlay" v-if="userVerified === null" v-loading="userVerified === null"></div>
      <AppHeader @toggle-sidebar="toggleSidebar" />
      <LoginModal v-if="isPromptLogin" />
      <div v-if="!isLoading">
        <SuggestSetPasswordModal v-model="showSuggestPasswordModal" />
        <div v-if="isSidebarVisible && windowWidth <= 1024" class="sidebar-overlay" @click="closeSidebar"></div>
        <AppSidebar :class="['sidebar', { show: isSidebarVisible }]" @menuSelect="handleMenuSelect" />
        <el-container :style="{ marginTop: '60px' }">
          <el-main :class="[
            'content',
            {
              'content-with-sidebar': isSidebarVisible,
              'show-sidebar': isSidebarVisible && windowWidth <= 1024,
            },
          ]" :style="{ marginLeft: sidebarMarginLeft }">
            <RouterView v-if="userVerified" />
          </el-main>
          <div class="content-footer"></div>
        </el-container>
      </div>
      <el-skeleton v-else :rows="5" animated />
    </div>
  </el-config-provider>
</template>

<script>
import { inject } from 'vue'
import axios from '@/axios.mjs'
import AppSidebar from './components/Sidebar.vue'
import AppHeader from './components/Header.vue'
import DemoWatermark from './components/DemoWatermark.vue'
import LoginModal from './components/LoginModal.vue'
import SuggestSetPasswordModal from './components/SuggestSetPasswordModal.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from './const'

export default {
  components: {
    AppHeader,
    AppSidebar,
    DemoWatermark,
    LoginModal,
    SuggestSetPasswordModal,
  },
  data() {
    const elementLocale = inject('elementLocale')
    const { t } = useI18n()

    return {
      isLoading: false,
      userVerified: false,
      isPromptLogin: false,
      isSidebarVisible: true,
      showSuggestPasswordModal: false,
      windowWidth: window.innerWidth,
      abortController: new AbortController(),
      elementLocale,
      t,
    }
  },
  computed: {
    sidebarMarginLeft() {
      return this.isSidebarVisible ? '200px' : '0'
    },
  },
  mounted() {
    this.updateSidebarVisibility()
    window.addEventListener('resize', this.updateSidebarVisibility)
    this.observeThemeChange()
  },
  async beforeMount() {
    let that = this
    if (!localStorage.getItem("language")) {
      await fetch('/api/init')
        .then((res) => res.json())
        .then((config) => {
          that.$i18n.locale = config.lang
          localStorage.setItem('language', config.lang)
          that.elementLocale.lang = elementPlusLangMap[config.lang]
        })
    }
    await this.initializeUserVerification()
    this.isLoading = false
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateSidebarVisibility)
  },
  methods: {
    async initializeUserVerification() {
      if(!localStorage.getItem("token")) return this.checkPassword()
      try {
        const response = await axios.get('/api/verify')
        if (response.status !== 200) return this.checkPassword()
        this.userVerified = true

        if (IS_DEMO) {
          // this.showSuggestPasswordModal = true
        } else {
          const noPassword = response.data.no_password
          const promptDisabled = localStorage.getItem('noPasswordPromptDisabled') === 'true'
          if (noPassword && !promptDisabled) {
            this.showSuggestPasswordModal = true
          }
        }
      } catch (error) {
        this.checkPassword()
        localStorage.removeItem("token")
      }
    },
    async checkPassword() {
      try {
        const response = await axios.post('/api/login', {})
        if (response.status === 200) {
          this.userVerified = true
          localStorage.setItem("token", response.data.data)
          const promptDisabled = localStorage.getItem('noPasswordPromptDisabled') === 'true'
          if (!promptDisabled) {
            this.showSuggestPasswordModal = true
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          this.isPromptLogin = true
        } else if (error.response?.status === 403) {
          ElMessage.error(this.t('login.message.abuse'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      }
    },
    updateSidebarVisibility() {
      this.windowWidth = window.innerWidth
      this.isSidebarVisible = this.windowWidth > 1024
    },
    handleMenuSelect(view) {
      this.$router.push({ name: view })
    },
    toggleSidebar() {
      if (this.windowWidth <= 1024) {
        this.isSidebarVisible = !this.isSidebarVisible
      }
    },
    closeSidebar() {
      this.isSidebarVisible = false
    },
    applyThemeColor(color) {
      if (!color) return
      const isDark = document.documentElement.classList.contains('dark')
      const white = isDark ? '#000000' : '#ffffff'
      const black = isDark ? '#ffffff' : '#000000'

      const mix = (color, weight, mixWith = '#ffffff') => {
        const d2h = (d) => d.toString(16).padStart(2, '0')
        const h2d = (h) => parseInt(h, 16)

        const col1 = color.slice(1)
        const col2 = mixWith.slice(1)

        const r = Math.round(h2d(col1.slice(0, 2)) * (1 - weight) + h2d(col2.slice(0, 2)) * weight)
        const g = Math.round(h2d(col1.slice(2, 4)) * (1 - weight) + h2d(col2.slice(2, 4)) * weight)
        const b = Math.round(h2d(col1.slice(4, 6)) * (1 - weight) + h2d(col2.slice(4, 6)) * weight)

        return `#${d2h(r)}${d2h(g)}${d2h(b)}`
      }

      const root = document.documentElement
      root.style.setProperty('--el-color-primary', color)
      root.style.setProperty('--el-color-primary-light-3', mix(color, 0.3, white))
      root.style.setProperty('--el-color-primary-light-5', mix(color, 0.5, white))
      root.style.setProperty('--el-color-primary-light-7', mix(color, 0.7, white))
      root.style.setProperty('--el-color-primary-light-8', mix(color, 0.8, white))
      root.style.setProperty('--el-color-primary-light-9', mix(color, 0.9, white))
      root.style.setProperty('--el-color-primary-dark-2', mix(color, 0.2, black))
    },

    observeThemeChange() {
      const savedColor = localStorage.getItem('themeColor')
      if (savedColor) {
        this.applyThemeColor(savedColor)
      }

      window.addEventListener('storage', (event) => {
        if (event.key === 'themeColor') {
          const color = event.newValue || '#edaab3' // fallback
          this.applyThemeColor(color)
        }
      })

      window.addEventListener('theme-change', () => {
        const color = localStorage.getItem('themeColor') || '#edaab3'
        this.applyThemeColor(color)
      })

      const observer = new MutationObserver(() => {
        const color = localStorage.getItem('themeColor') || '#edaab3'
        this.applyThemeColor(color)
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    },
  },
}
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
  top: 60px;
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

.content-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: -1;
}

.dark .content-footer {
  background-color: #181818;
}

.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 200px;
  background-color: white;
  z-index: 100;
  transition: transform 0.3s ease-in-out;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-200px);
    transition: transform 0.3s ease-in-out;
  }

  .sidebar.show {
    transform: translateX(0px);
  }

  .content-with-sidebar {
    margin-left: 0 !important;
  }

  .sidebar-overlay {
    display: block;
  }
}

@media (min-width: 1025px) {
  .sidebar {
    left: 0;
  }

  .content-with-sidebar {
    margin-left: 200px;
  }

  .sidebar-overlay {
    display: none;
  }
}
</style>
