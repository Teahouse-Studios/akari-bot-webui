<template>
  <el-card class="info-card" shadow="never">
    <h3>
      <i class="mdi mdi-robot-outline"></i>
      {{ $t('dashboard.server_info.bot.title') }}
    </h3>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.bot.label.bot_version') }}</strong
      ><span class="data-text">{{ formatBotVersion(bot.version) }}</span>
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.bot.label.python_version') }}</strong
      ><span class="data-text">{{ bot.python_version || '-' }}</span>
    </p>
  </el-card>
</template>

<script setup>
defineProps({
  bot: {
    type: Object,
    default: () => ({}),
  },
})

const EMPTY = '-'

/** 开发版版本号形如 `git:<short sha>`，只保留短哈希 */
function formatBotVersion(version) {
  if (!version) return EMPTY
  if (version.startsWith('git:')) return version.slice(4, 11)
  return version
}
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
