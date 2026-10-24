<template>
  <el-card class="info-card" shadow="never">
    <h3 class="dashboard-card-title">
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
  --info-label-width: 9em;
  line-height: 1;
}

.info-card .dashboard-card-title {
  margin-bottom: 6px;
}

.info-card p {
  /* 固定标签列宽：长短不一的标签不会把数值推得忽左忽右 */
  display: grid;
  grid-template-columns: var(--info-label-width) minmax(0, 1fr);
  align-items: baseline;
  gap: 16px;
  margin: 0;
  padding: 11px 0;
  line-height: 1.5;
  font-size: 14px;
  /* 行与行之间的虚线，像本子上的横格 */
  border-bottom: 1px dashed var(--el-border-color);
}

.info-card p:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.data-title {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  /* 较长标签在列内换行，不再撑出卡片或挤歪数值 */
  overflow-wrap: anywhere;
  cursor: default;
}

.data-text {
  min-width: 0;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}
</style>
