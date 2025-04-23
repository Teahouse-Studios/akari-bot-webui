<template>
  <h3>{{ $t('setting.select_language.title') }}</h3>
    <el-select
      v-model="currentLang"
      @change="changeLanguage"
      class="lang-select"
      style="width: 100px; margin-right: 10px;"
    >
      <el-option label="简体中文" value="zh_cn" />
      <el-option label="繁體中文" value="zh_tw" />
      <el-option label="English" value="en_us" />
    </el-select>
  </template>
  
  <script>
  import { useI18n } from 'vue-i18n';
  
  export default {
    name: "LanguageSelector",
    data() {
      const { t } = useI18n();
      return {
        t,
        currentLang: localStorage.getItem("language") || "zh_cn",
      };
    },
    methods: {
      changeLanguage(lang) {
        this.currentLang = lang;
        this.$i18n.locale = lang;
        localStorage.setItem("language", lang);
      },
    },
  };
  </script>
  
  <style scoped>
  .lang-select {
    min-width: 100px;
  }
  </style>
  