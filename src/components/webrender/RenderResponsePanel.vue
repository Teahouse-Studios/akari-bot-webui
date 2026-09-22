<template>
  <el-card class="webrender-card" shadow="never" v-loading="loading">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-download-outline"></i>
        {{ $t('webrender.response.title') }}
      </h3>
      <div v-if="result" class="response-meta">
        <el-tag :type="result.ok ? 'success' : 'danger'" size="small">
          {{ result.ok ? $t('webrender.response.ok') : $t('webrender.response.failed') }}
        </el-tag>
        <span class="meta-text">{{
          $t('webrender.response.elapsed', { seconds: result.elapsed })
        }}</span>
        <span v-if="result.mode" class="meta-text">{{
          $t(`webrender.tester.mode.${result.mode}`)
        }}</span>
      </div>
    </div>

    <el-alert
      v-if="result && !result.ok && errorText"
      :title="errorText"
      type="error"
      show-icon
      :closable="false"
      class="response-alert"
    />

    <template v-if="result">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="$t('webrender.response.tab.status')" name="status">
          <pre class="response-code">{{ statusJson }}</pre>
        </el-tab-pane>

        <el-tab-pane :label="$t('webrender.response.tab.source')" name="source">
          <el-alert
            v-if="result.source_truncated"
            :title="$t('webrender.response.source_truncated')"
            type="warning"
            show-icon
            :closable="false"
            class="response-alert"
          />
          <pre v-if="result.source" class="response-code">{{ result.source }}</pre>
          <el-empty v-else :description="$t('webrender.response.empty')" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane :label="$t('webrender.response.tab.images')" name="images">
          <template v-if="images.length">
            <div class="images-meta">
              {{ $t('webrender.response.images_count', { count: images.length }) }}
            </div>
            <div class="image-list">
              <img
                v-for="(image, index) in images"
                :key="index"
                :src="image"
                class="response-image"
                alt=""
                @click="openPreview(image)"
              />
            </div>
          </template>
          <el-empty v-else :description="$t('webrender.response.empty')" :image-size="60" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-empty v-else :description="$t('webrender.response.empty')" :image-size="80" />

    <!-- 截图仅保存在内存中，不写入 localStorage -->
    <el-dialog
      v-model="previewVisible"
      :title="$t('webrender.response.tab.images')"
      width="90%"
      append-to-body
    >
      <img :src="previewImage" class="preview-image" alt="" />
      <template #footer>
        <el-button @click="openInNewWindow">
          <i class="mdi mdi-open-in-new"></i>
          {{ $t('webrender.response.open_new_window') }}
        </el-button>
        <el-button type="primary" @click="downloadImage">
          <i class="mdi mdi-download"></i>
          {{ $t('webrender.response.download') }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { imageDataUrl } from '@/utils/webrender.js'

const props = defineProps({
  result: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errorText: {
    type: String,
    default: '',
  },
})

const activeTab = ref('status')
const previewVisible = ref(false)
const previewImage = ref('')

// 请求结束后自动切到有内容的标签页，省去手动点击
watch(
  () => props.result,
  (value) => {
    if (!value) return
    if (value.images?.length) {
      activeTab.value = 'images'
    } else if (value.source) {
      activeTab.value = 'source'
    } else {
      activeTab.value = 'status'
    }
  },
)

const statusJson = computed(() => JSON.stringify(props.result?.status ?? null, null, 2))

const images = computed(() =>
  (props.result?.images || []).map((base64) => imageDataUrl(base64, props.result?.output_type)),
)

const openPreview = (image) => {
  previewImage.value = image
  previewVisible.value = true
}

const openInNewWindow = () => {
  if (previewImage.value) window.open(previewImage.value, '_blank')
}

const downloadImage = () => {
  if (!previewImage.value) return
  const extension = props.result?.output_type === 'png' ? 'png' : 'jpg'
  const link = document.createElement('a')
  link.href = previewImage.value
  link.download = `webrender-${Date.now()}.${extension}`
  link.click()
}
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
  flex-wrap: wrap;
}

.response-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.response-alert {
  margin: 12px 0;
}

.response-code {
  margin: 0;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.images-meta {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.response-image {
  max-width: 100%;
  max-height: 320px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
}

.preview-image {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 70vh;
}
</style>
