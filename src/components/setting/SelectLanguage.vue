<template>
  <div>
    <h3><i class="mdi mdi-translate"></i> {{ $t('setting.select_language.title') }}</h3>
    <el-select
      v-model="currentLang"
      @change="changeLanguage"
      class="lang-select"
      style="width: 100px; margin-right: 10px"
    >
      <el-option label="简体中文" value="zh_cn" />
      <el-option label="繁體中文" value="zh_tw" />
      <el-option label="English" value="en_us" />
      <el-option label="日本語" value="ja_jp" />
    </el-select>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { elementPlusLangMap } from '@/element-plus-langmap'

const { locale } = useI18n()

const currentLang = ref(localStorage.getItem('language') || 'zh_cn')

const elementLocale = inject('elementLocale')

function changeLanguage(lang) {
  currentLang.value = lang
  locale.value = lang
  localStorage.setItem('language', lang)
  if (elementLocale) {
    elementLocale.lang = elementPlusLangMap[lang]
  }
}
</script>

<style scoped>
.lang-select {
  min-width: 100px;
}
</style>
