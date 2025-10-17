<template>
  <div>
    <ChangePassword />
    <SelectLanguage />
    <ThemeSetting />
    <SwitchDevelopMode />
    <RestartBot />
  </div>
</template>

<script setup>
import ChangePassword from '@/components/setting/ChangePassword.vue'
import SelectLanguage from '@/components/setting/SelectLanguage.vue'
import ThemeSetting from '@/components/setting/ThemeSetting.vue'
import SwitchDevelopMode from '@/components/setting/SwitchDevelopMode.vue'
import RestartBot from '@/components/setting/RestartBot.vue'
</script>

<style>
h3 {
  cursor: default;
}
</style>
