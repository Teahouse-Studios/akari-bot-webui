<template>
  <div class="webrender-page">
    <el-row :gutter="20" class="webrender-row">
      <el-col :xs="24" :xl="8">
        <div class="column-stack">
          <StatusCard
            :config="config"
            :status="status"
            :loading="loading"
            :server-offline="serverOffline"
          />
          <ControlPanel
            :loading="controlLoading"
            :limited="controlLimited"
            :server-offline="serverOffline"
            @control="control"
          />
          <ContextsCard
            :contexts="status?.contexts || []"
            :contexts-total="status?.contexts_total || 0"
            :leaked="Boolean(status?.leaked)"
          />
        </div>
      </el-col>

      <el-col :xs="24" :xl="10">
        <RenderRequestForm
          ref="requestForm"
          :loading="testLoading"
          :limited="testLimited"
          :server-offline="serverOffline"
          @submit="runTest"
        />
      </el-col>

      <el-col :xs="24" :xl="6">
        <div class="column-stack">
          <RenderResponsePanel
            :result="result"
            :loading="testLoading"
            :error-text="responseErrorText"
          />
          <TestHistoryList :history="history" @replay="replayHistory" @clear="clearHistory" />
        </div>
      </el-col>
    </el-row>

    <el-tooltip
      :content="$t('dashboard.update_time.title', { time: formatTime(lastUpdateTime) })"
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
import LocalStorageJson from '@/localStorageJson.js'

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

const requestForm = ref(null)

const responseErrorText = computed(() =>
  result.value?.error ? localizeError(result.value.error) : '',
)

const replayHistory = (entry) => {
  requestForm.value?.fill(entry.payload)
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000)
  const language = (LocalStorageJson.getItem('language') || 'zh_cn').toLowerCase()

  const langMap = {
    zh_cn: 'zh-CN',
    zh_tw: 'zh-TW',
    en_us: 'en-US',
    ja_jp: 'ja-JP',
    ko_kr: 'ko-KR',
  }

  return new Intl.DateTimeFormat(langMap[language] || 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}
</script>

<style scoped>
.webrender-row {
  row-gap: 20px;
}

.column-stack {
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
