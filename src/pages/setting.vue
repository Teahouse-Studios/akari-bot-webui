<template>
  <div>
    <ChangePassword />
    <TwoFactorAuth v-if="hasPassword" />
    <SelectLanguage />
    <ThemeSetting />
    <SwitchDevelopMode />
    <BotOptions />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChangePassword from '@/components/setting/ChangePassword.vue'
import SelectLanguage from '@/components/setting/SelectLanguage.vue'
import ThemeSetting from '@/components/setting/ThemeSetting.vue'
import SwitchDevelopMode from '@/components/setting/SwitchDevelopMode.vue'
import TwoFactorAuth from '@/components/setting/TwoFactorAuth.vue'
import BotOptions from '@/components/setting/BotOptions.vue'
import axios from '@/axios.mjs'

const hasPassword = ref(false)

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/password')
    hasPassword.value = data.have_password === true
  } catch {
    // 获取密码状态失败时默认隐藏2FA设置
    hasPassword.value = false
  }
})
</script>

<style>
h3 {
  cursor: default;
}
</style>
