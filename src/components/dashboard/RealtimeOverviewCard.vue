<template>
  <div class="overview">
    <el-alert
      v-if="serverOffline"
      :title="$t('dashboard.kpi.server_offline')"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <el-row :gutter="16" class="metric-row">
      <el-col v-for="metric in metrics" :key="metric.key" :xs="24" :sm="12" :lg="6">
        <div class="metric-tile">
          <div class="metric-head">
            <i :class="['mdi', metric.icon]"></i>
            <span class="metric-label">{{ metric.label }}</span>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
          <div v-if="metric.caption" class="metric-caption">{{ metric.caption }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatUptime, getLocaleTag } from '@/utils/systemFormat.js'

const props = defineProps({
  // 运行时长（秒），由父级每秒刷新
  runningSeconds: {
    type: Number,
    default: 0,
  },
  // 自启动以来的累计值，服务端离线时为 null
  commandParsed: {
    type: Number,
    default: null,
  },
  messageParsed: {
    type: Number,
    default: null,
  },
  // 已采集到指标的进程数量，服务端离线时为 null
  processCount: {
    type: Number,
    default: null,
  },
  serverOffline: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const EMPTY = '—'

const formatCount = (value) =>
  typeof value === 'number' ? value.toLocaleString(getLocaleTag()) : EMPTY

const uptimeText = computed(() =>
  props.serverOffline ? EMPTY : formatUptime(props.runningSeconds, t),
)

const metrics = computed(() => [
  {
    key: 'command_parsed',
    icon: 'mdi-console-line',
    label: t('dashboard.kpi.command_parsed'),
    value: formatCount(props.commandParsed),
    caption: t('dashboard.overview.since_start'),
  },
  {
    key: 'message_parsed',
    icon: 'mdi-message-text-outline',
    label: t('dashboard.kpi.message_parsed'),
    value: formatCount(props.messageParsed),
    caption: t('dashboard.overview.since_start'),
  },
  {
    key: 'running_time',
    icon: 'mdi-clock-outline',
    label: t('dashboard.overview.uptime'),
    value: uptimeText.value,
  },
  {
    key: 'process_count',
    icon: 'mdi-server-outline',
    label: t('dashboard.kpi.process_count'),
    value: formatCount(props.processCount),
  },
])
</script>

<style scoped>
.overview {
  line-height: 1;
}

.offline-alert {
  margin-bottom: 16px;
}

.hero {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.hero-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: default;
}

.hero-title i {
  font-size: 18px;
  color: var(--el-color-primary);
}

.metric-row {
  row-gap: 16px;
}

.metric-tile {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.metric-tile:hover {
  background-color: var(--el-fill-color-light);
  transform: translateY(-2px);
}

.metric-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.metric-head i {
  font-size: 18px;
  color: var(--el-color-primary);
}

.metric-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: default;
}

.metric-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}

.metric-caption {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  cursor: default;
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 20px;
  }
}
</style>
