import { createApp, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from '@/router'
import ElementPlus from 'element-plus'
import { elementPlusLangMap } from './element-plus-langmap'
import '@fortawesome/fontawesome-free/css/all.css'
import '@mdi/font/css/materialdesignicons.css'
import zh_cn from './i18n/zh_cn.json'
import zh_tw from './i18n/zh_tw.json'
import en_us from './i18n/en_us.json'
import ja_jp from './i18n/ja_jp.json'
import './styles/theme-akari/var.scss'
import './styles/theme-akari/dark/var.css'

function initApp(config) {
  const config_locale = (config && config.locale) || 'zh_cn'

  if (!localStorage.getItem('language')) {
    localStorage.setItem('language', config_locale)
  }

  const locale = localStorage.getItem('language')

  const i18n = createI18n({
    legacy: false,
    locale,
    messages: {
      zh_cn,
      zh_tw,
      en_us,
      ja_jp,
    },
  })

  const app = createApp(App)

  const elementPlusLocale = reactive({
    lang: elementPlusLangMap[locale] || elementPlusLangMap.zh_cn,
  })

  app.provide('elementLocale', elementPlusLocale)
  app.use(ElementPlus, { locale: elementPlusLocale.lang })
  app.use(i18n)
  app.use(router)

  const isDark = localStorage.getItem('isDarkMode') === 'true'
  document.documentElement.classList.toggle('dark', isDark)

  app.mount('#app')
}

fetch('/config.json')
  .then((res) => res.json())
  .then((config) => initApp(config))
  .catch(() => {
    initApp({ locale: 'zh_cn' })
  })
