<template>
  <el-card class="process-card" shadow="never" v-loading="loading">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-server-outline"></i>
        {{ $t('dashboard.process.title') }}
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

    <el-scrollbar v-if="items.length" height="272px">
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
            <div class="process-bar">
              <div
                class="process-bar-fill"
                :style="{ width: `${item.percent}%`, backgroundColor: getUsageColor(item.percent) }"
              ></div>
            </div>
          </el-tooltip>
        </div>
      </div>
    </el-scrollbar>

    <el-empty v-else :description="$t('dashboard.process.empty')" :image-size="60" />
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatBytes, getUsageColor } from '@/utils/systemFormat.js'

const props = defineProps({
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
  loading: {
    type: Boolean,
    default: false,
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
</script>

<style scoped>
.process-card {
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

.card-hint {
  font-size: 13px;
  color: #888;
  font-variant-numeric: tabular-nums;
  cursor: default;
}

.dark .card-hint {
  color: #aaa;
}

.process-alert {
  margin-bottom: 12px;
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
  color: #333;
  cursor: default;
  word-break: break-all;
}

.dark .process-name {
  color: #eee;
}

.process-memory {
  margin-left: auto;
  color: #666;
  font-variant-numeric: tabular-nums;
}

.dark .process-memory {
  color: #ccc;
}

.process-bar {
  height: 8px;
  border-radius: 999px;
  background-color: var(--el-fill-color-light);
  overflow: hidden;
}

.process-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
</style>
