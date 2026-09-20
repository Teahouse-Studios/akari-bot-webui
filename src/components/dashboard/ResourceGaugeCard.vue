<template>
  <el-card class="resource-card" shadow="never" v-loading="loading">
    <h3>
      <i class="mdi mdi-gauge"></i>
      {{ $t('dashboard.resource.title') }}
    </h3>

    <div class="memory-dashboards">
      <el-progress
        type="dashboard"
        :percentage="cpuPercentage"
        :color="getProgressColor(cpuPercentage)"
      >
        <template #default="{ percentage }">
          <span class="percentage-value">{{ percentage }}%</span>
          <span class="percentage-label">{{ $t('dashboard.resource.cpu') }}</span>
        </template>
      </el-progress>

      <el-progress
        type="dashboard"
        :percentage="memoryPercentage"
        :color="getProgressColor(memoryPercentage)"
      >
        <template #default="{ percentage }">
          <span class="percentage-value">{{ percentage }}%</span>
          <span class="percentage-label">{{ $t('dashboard.resource.memory') }}</span>
        </template>
      </el-progress>

      <el-progress
        type="dashboard"
        :percentage="diskPercentage"
        :color="getProgressColor(diskPercentage)"
      >
        <template #default="{ percentage }">
          <span class="percentage-value">{{ percentage }}%</span>
          <span class="percentage-label">{{ $t('dashboard.resource.disk') }}</span>
        </template>
      </el-progress>
    </div>

    <div class="usage-list">
      <div class="usage-item">
        <span class="usage-title">{{ $t('dashboard.resource.memory') }}</span>
        <span class="usage-value">
          {{
            $t('dashboard.resource.used_of_total', {
              used: `${memory.used ? memory.used.toFixed() : 0} MB`,
              total: `${memory.total ? memory.total.toFixed() : 0} MB`,
            })
          }}
        </span>
      </div>
      <div class="usage-item">
        <span class="usage-title">{{ $t('dashboard.resource.disk') }}</span>
        <span class="usage-value">
          {{
            $t('dashboard.resource.used_of_total', {
              used: `${disk.used ? disk.used.toFixed(1) : 0} GB`,
              total: `${disk.total ? disk.total.toFixed(1) : 0} GB`,
            })
          }}
        </span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

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

const progressColors = ['#1989fa', '#e6a23c', '#f56c6c']

const toPercentage = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, Number(number.toFixed(1))))
}

const cpuPercentage = computed(() => toPercentage(props.cpuPercent))
const memoryPercentage = computed(() => toPercentage(props.memory.percent))
const diskPercentage = computed(() => toPercentage(props.disk.percent))

function getProgressColor(percentage) {
  if (percentage >= 90) return progressColors[2]
  if (percentage >= 60) return progressColors[1]
  return progressColors[0]
}
</script>

<style scoped>
.resource-card {
  height: 100%;
  line-height: 1;
}

h3 {
  cursor: default;
}

.memory-dashboards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  overflow-x: auto;
}

.el-progress--dashboard {
  margin: 5px;
}

.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 20px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 14px;
}

.usage-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.usage-title {
  color: #333;
  cursor: default;
}

.dark .usage-title {
  color: white;
}

.usage-value {
  color: #666;
}

.dark .usage-value {
  color: #ccc;
}
</style>
