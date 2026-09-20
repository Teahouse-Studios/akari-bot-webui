<template>
  <div class="log-viewer-container">
    <LogToolbar
      v-model:search-text="searchText"
      v-model:auto-scroll="autoScroll"
      :active-levels="activeLogLevels"
      :levels="logLevels"
      @search="handleSearch"
      @refresh="refreshLog"
      @toggle-level="toggleLogLevel"
    />

    <LogViewer ref="logViewer" :lines="visibleLogs" />
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import LogToolbar from '@/components/logs/LogToolbar.vue'
import LogViewer from '@/components/logs/LogViewer.vue'
import { useLogStream } from '@/composables/useLogStream.js'

const {
  visibleLogs,
  logLevels,
  activeLogLevels,
  searchText,
  autoScroll,
  refreshLog,
  toggleLogLevel,
  handleSearch,
} = useLogStream()

const logViewer = ref(null)

// 日志更新后按需滚动到底部（等渲染完成后再计算高度）
watch(
  () => visibleLogs.value.length,
  async () => {
    if (!autoScroll.value) return
    await nextTick()
    setTimeout(() => {
      logViewer.value?.scrollToBottom()
    }, 200)
  },
)

// 清空或刷新后回到顶部，避免停留在大段空白处
watch(
  () => visibleLogs.value,
  () => {
    if (visibleLogs.value.length === 0) logViewer.value?.scrollToTop()
  },
)
</script>

<style scoped>
.log-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
