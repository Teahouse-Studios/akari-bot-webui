<template>
  <div class="file-manager" :class="{ 'file-manager-embedded': embedded }">
    <div class="breadcrumb-actions">
      <div class="operation-button-container">
        <el-tooltip :content="t('files.button.back')" placement="bottom" v-if="!isRoot">
          <el-button class="icon-button" type="primary" @click="goUp" :disabled="loading">
            <i class="mdi mdi-arrow-left-top"></i>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="t('button.refresh')" placement="bottom">
          <el-button
            class="icon-button"
            type="primary"
            @click="refresh"
            :disabled="loading || rootsLoading"
          >
            <i class="mdi mdi-refresh"></i>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="t('files.button.create')" placement="bottom">
          <el-button
            class="icon-button"
            type="primary"
            @click="showCreateDialog = true"
            :disabled="loading || !canModify"
          >
            <i class="mdi mdi-plus"></i>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="t('files.button.upload')" placement="bottom">
          <el-button
            class="icon-button"
            type="primary"
            @click="toggleUpload"
            :disabled="loading || !canModify"
          >
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
      <div v-show="showUpload && canModify" class="upload-area">
        <el-upload
          ref="uploadRef"
          drag
          multiple
          directory
          :action="uploadUrl"
          :data="uploadData"
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
      <div class="files-toolbar">
        <el-button type="info" size="small" @click="toggleHiddenFiles">
          <i :class="showHiddenFiles ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
          {{ showHiddenFiles ? t('files.button.hide_hidden') : t('files.button.show_hidden') }}
        </el-button>
      </div>
      <el-empty
        v-if="!isDevRepoMode && !rootsLoading && availableRoots.length === 0 && !loading"
        :description="t('files.root.none')"
      />
      <el-table v-else :data="files" style="width: 100%" stripe v-loading="loading || rootsLoading">
        <el-table-column prop="name" :label="t('files.table.name')" min-width="240" sortable>
          <template #default="{ row }">
            <i
              :class="row.is_dir ? 'mdi mdi-folder-outline' : 'mdi mdi-file-outline'"
              style="margin-right: 6px"
            ></i>
            <span
              class="file-name"
              :class="{ 'file-name-hidden': isHiddenEntry(row) }"
              @click="handleEntryClick(row)"
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
            <template v-if="!row.virtual">
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

    <Teleport to="body">
      <div
        v-if="fullscreenPreviewVisible"
        class="fullscreen-preview"
        @click="closeFullscreenPreview"
        :class="{ show: showFullscreenPreviewAnim }"
      >
        <img :src="previewUrl" class="fullscreen-image" @click.stop ref="fullscreenImage" />
        <button
          class="fullscreen-close"
          type="button"
          :aria-label="t('button.close')"
          @click.stop="closeFullscreenPreview"
        >
          <i class="mdi mdi-close"></i>
        </button>
      </div>
    </Teleport>

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
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElMessage } from 'element-plus'
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { toml } from '@/utils/codemirror/toml-lang.js'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { IS_DEMO } from '@/const'
import { getIsDevelopMode } from '@/dev'
import LocalStorageJson from '@/localStorageJson.js'
import {
  listStorageRoots,
  listStorage,
  readStorageContent,
  writeStorageContent,
  createStorageEntry,
  renameStorageEntry,
  deleteStorageEntry,
  downloadStorageEntry,
  listDevFiles,
  previewDevFile,
  downloadDevEntry,
  uploadDevFile,
  createDevEntry,
  renameDevEntry,
  deleteDevEntry,
} from '@/files.js'

const props = defineProps({
  moduleName: {
    type: String,
    default: '',
  },
  embedded: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const loading = ref(false)
const currentPath = ref('')
const virtualPath = ref([])
const allFiles = ref([])
const showHiddenFiles = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
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
const previewRevision = ref('')
const uploadRef = ref(null)
const storageRoots = ref([])
const devMode = ref(false)
const rootsLoading = ref(true)

const isModuleScope = computed(() => Boolean(props.moduleName))
const isDevRepoMode = computed(() => !isModuleScope.value && devMode.value)

const availableRoots = computed(() => {
  if (isModuleScope.value) {
    return storageRoots.value.filter(
      (root) => root.scope === 'module' && root.module === props.moduleName,
    )
  }
  return devMode.value
    ? storageRoots.value
    : storageRoots.value.filter((root) => root.scope === 'core')
})

const rootVirtualPath = (root) => {
  if (isModuleScope.value || root.scope === 'core') {
    return [root.target]
  }
  return ['modules', root.module, root.target]
}

const rootMap = computed(() => {
  const map = new Map()
  for (const root of availableRoots.value) {
    map.set(rootVirtualPath(root).join('/'), root)
  }
  return map
})

const activeRoot = computed(() => rootMap.value.get(virtualPath.value.join('/')) || null)

const virtualEntries = computed(() => {
  if (activeRoot.value) return []

  const prefix = virtualPath.value
  const names = new Set()
  for (const root of availableRoots.value) {
    const path = rootVirtualPath(root)
    if (path.length <= prefix.length) continue
    if (prefix.every((segment, index) => path[index] === segment)) {
      names.add(path[prefix.length])
    }
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      is_dir: true,
      size: null,
      modified: null,
      revision: null,
      virtual: true,
    }))
})

const sourceFiles = computed(() =>
  isDevRepoMode.value || activeRoot.value ? allFiles.value : virtualEntries.value,
)

const isPrivateDataEntry = (file) =>
  !isDevRepoMode.value &&
  activeRoot.value?.id === 'core:data' &&
  !currentPath.value &&
  file.name === 'private'

const isHiddenEntry = (file) => file.name.startsWith('.') || isPrivateDataEntry(file)

const filteredFiles = computed(() =>
  showHiddenFiles.value
    ? sourceFiles.value
    : sourceFiles.value.filter((file) => !isHiddenEntry(file)),
)

const totalFiles = computed(() => filteredFiles.value.length)

const files = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredFiles.value.slice(start, start + pageSize.value)
})

const pathParts = computed(() => {
  if (isDevRepoMode.value) {
    return currentPath.value ? ['.', ...currentPath.value.split('/')] : ['.']
  }

  const parts = ['.', ...virtualPath.value]
  if (currentPath.value) {
    parts.push(...currentPath.value.split('/'))
  }
  return parts
})

const isRoot = computed(() => pathParts.value.length <= 1)
const canModify = computed(() => isDevRepoMode.value || Boolean(activeRoot.value))

const uploadUrl = computed(() =>
  isDevRepoMode.value ? '/api/dev/files/upload' : '/api/files/upload',
)

const uploadData = computed(() => {
  if (isDevRepoMode.value) {
    return { path: currentPath.value }
  }
  return {
    root: activeRoot.value?.id || '',
    path: currentPath.value,
  }
})

const getErrorDetail = (error) => {
  const detail = error.response?.data?.detail
  return typeof detail === 'string' ? detail : ''
}

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

const loadRoots = async () => {
  rootsLoading.value = true
  try {
    storageRoots.value = await listStorageRoots()
  } catch (e) {
    storageRoots.value = []
    ElMessage.error(t('message.error.fetch') + e.message)
  } finally {
    rootsLoading.value = false
  }
}

const fetchFiles = async () => {
  if (!isDevRepoMode.value && !activeRoot.value) {
    allFiles.value = []
    return
  }

  loading.value = true
  try {
    if (isDevRepoMode.value) {
      const res = await listDevFiles(currentPath.value)
      allFiles.value = res.files || []
    } else {
      const res = await listStorage(activeRoot.value.id, currentPath.value)
      allFiles.value = res.files || []
      if (res.exists === false) {
        ElMessage.warning(t('files.message.error.not_found'))
      }
    }
  } catch (e) {
    allFiles.value = []
    const status = e.response?.status
    const detail = getErrorDetail(e)
    if (status === 404 && detail === 'unknown_root') {
      ElMessage.error(t('files.message.error.unknown_root'))
    } else if (status === 404) {
      ElMessage.error(t('files.message.error.not_found'))
    } else if (status === 403) {
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

const handleEntryClick = (row) => {
  if (row.virtual) {
    virtualPath.value = [...virtualPath.value, row.name]
    currentPath.value = ''
    clearUploadFiles()
    fetchFiles()
    return
  }

  if (row.is_dir) {
    currentPath.value = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
    clearUploadFiles()
    fetchFiles()
    return
  }

  previewFile(row.name)
}

const goToPath = (idx) => {
  if (isDevRepoMode.value) {
    currentPath.value = idx <= 0 ? '' : pathParts.value.slice(1, idx + 1).join('/')
  } else if (idx <= 0) {
    virtualPath.value = []
    currentPath.value = ''
  } else {
    const virtualLength = virtualPath.value.length
    if (idx <= virtualLength) {
      virtualPath.value = virtualPath.value.slice(0, idx)
      currentPath.value = ''
    } else {
      currentPath.value = currentPath.value
        .split('/')
        .slice(0, idx - virtualLength)
        .join('/')
    }
  }

  clearUploadFiles()
  fetchFiles()
}

const handleUploadError = (err) => {
  if (err.status === 413) {
    ElMessage.error(t('files.message.upload.error.too_large'))
  } else if (err.status === 404) {
    ElMessage.error(t('files.message.error.unknown_root'))
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
}

const toggleHiddenFiles = () => {
  showHiddenFiles.value = !showHiddenFiles.value
  currentPage.value = 1
}

const goUp = () => {
  if (isDevRepoMode.value) {
    const parts = currentPath.value.split('/').filter(Boolean)
    parts.pop()
    currentPath.value = parts.join('/')
  } else if (currentPath.value) {
    const parts = currentPath.value.split('/')
    parts.pop()
    currentPath.value = parts.join('/')
  } else if (virtualPath.value.length) {
    virtualPath.value = virtualPath.value.slice(0, -1)
    currentPath.value = ''
  }
  clearUploadFiles()
  fetchFiles()
}

const refresh = async () => {
  if (isDevRepoMode.value) {
    await fetchFiles()
    return
  }

  await loadRoots()
  if (activeRoot.value) {
    await fetchFiles()
  }
}

const createItem = async () => {
  const name = createName.value.trim()
  if (!name) {
    ElMessage.warning(t('files.message.warning.input_name'))
    return
  }

  if (IS_DEMO) {
    ElMessage.error(t('message.error.demo'))
    return
  }

  if (!isDevRepoMode.value && !activeRoot.value) {
    ElMessage.error(t('files.message.error.unknown_root'))
    return
  }

  try {
    if (isDevRepoMode.value) {
      await createDevEntry(currentPath.value, name, createType.value)
    } else {
      await createStorageEntry(activeRoot.value.id, currentPath.value, name, createType.value)
    }
    ElMessage.success(t('files.message.create.success'))
    showCreateDialog.value = false
    createName.value = ''
    fetchFiles()
  } catch (e) {
    const status = e.response?.status
    const detail = getErrorDetail(e)
    if (status === 404 && detail === 'unknown_root') {
      ElMessage.error(t('files.message.error.unknown_root'))
    } else if (status === 404) {
      ElMessage.error(t('files.message.error.not_found'))
    } else if (status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (status === 409) {
      ElMessage.error(t('files.message.create.error.exists'))
    } else if (status === 422) {
      ElMessage.error(t('files.message.warning.input_name'))
    } else if (status === 400) {
      ElMessage.error(t('files.message.create.error.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const toggleUpload = () => {
  if (!canModify.value) return
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
    case 'toml':
      return toml()
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

const openImagePreview = (blob) => {
  previewUrl.value = URL.createObjectURL(blob)
  fullscreenPreviewVisible.value = true
  showFullscreenPreviewAnim.value = false
  nextTick(() => {
    setTimeout(() => {
      showFullscreenPreviewAnim.value = true
    }, 10)
  })
}

const previewFile = async (name) => {
  const path = currentPath.value ? `${currentPath.value}/${name}` : name
  const rootId = activeRoot.value?.id

  isText.value = false
  emptyDescription.value = t('files.preview.unsupported')

  if (isDevRepoMode.value) {
    try {
      const res = await previewDevFile(path)
      const contentType = res.data.type || res.headers['content-type'] || ''

      if (contentType.startsWith('image')) {
        openImagePreview(res.data)
      } else if (contentType.startsWith('text')) {
        isText.value = true
        previewName.value = name
        previewRevision.value = ''
        previewContent.value = (await res.data.text()) || '\u200B'
        nextTick(initTextPreview)
        previewVisible.value = true
      } else {
        emptyDescription.value = t('files.preview.unsupported')
        previewVisible.value = true
      }
    } catch (e) {
      const status = e.response?.status
      if (status === 404) {
        ElMessage.error(t('files.message.error.not_found'))
      } else if (status === 403) {
        ElMessage.error(t('files.message.error.invalid_path'))
      } else if (status === 408 || status === 413) {
        emptyDescription.value = t('files.preview.too_large')
        previewVisible.value = true
      } else if (status === 400) {
        emptyDescription.value = t('files.preview.failed')
        previewVisible.value = true
      } else {
        ElMessage.error(t('message.error.fetch') + e.message)
      }
    }
    return
  }

  if (!rootId) {
    ElMessage.error(t('files.message.error.unknown_root'))
    return
  }

  try {
    const res = await readStorageContent(rootId, path)
    isText.value = true
    previewName.value = name
    previewRevision.value = res.revision || ''
    previewContent.value = res.content || '\u200B'
    nextTick(initTextPreview)
    previewVisible.value = true
    return
  } catch (e) {
    const status = e.response?.status
    const detail = getErrorDetail(e)

    // 非文本或超出内容接口限制时回退到下载接口预览。
    if (detail !== 'not_text' && detail !== 'file_too_large') {
      if (status === 404 && detail === 'unknown_root') {
        ElMessage.error(t('files.message.error.unknown_root'))
      } else if (status === 404) {
        ElMessage.error(t('files.message.error.not_found'))
      } else if (status === 403) {
        ElMessage.error(t('files.message.error.invalid_path'))
      } else if (status === 400) {
        emptyDescription.value = t('files.preview.failed')
        previewVisible.value = true
      } else {
        ElMessage.error(t('message.error.fetch') + e.message)
      }
      return
    }
  }

  try {
    const res = await downloadStorageEntry(rootId, path, true)
    const contentType = res.data.type || res.headers['content-type'] || ''

    if (contentType.startsWith('image')) {
      openImagePreview(res.data)
    } else if (contentType.startsWith('text')) {
      isText.value = true
      previewName.value = name
      previewRevision.value = ''
      previewContent.value = (await res.data.text()) || '\u200B'
      nextTick(initTextPreview)
      previewVisible.value = true
    } else {
      emptyDescription.value = t('files.preview.unsupported')
      previewVisible.value = true
    }
  } catch (e) {
    if (e.response?.status === 404) {
      ElMessage.error(t('files.message.error.not_found'))
    } else if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (e.response?.status === 413 || e.response?.status === 408) {
      emptyDescription.value = t('files.preview.too_large')
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
  previewRevision.value = ''
  isText.value = true
  previewUrl.value = ''
}

const saveFile = async () => {
  if (!editorView.value) return

  const content = editorView.value.state.doc.toString()
  const path = currentPath.value ? `${currentPath.value}/${previewName.value}` : previewName.value

  if (isDevRepoMode.value) {
    try {
      await uploadDevFile(
        currentPath.value,
        new File([content], previewName.value, { type: 'text/plain' }),
      )
      ElMessage.success(t('files.message.save.success'))
      closePreview()
      fetchFiles()
    } catch (e) {
      const status = e.response?.status
      if (status === 413) {
        ElMessage.error(t('files.message.save.error.too_large'))
      } else if (status === 403) {
        ElMessage.error(t('files.message.error.invalid_path'))
      } else if (status === 400) {
        ElMessage.error(t('files.message.save.error.failed'))
      } else {
        ElMessage.error(t('message.error.fetch') + e.message)
      }
    }
    return
  }

  const rootId = activeRoot.value?.id
  if (!rootId) {
    ElMessage.error(t('files.message.error.unknown_root'))
    return
  }

  try {
    const res = await writeStorageContent(rootId, path, content, previewRevision.value || undefined)
    previewRevision.value = res.entry?.revision || ''
    ElMessage.success(t('files.message.save.success'))
    closePreview()
    fetchFiles()
  } catch (e) {
    const status = e.response?.status
    const detail = getErrorDetail(e)
    if (status === 409) {
      try {
        await ElMessageBox.confirm(t('files.message.save.error.conflict'), t('files.title.edit'), {
          confirmButtonText: t('button.refresh'),
          cancelButtonText: t('button.cancel'),
          type: 'warning',
        })
        const latest = await readStorageContent(rootId, path)
        previewRevision.value = latest.revision || ''
        previewContent.value = latest.content || '\u200B'
      } catch {
        // 用户取消时保留当前编辑内容并提示冲突
        ElMessage.warning(t('files.message.save.error.conflict'))
      }
    } else if (status === 413) {
      ElMessage.error(t('files.message.save.error.too_large'))
    } else if (status === 404 && detail === 'unknown_root') {
      ElMessage.error(t('files.message.error.unknown_root'))
    } else if (status === 400) {
      ElMessage.error(t('files.message.save.error.failed'))
    } else if (status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const handleBeforeUpload = async (file) => {
  if (IS_DEMO) {
    ElMessage.error(t('message.error.demo'))
    return false
  }

  if (!canModify.value) {
    ElMessage.error(t('files.message.error.unknown_root'))
    return false
  }

  const exists = allFiles.value.some((f) => !f.is_dir && f.name === file.name)
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

    if (!canModify.value) {
      ElMessage.error(t('files.message.error.unknown_root'))
      return
    }

    const path = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
    if (isDevRepoMode.value) {
      await renameDevEntry(path, newName.trim())
    } else {
      await renameStorageEntry(activeRoot.value.id, path, newName.trim())
    }

    fetchFiles()
    ElMessage.success(t('files.message.rename.success'))
  } catch (e) {
    if (e === 'cancel' || e === 'close') {
      return
    }
    const status = e.response?.status
    const detail = getErrorDetail(e)
    if (status === 404 && detail === 'unknown_root') {
      ElMessage.error(t('files.message.error.unknown_root'))
    } else if (status === 409) {
      ElMessage.error(t('files.message.rename.error.exists'))
    } else if (status === 404) {
      ElMessage.error(t('files.message.rename.error.not_found'))
    } else if (status === 422) {
      ElMessage.warning(t('files.message.warning.input_new_name'))
    } else if (status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (status === 400) {
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

    if (!canModify.value) {
      ElMessage.error(t('files.message.error.unknown_root'))
      return
    }

    const path = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
    if (isDevRepoMode.value) {
      await deleteDevEntry(path)
    } else {
      await deleteStorageEntry(
        activeRoot.value.id,
        path,
        row.is_dir ? undefined : row.revision || undefined,
      )
    }

    fetchFiles()
    ElMessage.success(t('files.message.delete.success'))
  } catch (e) {
    if (e === 'cancel' || e === 'close') {
      return
    }
    const status = e.response?.status
    const detail = getErrorDetail(e)
    if (status === 404 && detail === 'unknown_root') {
      ElMessage.error(t('files.message.error.unknown_root'))
    } else if (status === 404) {
      ElMessage.error(t('files.message.delete.error.not_found'))
    } else if (status === 409) {
      ElMessage.error(t('files.message.delete.error.conflict'))
    } else if (status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else if (status === 400) {
      ElMessage.error(t('files.message.delete.error.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

const download = async (row) => {
  if (!canModify.value) {
    ElMessage.error(t('files.message.error.unknown_root'))
    return
  }

  const path = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
  try {
    const res = isDevRepoMode.value
      ? await downloadDevEntry(path)
      : await downloadStorageEntry(activeRoot.value.id, path, false)
    const url = URL.createObjectURL(res.data)
    const a_ = document.createElement('a')
    a_.href = url
    a_.download = row.is_dir ? `${row.name}.zip` : row.name
    document.body.appendChild(a_)
    a_.click()
    document.body.removeChild(a_)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch (e) {
    if (e.response?.status === 404) {
      ElMessage.error(t('files.message.error.not_found'))
    } else if (e.response?.status === 403) {
      ElMessage.error(t('files.message.error.invalid_path'))
    } else {
      ElMessage.error(t('message.error.fetch') + e.message)
    }
  }
}

onMounted(async () => {
  devMode.value = isModuleScope.value ? true : await getIsDevelopMode()

  if (isDevRepoMode.value) {
    rootsLoading.value = false
    await fetchFiles()
  } else {
    await loadRoots()
    await fetchFiles()
  }
  window.addEventListener('resize', updateFullscreenLeft)
  window.addEventListener('resize', updatePreviewTextDialogWidth)
  updateFullscreenLeft()
  updatePreviewTextDialogWidth()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateFullscreenLeft)
  window.removeEventListener('resize', updatePreviewTextDialogWidth)
})

watch([virtualPath, currentPath], () => {
  currentPage.value = 1
  showUpload.value = false
  nextTick(() => {
    scrollBreadcrumbToEnd()
  })
})

watch(totalFiles, () => {
  const maxPage = Math.max(1, Math.ceil(totalFiles.value / pageSize.value))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
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
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
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
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
}

.files-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.file-name {
  cursor: pointer;
  color: var(--el-text-color-primary);
}

.file-name-hidden {
  color: var(--el-text-color-secondary);
}

.files-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.file-manager-embedded .files-card {
  margin-bottom: 0;
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
  z-index: 3000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-preview.show {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.85);
}

.fullscreen-image {
  max-width: 85vw;
  max-height: 78vh;
  display: block;
  transform: scale(0.8);
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  opacity: 0;
}

.fullscreen-close {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  transition: background 0.2s;
}

.fullscreen-close:hover {
  background: rgba(255, 255, 255, 0.32);
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
