<template>
  <div class="setting-page">
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

<style scoped>
/* 每个设置组件的根节点各自成为一张贴纸卡片 */
.setting-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 960px;
}

.setting-page > div {
  padding: 20px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ak-radius-card);
  box-shadow: 0 3px 0 0 var(--ak-edge);
}

.setting-page > div :deep(.ak-card-title) {
  margin-bottom: 14px;
}
</style>
