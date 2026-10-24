<template>
  <div class="overview">
    <el-alert
      v-if="serverOffline"
      :title="$t('dashboard.overview.alert.server_offline')"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <el-row :gutter="20" class="metric-row">
      <el-col v-for="metric in metrics" :key="metric.key" :xs="24" :sm="12" :lg="6">
        <el-card class="metric-tile" shadow="never">
          <div class="metric-head">
            <span class="metric-icon"><i :class="['mdi', metric.icon]"></i></span>
            <span class="metric-label">{{ metric.label }}</span>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-caption">{{ metric.caption }}</div>
        </el-card>
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
    label: t('dashboard.overview.title.command_parsed'),
    value: formatCount(props.commandParsed),
    caption: t('dashboard.overview.since_start'),
  },
  {
    key: 'message_parsed',
    icon: 'mdi-message-text-outline',
    label: t('dashboard.overview.title.message_parsed'),
    value: formatCount(props.messageParsed),
    caption: t('dashboard.overview.since_start'),
  },
  {
    key: 'running_time',
    icon: 'mdi-clock-outline',
    label: t('dashboard.overview.title.uptime'),
    value: uptimeText.value,
  },
  {
    key: 'process_count',
    icon: 'mdi-server-outline',
    label: t('dashboard.overview.title.process_count'),
    value: formatCount(props.processCount),
  },
])
</script>

<style scoped>
.overview {
  line-height: 1;
  /* 指标区自身不是卡片，需额外留白与下方卡片拉开距离 */
  margin-bottom: 20px;
}

.offline-alert {
  margin-bottom: 16px;
}

.metric-row {
  row-gap: 20px;
}

.metric-tile {
  height: 100%;
}

.metric-tile :deep(.el-card__body) {
  padding: 14px 16px;
}

.metric-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

/* 图标贴纸：单数格粉色、双数格浅紫，交替出现 */
.metric-icon {
  --metric-accent: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background-color: color-mix(in srgb, var(--metric-accent) 22%, transparent);
  color: var(--ak-primary-text);
}

.metric-row > :nth-child(even) .metric-icon {
  --metric-accent: var(--ak-secondary);
}

.metric-icon i {
  font-size: 18px;
}

.metric-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: default;
}

.metric-value {
  font-family: var(--ak-font-display);
  font-size: 26px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.01em;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}

.metric-caption {
  margin-top: 6px;
  min-height: 1.2em;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: default;
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 22px;
  }
}
</style>
