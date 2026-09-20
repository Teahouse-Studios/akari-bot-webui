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

    <h4>{{ $t('webrender.status.config.title') }}</h4>
    <el-descriptions :column="1" border size="small">
      <el-descriptions-item v-for="field in configFields" :key="field.key" :label="$t(field.label)">
        {{ formatValue(config[field.key]) }}
      </el-descriptions-item>
    </el-descriptions>

    <h4>{{ $t('webrender.status.title') }}</h4>
    <el-descriptions v-if="status" :column="1" border size="small">
      <el-descriptions-item v-for="field in statusFields" :key="field.key" :label="$t(field.label)">
        {{ formatValue(status[field.key]) }}
      </el-descriptions-item>
    </el-descriptions>
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
</style>
