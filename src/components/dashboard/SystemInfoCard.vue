<template>
  <el-card class="info-card" shadow="never">
    <h3 class="dashboard-card-title">
      <i class="mdi mdi-laptop"></i>
      {{ $t('dashboard.server_info.system.title') }}
    </h3>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.cpu.label.brand') }}</strong
      ><span class="data-text">{{ cpu.cpu_brand || '-' }}</span>
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.system.label.machine') }}</strong
      ><span class="data-text">{{ machineText }}</span>
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.system.label.version') }}</strong
      ><span class="data-text">{{ os.version || '-' }}</span>
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.system.label.boot_time') }}</strong
      ><span class="data-text">{{ bootTimeText }}</span>
    </p>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '@/utils/systemFormat.js'

const props = defineProps({
  os: {
    type: Object,
    default: () => ({}),
  },
  cpu: {
    type: Object,
    default: () => ({}),
  },
})

const machineText = computed(() => {
  const parts = [props.os.system, props.os.machine].filter(Boolean)
  return parts.length ? parts.join(' - ') : '-'
})

const bootTimeText = computed(() => (props.os.boot_time ? formatDateTime(props.os.boot_time) : '-'))
</script>

<style scoped>
.info-card {
  --info-label-width: 9em;
  line-height: 1;
}

.info-card .dashboard-card-title {
  margin-bottom: 6px;
}

.info-card p {
  /* 固定标签列宽：长短不一的标签不会把数值推得忽左忽右 */
  display: grid;
  grid-template-columns: var(--info-label-width) minmax(0, 1fr);
  align-items: baseline;
  gap: 16px;
  margin: 0;
  padding: 11px 0;
  line-height: 1.5;
  font-size: 14px;
  /* 行与行之间的虚线，像本子上的横格 */
  border-bottom: 1px dashed var(--el-border-color);
}

.info-card p:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.data-title {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  /* 较长标签在列内换行，不再撑出卡片或挤歪数值 */
  overflow-wrap: anywhere;
  cursor: default;
}

.data-text {
  min-width: 0;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}
</style>
