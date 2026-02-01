<template>
  <div>
    <h3><i class="mdi mdi-translate"></i> {{ $t('setting.select_language.title') }}</h3>
    <el-select
      v-model="currentLang"
      @change="changeLanguage"
      class="lang-select"
      style="width: 100px; margin-right: 10px"
    >
      <el-option
        v-for="lang in langList"
        :key="lang"
        :value="lang"
        :label="$t('language', {}, { locale: lang })"
      />
    </el-select>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { elementPlusLangMap } from '@/element-plus-langmap.js'
import LocalStorageJson from '@/localStorageJson.js'

const { locale } = useI18n()
const currentLang = ref(LocalStorageJson.getItem('language') || 'zh_cn')
const elementLocale = inject('elementLocale')

const langModules = import.meta.glob('@/i18n/*.json')
const langList = computed(() =>
  Object.keys(langModules).map(path =>
    path.match(/\/([^/]+)\.json$/)[1]
  )
)

function changeLanguage(lang) {
  currentLang.value = lang
  locale.value = lang
  LocalStorageJson.setItem('language', lang)
  if (elementLocale) {
    elementLocale.lang = elementPlusLangMap[lang]
  }
  window.location.reload()
}
</script>

<style scoped>
.lang-select {
  min-width: 100px;
}
</style>
