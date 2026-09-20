<template>
  <el-card class="resource-card" shadow="never" v-loading="loading">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-gauge"></i>
        {{ $t('dashboard.resource.title') }}
      </h3>
    </div>

    <div class="gauge-row">
      <el-tooltip v-for="gauge in gaugeItems" :key="gauge.key" :content="gauge.tip" placement="top">
        <el-progress
          type="dashboard"
          :width="110"
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
import { getUsageColor } from '@/utils/systemFormat.js'

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
  loading: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

/** el-progress 只接受 0–100 的数值 */
const toPercentage = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, Number(number.toFixed(1))))
}

/** 下方的三个横向进度条已移除，用量改由悬浮提示呈现，避免与环形仪表重复 */
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
  line-height: 1;
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

.gauge-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  row-gap: 8px;
  padding-top: 16px;
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
  color: #888;
  cursor: default;
}

.dark .gauge-label {
  color: #aaa;
}
</style>
