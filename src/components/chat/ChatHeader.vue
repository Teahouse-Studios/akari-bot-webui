<template>
  <div class="chat-header">
    <div
      :style="{ backgroundColor: indicatorColor }"
      class="connection-indicator"
      :title="indicatorTitle"
    ></div>
    <div class="chat-title"># {{ $t('chat.title') }}</div>
    <el-tooltip :content="$t('chat.button.reset')" placement="right-end">
      <el-button class="reset-button" circle @click="$emit('reset')">
        <i class="mdi mdi-restart"></i>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  connectionStatus: {
    type: String,
    default: 'connecting',
  },
})

defineEmits(['reset'])

const { t } = useI18n()

const indicatorColor = computed(() => {
  if (props.connectionStatus === 'connected') return 'limegreen'
  if (props.connectionStatus === 'connecting') return 'orange'
  return 'red'
})

const indicatorTitle = computed(() => {
  if (props.connectionStatus === 'connected') return t('chat.status.tooltip.connected')
  if (props.connectionStatus === 'connecting') return t('chat.status.tooltip.connecting')
  return t('chat.status.tooltip.disconnected')
})
</script>

<style scoped>
.chat-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  background: #f3f3f3;
  border-bottom: 1px solid #e0e0e0;
}

.dark .chat-header {
  background: #333;
  border-bottom: 1px solid #1f1f1f;
}

.connection-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
}

.connection-indicator:hover::after {
  content: attr(title);
  display: block;
  position: absolute;
  top: 20px;
  left: 0;
  background-color: #000;
  color: #fff;
  padding: 5px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.chat-title {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
  cursor: default;
}

.reset-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 22px;
  color: inherit;
}

.reset-button:hover {
  background-color: transparent;
  color: #888;
}

.dark .reset-button:hover {
  color: #aaa;
}
</style>
