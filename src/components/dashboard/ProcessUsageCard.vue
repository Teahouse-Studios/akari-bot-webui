<template>
  <el-card class="process-card" shadow="never" v-loading="loading">
    <h3>
      <i class="mdi mdi-server-outline"></i>
      {{ $t('dashboard.process.title') }}
    </h3>

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

    <el-table v-if="items.length" :data="items" stripe style="width: 100%">
      <el-table-column :label="$t('dashboard.process.table.name')" prop="name" min-width="140" />
      <el-table-column :label="$t('dashboard.process.table.pid')" min-width="90">
        <template #default="{ row }">{{ row.pid ?? '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('dashboard.process.table.memory')" min-width="120">
        <template #default="{ row }">{{ formatBytes(row.memory) }}</template>
      </el-table-column>
      <el-table-column :label="$t('dashboard.process.table.metric')" min-width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.metric || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dashboard.process.table.threads')" min-width="100">
        <template #default="{ row }">{{ row.threads ?? '-' }}</template>
      </el-table-column>
    </el-table>

    <el-empty v-else :description="$t('dashboard.process.empty')" :image-size="60" />
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { formatBytes } from '@/utils/systemFormat.js'

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

const available = computed(() => props.error !== 'unavailable')

const failureNames = computed(() =>
  props.failures
    .map((failure) => failure?.name)
    .filter(Boolean)
    .join(', '),
)
</script>

<style scoped>
h3 {
  cursor: default;
}

.process-alert {
  margin-bottom: 12px;
}
</style>
