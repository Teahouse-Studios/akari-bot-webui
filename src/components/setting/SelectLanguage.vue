<template>
  <h3><i class="mdi mdi-translate"></i> {{ $t('setting.select_language.title') }}</h3>
    <el-select
      v-model="currentLang"
      @change="changeLanguage"
      class="lang-select"
      style="width: 100px; margin-right: 10px;"
    >
      <el-option label="简体中文" value="zh_cn" />
      <el-option label="繁體中文" value="zh_tw" />
      <el-option label="English" value="en_us" />
      <el-option label="日本語" value="ja_jp" />
    </el-select>
  </template>
  
  <script>
  import { elementPlusLangMap } from "@/element-plus-langmap";
  import { useI18n } from 'vue-i18n';
  
  export default {
    name: "LanguageSelector",
    data() {
      const { t } = useI18n();
      return {
        currentLang: localStorage.getItem("language") || "zh_cn",
        t
      };
    },
    inject: ['elementLocale'],
    methods: {
      changeLanguage(lang) {
        this.currentLang = lang;
        this.$i18n.locale = lang;
        localStorage.setItem("language", lang);
        this.elementLocale.lang = elementPlusLangMap[lang];
      },
    },
  };
  </script>
  
  <style scoped>
  .lang-select {
    min-width: 100px;
  }
  </style>
  