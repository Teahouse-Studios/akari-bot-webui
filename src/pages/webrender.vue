<template>
  <div class="webrender-page">
    <el-tabs v-model="activeTab" class="webrender-tabs">
      <el-tab-pane :label="$t('webrender.status.title')" name="status">
        <div class="tab-content">
          <StatusCard
            :config="config"
            :status="status"
            :loading="loading"
            :server-offline="serverOffline"
          />
          <ContextsCard
            :contexts="status?.contexts || []"
            :contexts-total="status?.contexts_total || 0"
            :leaked="Boolean(status?.leaked)"
          />
          <ControlPanel
            :loading="controlLoading"
            :limited="controlLimited"
            :server-offline="serverOffline"
            :status="status"
            @control="control"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="$t('webrender.tester.title')" name="test">
        <div class="tab-content">
          <el-alert
            v-if="serverOffline"
            :title="$t('webrender.error.server_offline')"
            type="warning"
            show-icon
            :closable="false"
          />

          <RenderRequestForm
            ref="requestForm"
            :loading="testLoading"
            :limited="testLimited"
            :server-offline="serverOffline"
            @submit="handleSubmit"
          />

          <RenderResponsePanel
            :result="result"
            :loading="testLoading"
            :error-text="responseErrorText"
          />

          <TestHistoryList :history="history" @replay="replayHistory" @clear="clearHistory" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-tooltip
      v-if="activeTab === 'status'"
      :content="$t('dashboard.update_time.title', { time: formatDateTime(lastUpdateTime) })"
      placement="left"
    >
      <el-button
        class="refresh-button"
        circle
        size="large"
        type="primary"
        :disabled="loading"
        @click="fetchStatus()"
      >
        <i class="mdi mdi-refresh"></i>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ContextsCard from '@/components/webrender/ContextsCard.vue'
import ControlPanel from '@/components/webrender/ControlPanel.vue'
import RenderRequestForm from '@/components/webrender/RenderRequestForm.vue'
import RenderResponsePanel from '@/components/webrender/RenderResponsePanel.vue'
import StatusCard from '@/components/webrender/StatusCard.vue'
import TestHistoryList from '@/components/webrender/TestHistoryList.vue'
import { useWebRender } from '@/composables/useWebRender.js'
import { formatDateTime } from '@/utils/systemFormat.js'

const {
  config,
  status,
  loading,
  controlLoading,
  testLoading,
  serverOffline,
  result,
  history,
  controlLimited,
  testLimited,
  lastUpdateTime,
  localizeError,
  fetchStatus,
  control,
  runTest,
  clearHistory,
} = useWebRender()

const activeTab = ref('status')
const requestForm = ref(null)

const responseErrorText = computed(() =>
  result.value?.error ? localizeError(result.value.error) : '',
)

const handleSubmit = async (form) => {
  await runTest(form)
}

const replayHistory = (entry) => {
  requestForm.value?.fill(entry.payload)
}
</script>

<style scoped>
.webrender-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.webrender-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.webrender-tabs :deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
  font-weight: 500;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important;
}
</style>
