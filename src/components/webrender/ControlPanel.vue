<template>
  <div class="control-actions">
    <el-button
      type="success"
      :loading="loading"
      :disabled="disabled"
      @click="confirmAction('start')"
    >
      <i class="mdi mdi-play"></i>
      {{ $t('webrender.control.start') }}
    </el-button>

    <el-button type="danger" :loading="loading" :disabled="disabled" @click="confirmAction('stop')">
      <i class="mdi mdi-stop"></i>
      {{ $t('webrender.control.stop') }}
    </el-button>

    <el-button
      type="warning"
      :loading="loading"
      :disabled="disabled"
      @click="confirmAction('restart')"
    >
      <i class="mdi mdi-restart"></i>
      {{ $t('webrender.control.restart') }}
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

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

const emit = defineEmits(['control'])
const { t } = useI18n()

const disabled = computed(() => props.loading || props.limited || props.serverOffline)

const confirmAction = async (action) => {
  if (disabled.value) return

  try {
    await ElMessageBox.confirm(t('webrender.control.confirm'), t('webrender.control.title'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }

  emit('control', action)
}
</script>

<style scoped>
.control-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
