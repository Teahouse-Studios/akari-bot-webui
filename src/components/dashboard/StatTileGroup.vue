<template>
  <div class="stat-tile-group" v-loading="loading">
    <el-alert
      v-if="serverOffline"
      :title="$t('dashboard.kpi.server_offline')"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <el-row :gutter="20" class="tile-row">
      <el-col v-for="tile in tiles" :key="tile.key" :xs="24" :sm="12" :md="12" :lg="6">
        <el-card class="tile-card" shadow="never">
          <div class="tile-inner">
            <i :class="['mdi', tile.icon]" class="tile-icon"></i>
            <div class="tile-text">
              <div class="tile-label">{{ tile.label }}</div>
              <div class="tile-value">{{ tile.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatBytes, formatDuration } from '@/utils/systemFormat.js'

const props = defineProps({
  runningSeconds: {
    type: Number,
    default: 0,
  },
  commandParsed: {
    type: Number,
    default: null,
  },
  messageParsed: {
    type: Number,
    default: null,
  },
  commandRate: {
    type: Number,
    default: null,
  },
  messageRate: {
    type: Number,
    default: null,
  },
  jobqueueBackend: {
    type: String,
    default: null,
  },
  webRenderReady: {
    type: Boolean,
    default: false,
  },
  processTotalMemory: {
    type: Number,
    default: 0,
  },
  processesAvailable: {
    type: Boolean,
    default: true,
  },
  serverOffline: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const EMPTY = '—'

const formatCount = (value) => (typeof value === 'number' ? value : EMPTY)

const formatRate = (value) =>
  typeof value === 'number' ? t('dashboard.kpi.rate_value', { value }) : EMPTY

const tiles = computed(() => [
  {
    key: 'running_time',
    icon: 'mdi-clock-outline',
    label: t('dashboard.server_info.bot.label.running_time'),
    value: formatDuration(props.runningSeconds, t),
  },
  {
    key: 'command_parsed',
    icon: 'mdi-console-line',
    label: t('dashboard.kpi.command_parsed'),
    value: formatCount(props.commandParsed),
  },
  {
    key: 'message_parsed',
    icon: 'mdi-message-text-outline',
    label: t('dashboard.kpi.message_parsed'),
    value: formatCount(props.messageParsed),
  },
  {
    key: 'command_rate',
    icon: 'mdi-speedometer',
    label: t('dashboard.kpi.command_rate'),
    value: formatRate(props.commandRate),
  },
  {
    key: 'message_rate',
    icon: 'mdi-chart-timeline-variant',
    label: t('dashboard.kpi.message_rate'),
    value: formatRate(props.messageRate),
  },
  {
    key: 'jobqueue_backend',
    icon: 'mdi-lan-connect',
    label: t('dashboard.kpi.jobqueue_backend'),
    value: props.jobqueueBackend || EMPTY,
  },
  {
    key: 'web_render',
    icon: 'mdi-web',
    label: t('dashboard.server_info.bot.label.web_render_status'),
    value: props.webRenderReady ? t('true') : t('false'),
  },
  {
    key: 'process_memory',
    icon: 'mdi-memory',
    label: t('dashboard.kpi.process_memory'),
    value: props.processesAvailable ? formatBytes(props.processTotalMemory) : EMPTY,
  },
])
</script>

<style scoped>
.stat-tile-group {
  margin-bottom: 4px;
}

.offline-alert {
  margin-bottom: 12px;
}

.tile-row {
  row-gap: 20px;
}

.tile-card {
  line-height: 1;
}

.tile-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 76px;
}

.tile-icon {
  font-size: 30px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.tile-text {
  min-width: 0;
  flex: 1;
}

.tile-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  cursor: default;
}

.dark .tile-label {
  color: #ccc;
}

.tile-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

@media (max-width: 768px) {
  .tile-value {
    font-size: 18px;
  }
}
</style>
