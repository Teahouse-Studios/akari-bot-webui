<template>
  <el-card class="info-card" shadow="never">
    <h3>
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
  line-height: 1;
}

h3 {
  cursor: default;
}

.data-text {
  color: #666;
  word-break: break-all;
}

.dark .data-text {
  color: #ccc;
}

.data-title {
  margin-right: 3ex;
  color: #333;
  cursor: default;
}

.dark .data-title {
  color: white;
}
</style>
