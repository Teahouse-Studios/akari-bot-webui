<template>
  <el-card class="info-card" shadow="never" v-loading="loading">
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

    <h3>
      <i class="mdi mdi-memory"></i>
      {{ $t('dashboard.server_info.cpu.title') }}
    </h3>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.cpu.label.brand') }}</strong
      ><span class="data-text">{{ cpu.cpu_brand || '-' }}</span>
    </p>

    <h3>
      <i class="mdi mdi-laptop"></i>
      {{ $t('dashboard.server_info.system.title') }}
    </h3>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.system.label.machine') }}</strong
      ><span class="data-text"
        >{{ os.system || '-' }} {{ os.machine ? '-' : '' }} {{ os.machine || '' }}</span
      >
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.system.label.version') }}</strong
      ><span class="data-text">{{ os.version || '-' }}</span>
    </p>
    <p>
      <strong class="data-title">{{ $t('dashboard.server_info.system.label.boot_time') }}</strong
      ><span class="data-text">{{ formatTime(os.boot_time || 0) }}</span>
    </p>
  </el-card>
</template>

<script setup>
import LocalStorageJson from '@/localStorageJson.js'

defineProps({
  os: {
    type: Object,
    default: () => ({}),
  },
  bot: {
    type: Object,
    default: () => ({}),
  },
  cpu: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

function formatBotVersion(version) {
  if (!version) return '-'
  if (version.startsWith('git:')) {
    return version.slice(4, 11)
  }
  return version
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

  const locale = langMap[language] || 'zh-CN'

  if (locale === 'ja-JP') {
    return new Intl.DateTimeFormat(locale, {
      calendar: 'japanese',
      era: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
  }

  return new Intl.DateTimeFormat(locale, {
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
.info-card {
  height: 100%;
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
