<template>
  <el-card class="resource-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-gauge"></i>
        {{ $t('dashboard.resource.title') }}
      </h3>
      <span v-if="items.length" class="card-hint">
        {{ $t('dashboard.kpi.process_memory') }} · {{ formatBytes(totalMemory) }}
      </span>
    </div>

    <el-alert
      v-if="!available"
      :title="$t('dashboard.process.unavailable')"
      type="warning"
      show-icon
      :closable="false"
      class="process-alert"
    />
    <el-alert
      v-else-if="failureNames"
      :title="$t('dashboard.process.failure', { names: failureNames })"
      type="warning"
      show-icon
      :closable="false"
      class="process-alert"
    />

    <div class="process-area">
      <el-scrollbar v-if="items.length" class="process-scroll">
        <div class="process-list">
          <div
            v-for="(item, index) in rankedItems"
            :key="`${item.name}-${index}`"
            class="process-row"
          >
            <div class="process-head">
              <span class="process-name">{{ item.name }}</span>
              <el-tag size="small" type="info" effect="plain">{{ item.metric || '-' }}</el-tag>
              <span class="process-memory">{{ formatBytes(item.memory) }}</span>
            </div>
            <el-tooltip :content="describe(item)" placement="top">
              <el-progress
                :percentage="item.percent"
                :color="getUsageColor(item.percent)"
                :stroke-width="8"
                :show-text="false"
              />
            </el-tooltip>
          </div>
        </div>
      </el-scrollbar>

      <el-empty v-else :description="$t('dashboard.process.empty')" :image-size="60" />
    </div>

    <div class="gauge-row">
      <el-tooltip v-for="gauge in gaugeItems" :key="gauge.key" :content="gauge.tip" placement="top">
        <el-progress
          type="dashboard"
          :width="96"
          :percentage="gauge.percent"
          :color="getUsageColor(gauge.percent)"
        >
          <template #default="{ percentage }">
            <span class="gauge-value">{{ percentage }}%</span>
            <span class="gauge-label">{{ gauge.label }}</span>
          </template>
        </el-progress>
      </el-tooltip>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatBytes, getUsageColor } from '@/utils/systemFormat.js'

const props = defineProps({
  cpuPercent: {
    type: Number,
    default: 0,
  },
  memory: {
    type: Object,
    default: () => ({ total: 0, used: 0, percent: 0 }),
  },
  disk: {
    type: Object,
    default: () => ({ total: 0, used: 0, percent: 0 }),
  },
  items: {
    type: Array,
    default: () => [],
  },
  // 采集失败的进程（{ name, reason }）
  failures: {
    type: Array,
    default: () => [],
  },
  // 整批采集失败的原因，服务端离线时为 'unavailable'
  error: {
    type: String,
    default: null,
  },
})

const { t } = useI18n()

const available = computed(() => props.error !== 'unavailable')

const failureNames = computed(() =>
  props.failures
    .map((failure) => failure?.name)
    .filter(Boolean)
    .join(', '),
)

/** 占用最高的进程在最前，用相对最大值的比例绘图 */
const rankedItems = computed(() => {
  const sorted = [...props.items].sort((a, b) => (Number(b.memory) || 0) - (Number(a.memory) || 0))
  const max = Number(sorted[0]?.memory) || 0

  return sorted.map((item) => {
    const memory = Number(item.memory) || 0
    return {
      ...item,
      percent: max > 0 ? Math.max(6, Math.round((memory / max) * 100)) : 0,
    }
  })
})

const totalMemory = computed(() =>
  props.items.reduce((sum, item) => sum + (Number(item.memory) || 0), 0),
)

const describe = (item) =>
  `${t('dashboard.process.table.pid')}: ${item.pid ?? '-'} · ${t('dashboard.process.table.threads')}: ${
    item.threads ?? '-'
  }`

/** el-progress 只接受 0–100 的数值 */
const toPercentage = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, Number(number.toFixed(1))))
}

/** 用量改由悬浮提示呈现，避免与环形仪表重复 */
const usedOfTotal = (used, total, unit) => {
  const digits = unit === 'GB' ? 1 : 0
  return t('dashboard.resource.used_of_total', {
    used: `${Number(used || 0).toFixed(digits)} ${unit}`,
    total: `${Number(total || 0).toFixed(digits)} ${unit}`,
  })
}

const gaugeItems = computed(() => {
  const cpu = toPercentage(props.cpuPercent)
  const memory = toPercentage(props.memory.percent)
  const disk = toPercentage(props.disk.percent)

  return [
    {
      key: 'cpu',
      label: t('dashboard.resource.cpu'),
      percent: cpu,
      tip: `${t('dashboard.resource.cpu')} · ${cpu}%`,
    },
    {
      key: 'memory',
      label: t('dashboard.resource.memory'),
      percent: memory,
      tip: usedOfTotal(props.memory.used, props.memory.total, 'MB'),
    },
    {
      key: 'disk',
      label: t('dashboard.resource.disk'),
      percent: disk,
      tip: usedOfTotal(props.disk.used, props.disk.total, 'GB'),
    },
  ]
})
</script>

<style scoped>
.resource-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.resource-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

h3 {
  cursor: default;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.card-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  cursor: default;
}

.process-alert {
  margin-bottom: 12px;
}

.process-area {
  flex: 1;
  min-height: 0;
  max-height: 260px;
  overflow: hidden;
}

.process-scroll {
  height: 100%;
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 8px 4px 0;
}

.process-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.process-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  cursor: default;
  word-break: break-all;
}

.process-memory {
  margin-left: auto;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}

.gauge-row {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  justify-content: space-around;
  row-gap: 8px;
  padding-top: 16px;
  margin-top: auto;
}

.gauge-value {
  display: block;
  margin-top: 10px;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.gauge-label {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: default;
}

@media (max-width: 1199px) {
  .resource-card {
    height: auto;
  }

  .process-area {
    max-height: 320px;
  }
}
</style>
