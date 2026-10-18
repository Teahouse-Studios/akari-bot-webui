<template>
  <div v-if="controlsVisible" class="control-actions">
    <el-button
      v-if="!running"
      type="success"
      :loading="loading"
      :disabled="disabled"
      @click="confirmAction('start')"
    >
      <i v-if="!loading" class="mdi mdi-play"></i>
      {{ $t('webrender.control.start') }}
    </el-button>

    <template v-else>
      <el-button
        type="danger"
        :loading="loading"
        :disabled="disabled"
        @click="confirmAction('stop')"
      >
        <i v-if="!loading" class="mdi mdi-stop"></i>
        {{ $t('webrender.control.stop') }}
      </el-button>

      <el-button
        type="warning"
        :loading="loading"
        :disabled="disabled"
        @click="confirmAction('restart')"
      >
        <i v-if="!loading" class="mdi mdi-restart"></i>
        {{ $t('webrender.control.restart') }}
      </el-button>
    </template>
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
  // null 表示状态不可读（服务端可能离线），此时不显示任何控制按钮
  status: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['control'])
const { t } = useI18n()

const running = computed(() => props.status?.available === true)

/** 只有取得明确的运行状态时才显示控制按钮 */
const controlsVisible = computed(
  () => !props.serverOffline && typeof props.status?.available === 'boolean',
)

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
