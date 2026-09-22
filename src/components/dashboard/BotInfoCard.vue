<template>
  <el-card class="info-card" shadow="never">
    <h3>
      <i class="mdi mdi-robot-outline"></i>
      {{ $t('dashboard.server_info.bot.title') }}
    </h3>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.bot.label.bot_version') }}</strong
      ><span class="data-text">{{ formatBotVersion(bot.version) }}</span>
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.bot.label.python_version') }}</strong
      ><span class="data-text">{{ bot.python_version || '-' }}</span>
    </p>
    <p>
      <strong class="data-title">{{
        $t('dashboard.server_info.bot.label.web_render_status')
      }}</strong
      ><span class="data-text">{{ webRenderText }}</span>
    </p>
    <p>
      <strong class="data-title">{{
        $t('dashboard.server_info.bot.label.jobqueue_backend')
      }}</strong
      ><span class="data-text">{{ bot.jobqueue_backend || '-' }}</span>
    </p>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  bot: {
    type: Object,
    default: () => ({}),
  },
})

const { t } = useI18n()

/** 开发版版本号形如 `git:<short sha>`，只保留短哈希 */
function formatBotVersion(version) {
  if (!version) return '-'
  if (version.startsWith('git:')) return version.slice(4, 11)
  return version
}

const webRenderText = computed(() => (props.bot.web_render_status ? t('true') : t('false')))
</script>

<style scoped>
.info-card {
  line-height: 1;
}

h3 {
  cursor: default;
}

.data-text {
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.data-title {
  margin-right: 3ex;
  color: var(--el-text-color-primary);
  cursor: default;
}
</style>
