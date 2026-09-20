<template>
  <el-card class="webrender-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-history"></i>
        {{ $t('webrender.tester.history.title') }}
      </h3>
      <el-button v-if="history.length" size="small" text @click="$emit('clear')">
        {{ $t('webrender.tester.history.clear') }}
      </el-button>
    </div>

    <div v-if="history.length" class="history-list">
      <div v-for="(entry, index) in history" :key="`${entry.time}-${index}`" class="history-item">
        <div class="history-main">
          <span class="history-mode">{{ $t(`webrender.tester.mode.${entry.mode}`) }}</span>
          <span class="history-path">{{ describe(entry.payload) }}</span>
        </div>
        <div class="history-actions">
          <el-tag size="small" :type="entry.ok ? 'success' : 'danger'">
            {{ entry.ok ? $t('webrender.response.ok') : $t('webrender.response.failed') }}
          </el-tag>
          <el-button size="small" text @click="$emit('replay', entry)">
            {{ $t('webrender.tester.history.replay') }}
          </el-button>
        </div>
      </div>
    </div>

    <el-empty v-else :description="$t('webrender.tester.history.empty')" :image-size="60" />
  </el-card>
</template>

<script setup>
defineProps({
  // [{ payload, mode, time, ok }]
  history: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['replay', 'clear'])

const describe = (payload) => {
  if (!payload) return ''
  return payload.url || (payload.content ? `${payload.content.slice(0, 40)}…` : '-')
}
</script>

<style scoped>
.webrender-card {
  line-height: 1.4;
}

h3 {
  cursor: default;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 6px 10px;
}

.history-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.history-mode {
  font-size: 13px;
  font-weight: 600;
}

.history-path {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .history-path {
  color: #bbb;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
</style>
