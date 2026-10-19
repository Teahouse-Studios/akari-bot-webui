<template>
  <el-card class="webrender-card" shadow="never" v-loading="loading">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-information-outline"></i>
        {{ $t('webrender.status.title') }}
      </h3>
      <el-tag :type="status?.available ? 'success' : 'danger'" size="small">
        {{
          status?.available ? $t('webrender.status.available') : $t('webrender.status.unavailable')
        }}
      </el-tag>
    </div>

    <el-alert
      v-if="serverOffline"
      :title="$t('webrender.error.server_offline')"
      type="warning"
      show-icon
      :closable="false"
      class="status-alert"
    />
    <el-alert
      v-else-if="!status"
      :title="$t('webrender.status.unavailable_hint')"
      type="info"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <template v-if="status">
      <div class="summary-grid">
        <div v-for="field in summaryFields" :key="field.key" class="summary-item">
          <span class="summary-label">{{ $t(field.label) }}</span>
          <strong class="summary-value">{{ formatValue(status[field.key]) }}</strong>
        </div>
        <div v-for="field in summaryConfigFields" :key="field.key" class="summary-item muted">
          <span class="summary-label">{{ $t(field.label) }}</span>
          <strong class="summary-value">{{ formatValue(config[field.key]) }}</strong>
        </div>
      </div>
    </template>

    <el-empty v-else :description="$t('webrender.status.unavailable')" :image-size="60" />
  </el-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  // null 表示服务端返回了 null（渲染状态不可读）
  status: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serverOffline: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const configFields = [
  { key: 'enable', label: 'webrender.status.field.enable' },
  { key: 'browser_type', label: 'webrender.status.field.browser_type' },
  { key: 'browser_executable_path', label: 'webrender.status.field.browser_executable_path' },
  { key: 'headless', label: 'webrender.status.field.headless' },
  { key: 'remote_only', label: 'webrender.status.field.remote_only' },
  { key: 'remote_url', label: 'webrender.status.field.remote_url' },
]

const summaryFields = [
  { key: 'browser_initialized', label: 'webrender.status.browser_initialized' },
  { key: 'browser_mode', label: 'webrender.status.field.browser_mode' },
  { key: 'remote_configured', label: 'webrender.status.field.remote_configured' },
  { key: 'remote_timeout', label: 'webrender.status.field.remote_timeout' },
]

const summaryConfigFields = [
  { key: 'browser_type', label: 'webrender.status.field.browser_type' },
  { key: 'headless', label: 'webrender.status.field.headless' },
  { key: 'remote_only', label: 'webrender.status.field.remote_only' },
  { key: 'enable', label: 'webrender.status.field.enable' },
]

const statusFields = [
  { key: 'browser_initialized', label: 'webrender.status.browser_initialized' },
  { key: 'browser_mode', label: 'webrender.status.field.browser_mode' },
  { key: 'headless', label: 'webrender.status.field.headless' },
  { key: 'keep_pages_open', label: 'webrender.status.field.keep_pages_open' },
  { key: 'debug_mode', label: 'webrender.status.field.debug_mode' },
  { key: 'remote_only', label: 'webrender.status.field.remote_only' },
  { key: 'remote_configured', label: 'webrender.status.field.remote_configured' },
  { key: 'remote_timeout', label: 'webrender.status.field.remote_timeout' },
  { key: 'export_logs', label: 'webrender.status.field.export_logs' },
  { key: 'logs_path', label: 'webrender.status.field.logs_path' },
  { key: 'name', label: 'webrender.status.field.name' },
]

const formatValue = (value) => {
  if (typeof value === 'boolean') return value ? t('true') : t('false')
  if (value === undefined || value === null || value === '') return '-'
  return value
}
</script>

<style scoped>
.webrender-card {
  line-height: 1.4;
}

h3 {
  cursor: default;
}

h4 {
  margin: 16px 0 8px;
  cursor: default;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.status-alert {
  margin-top: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.summary-item.muted {
  background: var(--el-fill-color-lighter);
}

.summary-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.details-collapse {
  margin-top: 12px;
}

.collapse-title {
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
