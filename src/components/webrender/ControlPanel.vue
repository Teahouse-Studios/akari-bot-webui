<template>
  <el-card class="webrender-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-power-cycle"></i>
        {{ $t('webrender.control.title') }}
      </h3>
    </div>

    <div class="control-buttons">
      <el-popconfirm
        :title="$t('webrender.control.confirm')"
        :confirm-button-text="$t('button.confirm')"
        :cancel-button-text="$t('button.cancel')"
        width="260"
        @confirm="$emit('control', 'start')"
      >
        <template #reference>
          <el-button type="success" :loading="loading" :disabled="disabled">
            <i class="mdi mdi-play"></i>
            {{ $t('webrender.control.start') }}
          </el-button>
        </template>
      </el-popconfirm>

      <el-popconfirm
        :title="$t('webrender.control.confirm')"
        :confirm-button-text="$t('button.confirm')"
        :cancel-button-text="$t('button.cancel')"
        width="260"
        @confirm="$emit('control', 'stop')"
      >
        <template #reference>
          <el-button type="danger" :loading="loading" :disabled="disabled">
            <i class="mdi mdi-stop"></i>
            {{ $t('webrender.control.stop') }}
          </el-button>
        </template>
      </el-popconfirm>

      <el-popconfirm
        :title="$t('webrender.control.confirm')"
        :confirm-button-text="$t('button.confirm')"
        :cancel-button-text="$t('button.cancel')"
        width="260"
        @confirm="$emit('control', 'restart')"
      >
        <template #reference>
          <el-button type="warning" :loading="loading" :disabled="disabled">
            <i class="mdi mdi-restart"></i>
            {{ $t('webrender.control.restart') }}
          </el-button>
        </template>
      </el-popconfirm>
    </div>

    <div class="control-hint">
      <i class="mdi mdi-alert-outline"></i>
      {{ $t('webrender.control.rate_limit_hint') }}
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  limited: {
    type: Boolean,
    default: false,
  },
  serverOffline: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['control'])

const disabled = computed(() => props.loading || props.limited || props.serverOffline)
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

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.control-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #888;
}

.dark .control-hint {
  color: #aaa;
}
</style>
