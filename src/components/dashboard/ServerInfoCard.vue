<template>
  <el-row :gutter="20">
    <el-col :span="10" :xs="24">
      <el-card :body-style="{ height: '190px' }" shadow="never" v-loading="loading">
        <h3>
          <i class="mdi mdi-robot-outline"></i>
          {{ $t('dashboard.server_info.bot.title') }}
        </h3>
        <p>
          <strong class="data-title">{{
            $t('dashboard.server_info.bot.label.python_version')
          }}</strong
          ><span class="data-text">{{ bot.python_version || '-' }}</span>
        </p>
        <p>
          <strong class="data-title">{{ $t('dashboard.server_info.bot.label.bot_version') }}</strong
          ><span class="data-text">{{ formatBotVersion(bot.version) }}</span>
        </p>
        <p>
          <strong class="data-title">{{
            $t('dashboard.server_info.bot.label.web_render_status')
          }}</strong
          ><span class="data-text">{{ bot.web_render_status ? $t('true') : $t('false') }}</span>
        </p>
        <p>
          <strong class="data-title">{{
            $t('dashboard.server_info.bot.label.running_time')
          }}</strong
          ><span class="data-text">{{ formatRunningTime(bot.running_time || 0) }}</span>
        </p>
      </el-card>
      <el-card :body-style="{ height: '190px' }" shadow="never" v-loading="loading">
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
          <strong class="data-title">{{
            $t('dashboard.server_info.system.label.boot_time')
          }}</strong
          ><span class="data-text">{{ formatTime(os.boot_time || 0) }}</span>
        </p>
      </el-card>
    </el-col>

    <el-col :span="14" :xs="24">
      <el-card :body-style="{ height: '440px' }" shadow="never" v-loading="loading">
        <h3>
          <i class="mdi mdi-memory"></i>
          {{ $t('dashboard.server_info.cpu.title') }}
        </h3>
        <p>
          <strong class="data-title">{{ $t('dashboard.server_info.cpu.label.brand') }}</strong>
        </p>
        <p>
          <span class="data-text">{{ cpu.cpu_brand || '-' }}</span>
        </p>
        <h3>
          <i class="mdi mdi-sd"></i>
          {{ $t('dashboard.server_info.memory.title') }}
        </h3>
        <p>
          <span class="data-text"
            >{{ memory.used ? memory.used.toFixed() : 0 }} MB /
            {{ memory.total ? memory.total.toFixed() : 0 }} MB</span
          >
        </p>
        <h3>
          <i class="mdi mdi-server-outline"></i>
          {{ $t('dashboard.server_info.disk.title') }}
        </h3>
        <p>
          <span class="data-text"
            >{{ disk.used ? disk.used.toFixed(1) : 0 }} GB /
            {{ disk.total ? disk.total.toFixed(1) : 0 }} GB</span
          >
        </p>
        <br />
        <div
          :class="[
            'memory-dashboards',
            { leftAlign: dashboardOverflow, centerAlign: !dashboardOverflow },
          ]"
        >
          <el-progress
            type="dashboard"
            :percentage="cpu.cpu_percent ? cpu.cpu_percent.toFixed(1) : 0"
            :color="getProgressColor(cpu.cpu_percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">{{ $t('dashboard.server_info.cpu.title') }}</span>
            </template>
          </el-progress>
          <el-progress
            type="dashboard"
            :percentage="memory.percent ? memory.percent.toFixed(1) : 0"
            :color="getProgressColor(memory.percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">{{ $t('dashboard.server_info.memory.title') }}</span>
            </template>
          </el-progress>
          <el-progress
            type="dashboard"
            :percentage="disk.percent ? disk.percent.toFixed(1) : 0"
            :color="getProgressColor(disk.percent)"
          >
            <template #default="{ percentage }">
              <span class="percentage-value">{{ percentage }}%</span>
              <span class="percentage-label">{{ $t('dashboard.server_info.disk.title') }}</span>
            </template>
          </el-progress>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import axios from '@/axios.mjs'
import LocalStorageJson from '@/localStorageJson.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const progressColors = ['#1989fa', '#e6a23c', '#f56c6c']

const os = reactive({
  system: '',
  version: '',
  machine: '',
  boot_time: 0,
})

const bot = reactive({
  running_time: 0,
  python_version: '',
  version: '',
  web_render_status: false,
})

const cpu = reactive({
  cpu_brand: '',
  cpu_percent: 0,
})

const memory = reactive({
  total: 0,
  used: 0,
  percent: 0,
})

const disk = reactive({
  total: 0,
  used: 0,
  percent: 0,
})

const loading = ref(false)
const dashboardOverflow = ref(false)
const abortController = new AbortController()

function formatRunningTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return t('dashboard.server_info.text.format_time', {
    hours,
    minutes,
    seconds: remainingSeconds,
  })
}

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

function getProgressColor(percentage) {
  if (percentage >= 90) return progressColors[2]
  if (percentage >= 60) return progressColors[1]
  return progressColors[0]
}

function checkOverflow() {
  nextTick(() => {
    const el = document.querySelector('.memory-dashboards')
    if (el) {
      dashboardOverflow.value = el.scrollWidth > el.clientWidth
    }
  })
}

async function fetchServerInfoData(noCache = false) {
  loading.value = true

  const headers = {}
  if (noCache) {
    Object.assign(headers, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
  }

  try {
    const response = await axios.get('/api/server-info', {
      headers,
      signal: abortController.signal,
    })
    const data = response.data

    Object.assign(os, data.os)
    Object.assign(bot, data.bot)
    Object.assign(cpu, data.cpu)
    Object.assign(memory, data.memory)
    Object.assign(disk, data.disk)
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    loading.value = false
  }
}

defineExpose({
  fetchServerInfoData,
})

onMounted(() => {
  checkOverflow()
  window.addEventListener('resize', checkOverflow)
  fetchServerInfoData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOverflow)
  abortController.abort()
})
</script>

<style scoped>
h3 {
  cursor: default;
}

.el-card {
  margin-bottom: 20px;
  line-height: 1;
}

.data-text {
  color: #666;
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

.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 20px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 14px;
}

.memory-dashboards {
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

.memory-dashboards.centerAlign {
  justify-content: center;
}

.memory-dashboards.leftAlign {
  justify-content: flex-start;
}

.el-progress--dashboard {
  margin: 5px;
}
</style>
