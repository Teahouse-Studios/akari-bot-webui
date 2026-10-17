import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'
import { buildTestPayload, validateForm } from '@/utils/webrender.js'

/** 控制接口 6/分钟、测试接口 10/分钟（.yoyaku.md 第 7 章） */
const CONTROL_LIMIT = 6
const TEST_LIMIT = 10
const RATE_WINDOW = 60000
const HISTORY_LIMIT = 10

/**
 * WebRender 状态查询、启停控制与渲染测试。
 *
 * 控制与测试的运行期失败同样是 `200` + `ok: false`，因此不能在 catch 里判断成败。
 */
export function useWebRender() {
  const { t } = useI18n()

  const config = reactive({})
  const status = ref(null)
  const loading = ref(false)
  const controlLoading = ref(false)
  const testLoading = ref(false)
  const serverOffline = ref(false)
  const result = ref(null)
  const history = ref([])
  const controlTimestamps = ref([])
  const testTimestamps = ref([])
  const lastUpdateTime = ref(Math.floor(Date.now() / 1000))

  const abortController = new AbortController()

  const available = computed(() => status.value?.available ?? false)

  const withinWindow = (timestamps) =>
    timestamps.filter((time) => Date.now() - time < RATE_WINDOW).length

  const controlLimited = computed(() => withinWindow(controlTimestamps.value) >= CONTROL_LIMIT)
  const testLimited = computed(() => withinWindow(testTimestamps.value) >= TEST_LIMIT)

  const localizeError = (code) => {
    const key = code ? `webrender.error.${code}` : ''
    const translated = key ? t(key) : ''
    return translated && translated !== key ? translated : code || t('unknown')
  }

  async function fetchStatus(silent = false) {
    loading.value = true
    try {
      const response = await axios.get('/api/webrender', { signal: abortController.signal })
      Object.assign(config, response.data?.config || {})
      status.value = response.data?.status ?? null
      serverOffline.value = false
      lastUpdateTime.value = Math.floor(Date.now() / 1000)
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled')
      } else if (error.response?.status === 400 || !error.response) {
        // 服务端进程离线时本接口直接返回 400 Bad request
        serverOffline.value = true
        status.value = null
        if (!silent) ElMessage.error(t('webrender.error.server_offline'))
      } else {
        ElMessage.error(t('message.error.fetch') + error.message)
      }
    } finally {
      loading.value = false
    }
  }

  async function control(action) {
    if (controlLoading.value || controlLimited.value) return

    controlLoading.value = true
    controlTimestamps.value = [...controlTimestamps.value, Date.now()]
    try {
      const response = await axios.post('/api/webrender/control', { action })
      const data = response.data || {}

      if (data.ok) {
        ElMessage.success(t('webrender.control.success'))
        await fetchStatus(true)
      } else {
        ElMessage.error(localizeError(data.error))
        if (data.status) status.value = { ...(status.value || {}), ...data.status }
      }
    } catch (error) {
      const detail = error.response?.data?.detail
      if (detail === 'invalid_action') {
        ElMessage.error(t('unknown'))
      } else {
        ElMessage.error(t('message.error.fetch') + error.message)
      }
    } finally {
      controlLoading.value = false
    }
  }

  async function runTest(form) {
    if (!validateForm(form)) {
      ElMessage.warning(
        form.mode === 'source'
          ? t('webrender.tester.validate.url')
          : t('webrender.tester.validate.target'),
      )
      return
    }
    if (testLoading.value || testLimited.value) return

    const payload = buildTestPayload(form)
    testLoading.value = true
    testTimestamps.value = [...testTimestamps.value, Date.now()]
    try {
      const response = await axios.post('/api/webrender/test', payload)
      const data = response.data || {}
      result.value = data
      history.value = [
        { payload, mode: payload.mode, time: Date.now(), ok: data.ok },
        ...history.value,
      ].slice(0, HISTORY_LIMIT)

      if (!data.ok && data.error) {
        ElMessage.warning(localizeError(data.error))
      }
    } catch (error) {
      const detail = error.response?.data?.detail
      if (detail) {
        ElMessage.error(localizeError(detail))
      } else {
        ElMessage.error(t('message.error.fetch') + error.message)
      }
    } finally {
      testLoading.value = false
    }
  }

  onMounted(() => {
    fetchStatus()
  })

  onBeforeUnmount(() => {
    abortController.abort()
  })

  const clearHistory = () => {
    history.value = []
  }

  return {
    config,
    status,
    loading,
    controlLoading,
    testLoading,
    serverOffline,
    result,
    history,
    available,
    controlLimited,
    testLimited,
    lastUpdateTime,
    localizeError,
    fetchStatus,
    control,
    runTest,
    clearHistory,
  }
}
