<template>
  <div v-if="isDevelopMode">
    <div class="breadcrumb-actions">
      <div class="operation-button-container">
        <el-tooltip :content="t('files.button.back')" placement="bottom" v-if="!isRoot">
          <el-button class="icon-button" type="primary" @click="goUp" :disabled="loading">
            <i class="mdi mdi-arrow-left-top"></i>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="t('button.refresh')" placement="bottom">
          <el-button class="icon-button" type="primary" @click="refresh" :disabled="loading">
            <i class="mdi mdi-refresh"></i>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="t('files.button.create')" placement="bottom">
          <el-button
            class="icon-button"
            type="primary"
            @click="showCreateDialog = true"
            :disabled="loading"
          >
            <i class="mdi mdi-plus"></i>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="t('files.button.upload')" placement="bottom">
          <el-button class="icon-button" type="primary" @click="toggleUpload" :disabled="loading">
            <i class="mdi mdi-upload"></i>
          </el-button>
        </el-tooltip>
      </div>

      <div class="breadcrumb-wrapper" ref="breadcrumbWrapper">
        <el-breadcrumb separator="/" class="breadcrumb-nav">
          <el-breadcrumb-item
            v-for="(p, idx) in pathParts"
            :key="idx"
            :class="{ active: idx === pathParts.length - 1 }"
          >
            <span
              v-if="idx !== pathParts.length - 1"
              class="breadcrumb-link"
              @click="goToPath(idx)"
            >
              {{ p }}
            </span>
            <span v-else>{{ p }}</span>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="showUpload" class="upload-area">
        <el-upload
          ref="uploadRef"
          drag
          multiple
          directory
          :action="uploadUrl"
          :data="{ path: currentPath }"
          :show-file-list="true"
          :before-upload="handleBeforeUpload"
          :headers="uploadHeaders"
          @success="refresh"
          @error="handleUploadError"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            {{ t('files.upload.drag_text') }} <em>{{ t('files.upload.click_text') }}</em>
          </div>
        </el-upload>
      </div>
    </el-collapse-transition>

    <el-card class="files-card" shadow="never">
      <div style="margin-bottom: 15px">
        <el-button type="info" size="small" @click="toggleHiddenFiles">
          <i :class="showHiddenFiles ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
          {{ showHiddenFiles ? t('files.button.hide_hidden') : t('files.button.show_hidden') }}
        </el-button>
      </div>
      <el-table :data="files" style="width: 100%" stripe v-loading="loading">
        <el-table-column prop="name" :label="t('files.table.name')" min-width="240" sortable>
          <template #default="{ row }">
            <i
              :class="row.is_dir ? 'mdi mdi-folder-outline' : 'mdi mdi-file-outline'"
              style="margin-right: 6px"
            ></i>
            <span
              style="cursor: pointer; color: gray"
              @click="row.is_dir ? openDir(row.name) : previewFile(row.name)"
            >
              {{ row.name }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="size"
          :label="t('files.table.size')"
          min-width="100"
          sortable
          :formatter="formatSize"
        />
        <el-table-column
          prop="modified"
          :label="t('files.table.modified')"
          min-width="160"
          sortable
          :formatter="formatDate"
        />
        <el-table-column :label="t('files.table.action')" min-width="360">
          <template #default="{ row }">
            <el-button size="small" type="info" @click="rename(row)">
              <i class="mdi mdi-rename"></i>{{ t('files.button.rename') }}
            </el-button>
            <el-button size="small" type="primary" @click="download(row)">
              <i class="mdi mdi-download"></i>{{ t('files.button.download') }}
            </el-button>
            <el-button size="small" type="danger" @click="remove(row)">
              <i class="mdi mdi-delete"></i> {{ t('button.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-if="totalFiles > 0"
          background
          layout="prev, pager, next"
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalFiles"
          style="margin-top: 20px"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    <el-dialog v-model="showCreateDialog" width="300px" :title="t('files.title.create')">
      <el-radio-group v-model="createType">
        <el-radio label="dir">{{ t('files.select.create.dir') }}</el-radio>
        <el-radio label="file">{{ t('files.select.create.file') }}</el-radio>
      </el-radio-group>
      <el-input
        v-model="createName"
        :placeholder="t('files.input.create.placeholder')"
        style="margin-top: 10px; margin-bottom: 10px"
      ></el-input>
      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('button.cancel') }}</el-button>
        <el-button type="primary" @click="createItem">{{ t('button.confirm') }}</el-button>
      </template>
    </el-dialog>

    <div
      v-if="fullscreenPreviewVisible"
      class="fullscreen-preview"
      @click="closeFullscreenPreview"
      :class="{ show: showFullscreenPreviewAnim }"
    >
      <img :src="previewUrl" class="fullscreen-image" @click.stop ref="fullscreenImage" />
    </div>

    <el-dialog
      v-model="previewVisible"
      :title="t('files.title.edit')"
      :width="previewTextDialogWidth"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      v-if="isText"
      :before-close="closePreview"
    >
      <div ref="textEditor" class="editor-body"></div>
      <template #footer>
        <el-button @click="closePreview">{{ t('button.cancel') }}</el-button>
        <el-button type="primary" @click="saveFile">{{ t('button.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" v-else :show-close="false">
      <el-result icon="error" :sub-title="emptyDescription" />
    </el-dialog>
  </div>
  <notFound v-else />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElMessage } from 'element-plus'
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'
import notFound from './notFound.vue'

const { t } = useI18n()
const loading = ref(false)
const currentPath = ref('')
const allFiles = ref([])
const files = ref([])
const showHiddenFiles = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalFiles = ref(0)
const showCreateDialog = ref(false)
const createType = ref('dir')
const createName = ref('')
const showUpload = ref(false)
const previewUrl = ref('')
const previewContent = ref('')
const previewName = ref('')
const previewTextDialogWidth = ref('90%')
const fullscreenPreviewVisible = ref(false)
const showFullscreenPreviewAnim = ref(false)
const isText = ref(false)
const emptyDescription = ref(t('files.preview.unsupported'))
const editorView = ref(null)
const textEditor = ref(null)
const previewVisible = ref(false)
const uploadRef = ref(null)
const uploadUrl = '/api/files/upload'
const isDevelopMode = ref(LocalStorageJson.getItem('isDevelopMode') === 'true' && !IS_DEMO)

const pathParts = computed(() => {
  const fullPath = currentPath.value ? `./${currentPath.value}` : '.'
  return fullPath.split('/')
})

const isRoot = computed(() => !currentPath.value || currentPath.value === '.')

const uploadHeaders = computed(() => {
  const token = LocalStorageJson.getItem('token')
  return {
    Authorization: `Bearer ${token}`,
  }
})

const clearUploadFiles = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const updateFiles = () => {
  const filtered = showHiddenFiles.value
    ? allFiles.value
    : allFiles.value.filter((f) => !f.name.startsWith('.'))

  totalFiles.value = filtered.length

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  files.value = filtered.slice(start, end)
}

const fetchFiles = async () => {
  if (!isDevelopMode.value) return

  loading.value = true
  try {
    const res = await axios.get('/api/files/list', {
      params: { path: currentPath.value },
    })
    allFiles.value = res.data.files || []
    updateFiles()
  } catch (e) {
    if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  } finally {
    loading.value = false
  }
}

const scrollBreadcrumbToEnd = () => {
  const wrapper = document.querySelector('.breadcrumb-wrapper')
  if (wrapper) {
    wrapper.scrollLeft = wrapper.scrollWidth
  }
}

const goToPath = (idx) => {
  const parts = pathParts.value.slice(1, idx + 1)
  const newPath = parts.join('/')
  currentPath.value = newPath
  clearUploadFiles()
  fetchFiles()
}

const handleUploadError = (err, _file, _fileList) => {
  if (err.status === 413) {
    ElMessage.error(t('files.message.upload.error.too_large'))
  } else if (err.status === 403) {
    ElMessage.error(t('files.message.error.invalid_path'))
  } else {
    ElMessage.error(t('message.error.fetch') + err.message)
  }
}

const formatSize = (row) => {
  const size = row.size
  if (row.is_dir) return '--'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (row) => {
  if (!row.modified) return ''
  const date = new Date(row.modified)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchFiles()
}

const toggleHiddenFiles = () => {
  showHiddenFiles.value = !showHiddenFiles.value
  currentPage.value = 1
  updateFiles()
}

const openDir = (name) => {
  currentPath.value = currentPath.value ? `${currentPath.value}/${name}` : name
  clearUploadFiles()
  fetchFiles()
}

const goUp = () => {
  const parts = currentPath.value.split('/')
  parts.pop()
  currentPath.value = parts.join('/')
  clearUploadFiles()
  fetchFiles()
}

const refresh = () => {
  fetchFiles()
}

const createItem = async () => {
  if (!createName.value) {
    ElMessage.warning(t('files.message.warning.input_name'))
    return
  }

  try {
    await axios.post('/api/files/create', null, {
      params: {
        path: currentPath.value,
        name: createName.value,
        filetype: createType.value,
      },
      headers: uploadHeaders.value,
    })
    ElMessage.success(t('files.message.create.success'))
    showCreateDialog.value = false
    createName.value = ''
    fetchFiles()
  } catch (e) {
    if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (e.response?.status === 400) {
      ElMessage.error(t('files.message.create.error.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const toggleUpload = () => {
  showUpload.value = !showUpload.value
}

const updatePreviewTextDialogWidth = () => {
  const screenWidth = window.innerWidth
  if (screenWidth < 1024) {
    previewTextDialogWidth.value = '90%'
  } else {
    const newWidth = screenWidth * 0.9 - 400
    previewTextDialogWidth.value = `${newWidth}px`
  }
}

const getLanguageExtension = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  switch (ext) {
    case 'html':
    case 'htm':
      return html()
    case 'json':
      return json()
    case 'md':
    case 'markdown':
      return markdown()
    case 'py':
      return python()
    case 'yml':
    case 'yaml':
      return yaml()
    default:
      return null
  }
}

const initTextPreview = () => {
  if (!isText.value) return

  if (previewContent.value === '\u200B') {
    previewContent.value = ''
  }

  const langExt = getLanguageExtension(previewName.value)
  const extensions = [basicSetup, oneDark, EditorView.lineWrapping]
  if (langExt) {
    extensions.push(langExt)
  }

  if (editorView.value) {
    editorView.value.destroy()
    editorView.value = null
  }

  const state = EditorState.create({
    doc: previewContent.value,
    extensions,
  })

  const textEditorEl = textEditor.value || document.querySelector('.editor-body')
  if (textEditorEl) {
    editorView.value = new EditorView({
      state,
      parent: textEditorEl,
    })
  }
}

const previewFile = async (name) => {
  const path = currentPath.value ? `${currentPath.value}/${name}` : name

  isText.value = false
  emptyDescription.value = t('files.preview.unsupported')
  try {
    const res = await axios.get('/api/files/preview', {
      params: { path },
      responseType: 'blob',
    })

    const contentType = res.data.type || res.headers['content-type']

    if (contentType.startsWith('image')) {
      previewUrl.value = URL.createObjectURL(res.data)
      fullscreenPreviewVisible.value = true
      showFullscreenPreviewAnim.value = false
      nextTick(() => {
        setTimeout(() => {
          showFullscreenPreviewAnim.value = true
        }, 10)
      })
    } else if (contentType.startsWith('text')) {
      isText.value = true
      previewName.value = name
      const text = await res.data.text()
      previewContent.value = text || '\u200B'
      nextTick(initTextPreview)
      previewVisible.value = true
    } else {
      emptyDescription.value = t('files.preview.unsupported')
      previewVisible.value = true
    }
  } catch (e) {
    if (e.response?.status === 408) {
      emptyDescription.value = t('files.preview.too_large')
      previewVisible.value = true
    } else if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (e.response?.status === 400) {
      emptyDescription.value = t('files.preview.failed')
      previewVisible.value = true
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const closeFullscreenPreview = () => {
  const imgEl = document.querySelector('.fullscreen-image')
  const wrapper = document.querySelector('.fullscreen-preview')

  if (imgEl && wrapper) {
    showFullscreenPreviewAnim.value = false
    setTimeout(() => {
      fullscreenPreviewVisible.value = false
      previewUrl.value = ''
    }, 300)
  } else {
    fullscreenPreviewVisible.value = false
    previewUrl.value = ''
  }
}

const updateFullscreenLeft = () => {
  const el = document.querySelector('.fullscreen-preview')
  if (!el) return
  el.style.left = window.innerWidth >= 1024 ? '60px' : '0'
}

const closePreview = () => {
  previewVisible.value = false

  if (editorView.value) {
    editorView.value.destroy()
    editorView.value = null
  }
  previewContent.value = ''
  previewName.value = ''
  isText.value = true
  previewUrl.value = ''
}

const saveFile = async () => {
  if (!editorView.value) return

  const content = editorView.value.state.doc.toString()
  const blob = new Blob([content], { type: 'text/plain' })
  const formData = new FormData()
  formData.append('file', blob, previewName.value)
  formData.append('path', currentPath.value)

  try {
    await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...uploadHeaders.value,
      },
    })
    ElMessage.success(t('files.message.save.success'))
    previewVisible.value = false
    closePreview()
    fetchFiles()
  } catch (e) {
    if (e.response?.status === 400) {
      ElMessage.error(t('files.message.save.error.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const handleBeforeUpload = async (file) => {
  const exists = files.value.some((f) => !f.is_dir && f.name === file.name)
  if (exists) {
    try {
      await ElMessageBox.confirm(
        t('files.confirm.file_exists', { name: file.name }),
        t('files.title.file_exists'),
        {
          confirmButtonText: t('files.button.replace'),
          cancelButtonText: t('button.cancel'),
          type: 'warning',
        },
      )
      return true
    } catch {
      return false
    }
  }
  return true
}

const rename = async (row) => {
  try {
    const { value: newName } = await ElMessageBox.prompt('', t('files.title.rename'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      inputValue: row.name,
      beforeClose: (action, instance, done) => {
        if (action === 'confirm' && !instance.inputValue.trim()) {
          ElMessage.warning(t('files.message.warning.input_new_name'))
          return
        }
        done()
      },
    })

    const path = currentPath.value ? `${currentPath.value}/${row.name}` : row.name

    await axios.post('/api/files/rename', {
      path,
      new_name: newName,
    })

    fetchFiles()
    ElMessage.success(t('files.message.rename.success'))
  } catch (e) {
    if (e === 'cancel') {
      return
    }
    if (e.response?.status === 409) {
      ElMessage.error(t('files.message.rename.error.exists'))
    } else if (e.response?.status === 404) {
      ElMessage.error(t('files.message.rename.error.not_found'))
    } else if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (e.response?.status === 400) {
      ElMessage.error(t('files.message.rename.error.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const remove = async (row) => {
  try {
    await ElMessageBox.confirm(t('files.confirm.delete'), t('files.title.delete'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    })

    const path = currentPath.value ? `${currentPath.value}/${row.name}` : row.name

    await axios.delete('/api/files/delete', { params: { path } })

    fetchFiles()
    ElMessage.success(t('files.message.delete.success'))
  } catch (e) {
    if (e === 'cancel') {
      return
    }
    if (e.response?.status === 404) {
      ElMessage.error(t('files.message.delete.error.not_found'))
    } else if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (e.response?.status === 400) {
      ElMessage.error(t('files.message.delete.error.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const download = async (row) => {
  const path = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
  const res = await axios.get('/api/files/download', {
    params: { path },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const a_ = document.createElement('a')
  a_.href = url
  a_.download = row.name
  a_.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  fetchFiles()
  window.addEventListener('resize', updateFullscreenLeft)
  window.addEventListener('resize', updatePreviewTextDialogWidth)
  updateFullscreenLeft()
  updatePreviewTextDialogWidth()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateFullscreenLeft)
  window.removeEventListener('resize', updatePreviewTextDialogWidth)
})

watch(currentPath, () => {
  currentPage.value = 1
  showUpload.value = false
  nextTick(() => {
    scrollBreadcrumbToEnd()
  })
})

watch(previewContent, (newVal) => {
  if (editorView.value && editorView.value.state.doc.toString() !== newVal) {
    editorView.value.dispatch({
      changes: { from: 0, to: editorView.value.state.doc.length, insert: newVal },
    })
  }
})

watch(fullscreenPreviewVisible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.breadcrumb-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.breadcrumb-wrapper {
  flex: 1;
  order: 2;
  margin-left: 12px;
  margin-bottom: 15px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  border-radius: 8px;
  background: #f4f4f4;
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
}

@media (max-width: 384px) {
  .breadcrumb-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .breadcrumb-wrapper {
    margin-left: 0;
    order: -1;
  }
}

.dark .breadcrumb-wrapper {
  background: #1f1f1f;
  border: 1px solid #4d4d4d;
}

.breadcrumb-link {
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--el-color-primary);
}

.operation-button-container {
  display: flex;
  margin: 0 0 15px;
  order: 1;
}

.breadcrumb-nav {
  display: inline-flex;
}

.icon-button {
  font-size: 16px;
  padding: 8px;
}

.icon-button i {
  margin-right: 0 !important;
}

.el-button i {
  margin-right: 8px;
}

.upload-area {
  margin-bottom: 15px;
  padding: 20px;
  border-radius: 4px;
  background: #f4f4f4;
  border: 1px dashed #e0e0e0;
}

.dark .upload-area {
  background: #1f1f1f;
  border: 1px dashed #4d4d4d;
}

.files-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.pagination-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
}

.fullscreen-preview {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 60px);
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-preview.show {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.85);
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  display: block;
  transform: scale(0.8);
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  opacity: 0;
}

.fullscreen-preview.show .fullscreen-image {
  transform: scale(1);
  opacity: 1;
}

.fullscreen-preview img {
  cursor: auto;
  object-fit: contain;
}

.editor-body {
  height: 60vh;
  overflow: auto;
  border-radius: 4px;
  margin-bottom: 12px;
}

::v-deep(.cm-editor) {
  height: 100%;
}

::v-deep(.cm-gutters) {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

::v-deep(.cm-content) {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 14px;
}
</style>
