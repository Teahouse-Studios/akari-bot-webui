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

<script>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

export default {
  name: 'EmptyView',
  data() {
    const router = useRouter()
    const { t } = useI18n()

    return {
      router,
      t,
    }
  },
  methods: {
    goHome() {
      this.router.push('/')
    },
  },
}
</script>
