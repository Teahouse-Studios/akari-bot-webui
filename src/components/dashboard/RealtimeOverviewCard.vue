<template>
  <el-card class="overview-card" shadow="never" v-loading="loading">
    <el-alert
      v-if="serverOffline"
      :title="$t('dashboard.kpi.server_offline')"
      type="warning"
      show-icon
      :closable="false"
      class="offline-alert"
    />

    <div class="hero">
      <span class="hero-title">
        <i class="mdi mdi-robot-outline"></i>
        {{ $t('dashboard.overview.title') }}
      </span>

      <div class="hero-uptime">
        <span class="hero-label">{{ $t('dashboard.overview.uptime') }}</span>
        <span class="hero-value">{{ uptimeText }}</span>
      </div>
    </div>

    <el-row :gutter="16" class="metric-row">
      <el-col v-for="metric in metrics" :key="metric.key" :xs="24" :sm="12" :lg="6">
        <div class="metric-tile">
          <div class="metric-head">
            <i :class="['mdi', metric.icon]"></i>
            <span class="metric-label">{{ metric.label }}</span>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
          <div v-if="metric.caption" class="metric-caption">{{ metric.caption }}</div>
          <ThroughputSparkline
            v-if="metric.sparkline"
            :values="metric.sparkline"
            :height="36"
            class="metric-sparkline"
          />
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ThroughputSparkline from '@/components/dashboard/ThroughputSparkline.vue'
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
  // 由两次采样差值算出的速率（次/分），不足两次采样时为 null
  commandRate: {
    type: Number,
    default: null,
  },
  messageRate: {
    type: Number,
    default: null,
  },
  // 速率采样序列，用于迷你折线
  commandRateHistory: {
    type: Array,
    default: () => [],
  },
  messageRateHistory: {
    type: Array,
    default: () => [],
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

const formatCount = (value) =>
  typeof value === 'number' ? value.toLocaleString(getLocaleTag()) : EMPTY

const formatRate = (value) =>
  typeof value === 'number' ? t('dashboard.kpi.rate_value', { value }) : EMPTY

const uptimeText = computed(() => formatUptime(props.runningSeconds, t))

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
    key: 'command_rate',
    icon: 'mdi-speedometer',
    label: t('dashboard.kpi.command_rate'),
    value: formatRate(props.commandRate),
    sparkline: props.commandRateHistory,
  },
  {
    key: 'message_rate',
    icon: 'mdi-chart-timeline-variant',
    label: t('dashboard.kpi.message_rate'),
    value: formatRate(props.messageRate),
    sparkline: props.messageRateHistory,
  },
])
</script>

<style scoped>
.overview-card {
  line-height: 1;
}

.offline-alert {
  margin-bottom: 16px;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px 24px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dark .hero {
  border-bottom-color: var(--el-border-color-darker);
}

.hero-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  cursor: default;
}

.dark .hero-title {
  color: #fff;
}

.hero-title i {
  font-size: 18px;
  color: var(--el-color-primary);
}

.hero-uptime {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.hero-label {
  font-size: 13px;
  color: #888;
  cursor: default;
}

.dark .hero-label {
  color: #aaa;
}

.hero-value {
  font-size: 26px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
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
  color: #666;
  cursor: default;
}

.dark .metric-label {
  color: #ccc;
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
  color: #999;
  cursor: default;
}

.dark .metric-caption {
  color: #888;
}

.metric-sparkline {
  margin-top: auto;
  padding-top: 10px;
}

@media (max-width: 768px) {
  .hero-value {
    font-size: 22px;
  }

  .metric-value {
    font-size: 20px;
  }
}
</style>
