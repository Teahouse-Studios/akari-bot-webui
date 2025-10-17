<template>
  <el-result
    icon="error"
    :title="$t('not_found.result.title')"
    :sub-title="$t('not_found.result.subtitle')"
  >
    <template #extra>
      <el-button type="primary" @click="goHome">{{ $t('button.back') }}</el-button>
    </template>
  </el-result>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>
