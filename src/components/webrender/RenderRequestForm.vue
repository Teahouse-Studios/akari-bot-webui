<template>
  <el-card class="webrender-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-flask-outline"></i>
        {{ $t('webrender.tester.title') }}
      </h3>
      <el-tag size="small" type="info">{{ $t(modeLabel) }}</el-tag>
    </div>

    <el-form label-position="top" class="tester-form">
      <el-form-item :label="$t('webrender.tester.mode')">
        <el-radio-group v-model="form.mode">
          <el-radio-button value="status">{{ $t('webrender.tester.mode.status') }}</el-radio-button>
          <el-radio-button value="source">{{ $t('webrender.tester.mode.source') }}</el-radio-button>
          <el-radio-button value="screenshot">
            {{ $t('webrender.tester.mode.screenshot') }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.mode !== 'status'">
        <el-form-item
          v-if="form.mode === 'screenshot'"
          :label="$t('webrender.tester.target.content')"
        >
          <el-radio-group v-model="form.target">
            <el-radio-button value="url">{{ $t('webrender.tester.target.url') }}</el-radio-button>
            <el-radio-button value="content">
              {{ $t('webrender.tester.target.content') }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="form.mode === 'source' || form.target === 'url'"
          :label="$t('webrender.tester.target.url')"
        >
          <el-input v-model="form.url" placeholder="https://example.test/" clearable />
        </el-form-item>

        <el-form-item v-else :label="$t('webrender.tester.target.content')">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="<html>…</html>" />
        </el-form-item>

        <el-form-item v-if="form.mode === 'screenshot'" :label="$t('webrender.tester.element')">
          <el-select
            v-model="form.element"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            style="width: 100%"
            :placeholder="$t('webrender.tester.element_hint')"
          />
        </el-form-item>

        <el-form-item v-if="form.mode === 'source'" :label="$t('webrender.tester.raw_text')">
          <el-switch v-model="form.raw_text" />
        </el-form-item>

        <el-divider content-position="left">{{ $t('webrender.tester.output_type') }}</el-divider>
        <el-row :gutter="16">
          <el-col v-if="form.mode === 'screenshot'" :xs="24" :md="12">
            <el-form-item :label="$t('webrender.tester.output_type')">
              <el-select v-model="form.output_type" style="width: 100%">
                <el-option
                  v-for="option in outputTypeOptions"
                  :key="option"
                  :label="option.toUpperCase()"
                  :value="option"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col
            v-if="form.mode === 'screenshot' && form.output_type === 'jpeg'"
            :xs="24"
            :md="12"
          >
            <el-form-item :label="$t('webrender.tester.output_quality')">
              <el-input-number
                v-model="form.output_quality"
                :min="1"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item :label="$t('webrender.tester.width')">
              <el-input-number v-model="form.width" :min="1" :max="10000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item :label="$t('webrender.tester.height')">
              <el-input-number v-model="form.height" :min="1" :max="10000" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">{{ $t('webrender.tester.wait_until') }}</el-divider>

        <el-row :gutter="16">
          <el-col :xs="24" :md="6">
            <el-form-item :label="$t('webrender.tester.wait_until')">
              <el-select v-model="form.wait_until" style="width: 100%">
                <el-option
                  v-for="option in waitUntilOptions"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item :label="$t('webrender.tester.wait_after_load')">
              <el-input-number
                v-model="form.wait_after_load"
                :min="0"
                :max="60000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item :label="$t('webrender.tester.locale')">
              <el-input v-model="form.locale" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :md="3">
            <el-form-item :label="$t('webrender.tester.counttime')">
              <el-switch v-model="form.counttime" />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :md="3">
            <el-form-item :label="$t('webrender.tester.stealth')">
              <el-switch v-model="form.stealth" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('webrender.tester.css')">
          <el-input
            v-model="form.css"
            type="textarea"
            :rows="3"
            placeholder="body { color: red; }"
          />
        </el-form-item>
      </template>
    </el-form>

    <div class="preview-header">
      <h4>
        <i class="mdi mdi-code-json"></i>
        {{ $t('webrender.tester.request_preview') }}
      </h4>
      <el-button size="small" text @click="copyPreview">
        <i class="mdi mdi-content-copy"></i>
        {{ $t('button.copy') }}
      </el-button>
    </div>

    <el-tabs v-model="previewTab" class="preview-tabs">
      <el-tab-pane label="JSON" name="json">
        <pre class="preview-code">{{ preview.json }}</pre>
      </el-tab-pane>
      <el-tab-pane label="cURL" name="curl">
        <pre class="preview-code">{{ preview.curl }}</pre>
      </el-tab-pane>
    </el-tabs>

    <div class="form-actions">
      <el-button
        type="primary"
        :loading="loading"
        :disabled="limited || serverOffline"
        @click="$emit('submit', form)"
      >
        <i class="mdi mdi-send"></i>
        {{ form.mode === 'status' ? $t('webrender.tester.probe') : $t('webrender.tester.send') }}
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  OUTPUT_TYPE_OPTIONS,
  WAIT_UNTIL_OPTIONS,
  buildRequestPreview,
  buildTestPayload,
} from '@/utils/webrender.js'

defineProps({
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

defineEmits(['submit'])

const { t } = useI18n()

const outputTypeOptions = OUTPUT_TYPE_OPTIONS
const waitUntilOptions = WAIT_UNTIL_OPTIONS

const previewTab = ref('json')

const defaultForm = () => ({
  mode: 'status',
  target: 'url',
  url: '',
  content: '',
  element: [],
  css: '',
  width: null,
  height: null,
  output_type: 'jpeg',
  output_quality: 90,
  counttime: true,
  stealth: true,
  wait_until: 'networkidle',
  wait_after_load: null,
  locale: 'zh_cn',
  raw_text: false,
})

const form = reactive(defaultForm())

const modeLabel = computed(() => `webrender.tester.mode.${form.mode}`)

const preview = computed(() => buildRequestPreview(buildTestPayload(form)))

const copyPreview = async () => {
  const text = previewTab.value === 'curl' ? preview.value.curl : preview.value.json
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('message.success.copied'))
  } catch (e) {
    ElMessage.error(t('chat.message.error.copy') + e.message)
  }
}

/** 供历史记录回填使用：只覆盖已知字段，避免带入多余键 */
const fill = (payload) => {
  Object.assign(form, defaultForm())
  Object.keys(form).forEach((key) => {
    if (payload && payload[key] !== undefined && key !== 'target') {
      form[key] = Array.isArray(payload[key]) ? [...payload[key]] : payload[key]
    }
  })
  if (payload?.content) form.target = 'content'
}

defineExpose({ fill })
</script>

<style scoped>
.webrender-card {
  line-height: 1.4;
}

h3,
h4 {
  cursor: default;
}

h4 {
  margin: 0;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.tester-form {
  margin-bottom: 4px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.preview-tabs {
  margin-bottom: 12px;
}

.preview-code {
  margin: 0;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 220px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
