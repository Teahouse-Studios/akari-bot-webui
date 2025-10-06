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

<script>
import axios from '@/axios.mjs'
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
import { useI18n } from 'vue-i18n'
import notFound from './notFound.vue'

export default {
  name: 'FilesPage',
  components: {
    notFound,
  },
  data() {
    const { t } = useI18n()
    return {
      loading: false,
      currentPath: '',
      files: [],
      showHiddenFiles: false,
      currentPage: 1,
      pageSize: 10,
      totalFiles: 0,
      showCreateDialog: false,
      createType: 'dir',
      createName: '',
      showUpload: false,
      previewUrl: '',
      previewContent: '',
      previewName: '',
      previewTextDialogWidth: '90%',
      fullscreenPreviewVisible: false,
      showFullscreenPreviewAnim: false,
      isText: false,
      emptyDescription: t('files.preview.unsupported'),
      editorView: null,
      previewVisible: false,
      uploadUrl: '/api/files/upload',
      isDevelopMode: localStorage.getItem('isDevelopMode') === 'true',
      t,
    }
  },
  computed: {
    pathParts() {
      const fullPath = this.currentPath ? `./${this.currentPath}` : '.'
      return fullPath.split('/')
    },
    isRoot() {
      return !this.currentPath || this.currentPath === '.'
    },
    fullscreenImageStyle() {
      if (!this.previewUrl) return {}
      return {
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'block',
        margin: 'auto',
      }
    },
    uploadHeaders() {
      const token = localStorage.getItem('token')
      return {
        Authorization: `Bearer ${token}`,
      }
    },
  },
  watch: {
    currentPath() {
      this.showUpload = false
      this.$nextTick(() => {
        this.scrollBreadcrumbToEnd()
      })
    },
    previewContent(newVal) {
      if (this.editorView && this.editorView.state.doc.toString() !== newVal) {
        this.editorView.dispatch({
          changes: { from: 0, to: this.editorView.state.doc.length, insert: newVal },
        })
      }
    },
    fullscreenPreviewVisible(val) {
      if (val) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    },
  },
  methods: {
    async fetchFiles() {
      this.loading = true
      try {
        const res = await axios.get('/api/files/list', {
          params: { path: this.currentPath },
        })
        this.allFiles = res.data.files || []
        this.updateFiles()
      } catch (e) {
        if (e.response?.status === 403) {
          ElMessage.error(this.t('files.message.error.invalid_path'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + e.message)
        }
      } finally {
        this.loading = false
      }
    },

    scrollBreadcrumbToEnd() {
      const wrapper = this.$refs.breadcrumbWrapper
      if (wrapper) {
        wrapper.scrollLeft = wrapper.scrollWidth
      }
    },

    goToPath(idx) {
      const parts = this.pathParts.slice(1, idx + 1)
      const newPath = parts.join('/')

      this.currentPath = newPath
      this.fetchFiles()
    },

    updateFiles() {
      const filtered = this.showHiddenFiles
        ? this.allFiles
        : this.allFiles.filter((f) => !f.name.startsWith('.'))

      this.totalFiles = filtered.length

      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize

      this.files = filtered.slice(start, end)
    },

    handleUploadError(err, _file, _fileList) {
      if (err.status === 413) {
        ElMessage.error(this.t('files.message.upload.error.too_large'))
      } else if (err.status === 403) {
        ElMessage.error(this.t('files.message.error.invalid_path'))
      } else {
        ElMessage.error(this.t('message.error.fetch') + err.responseText)
      }
    },

    formatSize(row) {
      const size = row.size
      if (row.is_dir) return '--'
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    },

    formatDate(row) {
      if (!row.modified) return ''
      const date = new Date(row.modified)
      const pad = (n) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },

    handlePageChange(page) {
      this.currentPage = page
      this.fetchFiles()
    },

    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchFiles()
    },

    toggleHiddenFiles() {
      this.showHiddenFiles = !this.showHiddenFiles
      this.currentPage = 1
      this.updateFiles()
    },

    openDir(name) {
      this.currentPath = this.currentPath ? `${this.currentPath}/${name}` : name
      this.fetchFiles()
    },

    goUp() {
      const parts = this.currentPath.split('/')
      parts.pop()
      this.currentPath = parts.join('/')
      this.fetchFiles()
    },

    refresh() {
      this.fetchFiles()
    },

    async createItem() {
      if (!this.createName) {
        ElMessage.warning(this.t('files.message.warning.input_name'))
        return
      }

      try {
        await axios.post('/api/files/create', null, {
          params: {
            path: this.currentPath,
            name: this.createName,
            filetype: this.createType,
          },
          headers: this.uploadHeaders,
        })
        ElMessage.success(this.t('files.message.create.success'))
        this.showCreateDialog = false
        this.createName = ''
        this.fetchFiles()
      } catch (e) {
        if (e.response?.status === 403) {
          ElMessage.error(this.t('files.message.error.invalid_path'))
        } else if (e.response?.status === 400) {
          ElMessage.error(this.t('files.message.create.error.failed'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + e.message)
        }
      }
    },

    toggleUpload() {
      this.showUpload = !this.showUpload
    },

    updatePreviewTextDialogWidth() {
      const screenWidth = window.innerWidth
      if (screenWidth < 1024) {
        this.previewTextDialogWidth = '90%'
      } else {
        const newWidth = screenWidth * 0.9 - 400
        this.previewTextDialogWidth = `${newWidth}px`
      }
    },

    getLanguageExtension(filename) {
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
    },

    initTextPreview() {
      if (!this.isText) return

      if (this.previewContent === '\u200B') {
        this.previewContent = ''
      }

      const langExt = this.getLanguageExtension(this.previewName)
      const extensions = [basicSetup, oneDark, EditorView.lineWrapping]
      if (langExt) {
        extensions.push(langExt)
      }

      if (this.editorView) {
        this.editorView.destroy()
        this.editorView = null
      }

      const state = EditorState.create({
        doc: this.previewContent,
        extensions,
      })

      this.editorView = new EditorView({
        state,
        parent: this.$refs.textEditor,
      })
    },

    async previewFile(name) {
      const path = this.currentPath ? `${this.currentPath}/${name}` : name

      this.isText = false
      this.emptyDescription = this.t('files.preview.unsupported')
      try {
        const res = await axios.get('/api/files/preview', {
          params: { path },
          responseType: 'blob',
        })

        const contentType = res.data.type || res.headers['content-type']

        if (contentType.startsWith('image')) {
          this.previewUrl = URL.createObjectURL(res.data)
          this.fullscreenPreviewVisible = true
          this.showFullscreenPreviewAnim = false
          this.$nextTick(() => {
            setTimeout(() => {
              this.showFullscreenPreviewAnim = true
            }, 10)
          })
        } else if (contentType.startsWith('text')) {
          this.isText = true
          this.previewName = name
          const text = await res.data.text()
          this.previewContent = text || '\u200B'
          this.$nextTick(this.initTextPreview)
          this.previewVisible = true
        } else {
          this.emptyDescription = this.t('files.preview.unsupported')
          this.previewVisible = true
        }
      } catch (e) {
        if (e.response?.status === 408) {
          this.emptyDescription = this.t('files.preview.too_large')
          this.previewVisible = true
        } else if (e.response?.status === 403) {
          ElMessage.error(this.t('files.message.error.invalid_path'))
        } else if (e.response?.status === 400) {
          this.emptyDescription = this.t('files.preview.failed')
          this.previewVisible = true
        } else {
          ElMessage.error(this.t('message.error.fetch') + e.message)
        }
      }
    },

    closeFullscreenPreview() {
      const imgEl = this.$refs.fullscreenImage
      const wrapper = document.querySelector('.fullscreen-preview')

      if (imgEl && wrapper) {
        this.showFullscreenPreviewAnim = false
        setTimeout(() => {
          this.fullscreenPreviewVisible = false
          this.previewUrl = ''
        }, 300)
      } else {
        this.fullscreenPreviewVisible = false
        this.previewUrl = ''
      }
    },

    updateFullscreenLeft() {
      const el = document.querySelector('.fullscreen-preview')
      if (!el) return
      el.style.left = window.innerWidth >= 1024 ? '60px' : '0'
    },

    closePreview() {
      this.previewVisible = false

      if (this.editorView) {
        this.editorView.destroy()
        this.editorView = null
      }
      this.previewContent = ''
      this.previewName = ''
      this.isText = true
      this.previewUrl = ''
    },

    async saveFile() {
      if (!this.editorView) return

      const content = this.editorView.state.doc.toString()
      const blob = new Blob([content], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', blob, this.previewName)
      formData.append('path', this.currentPath)

      try {
        await axios.post(this.uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...this.uploadHeaders,
          },
        })
        ElMessage.success(this.t('files.message.save.success'))
        this.previewVisible = false
        this.closePreview()
        this.fetchFiles()
      } catch (e) {
        if (e.response.status === 400) {
          ElMessage.error(this.t('files.message.save.error.failed'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + e.message)
        }
      }
    },

    async handleBeforeUpload(file) {
      const exists = this.files.some((f) => !f.is_dir && f.name === file.name)
      if (exists) {
        try {
          await ElMessageBox.confirm(
            this.t('files.confirm.file_exists', { name: file.name }),
            this.t('files.title.file_exists'),
            {
              confirmButtonText: this.t('files.button.replace'),
              cancelButtonText: this.t('button.cancel'),
              type: 'warning',
            },
          )
          return true
        } catch {
          return false
        }
      }
      return true
    },

    async rename(row) {
      try {
        const { value: newName } = await ElMessageBox.prompt('', this.t('files.title.rename'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          inputValue: row.name,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm' && !instance.inputValue.trim()) {
              ElMessage.warning(this.t('files.message.warning.input_new_name'))
              return
            }
            done()
          },
        })

        const path = this.currentPath ? `${this.currentPath}/${row.name}` : row.name

        await axios.post('/api/files/rename', {
          path,
          new_name: newName,
        })

        this.fetchFiles()
        ElMessage.success(this.t('files.message.rename.success'))
      } catch (e) {
        if (e === 'cancel') {
          return
        }
        if (e.response?.status === 409) {
          ElMessage.error(this.t('files.message.rename.error.exists'))
        } else if (e.response?.status === 404) {
          ElMessage.error(this.t('files.message.rename.error.not_found'))
        } else if (e.response?.status === 403) {
          ElMessage.error(this.t('files.message.error.invalid_path'))
        } else if (e.response?.status === 400) {
          ElMessage.error(this.t('files.message.rename.error.failed'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + e.message)
        }
      }
    },

    async remove(row) {
      try {
        await ElMessageBox.confirm(this.t('files.confirm.delete'), this.t('files.title.delete'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        })

        const path = this.currentPath ? `${this.currentPath}/${row.name}` : row.name

        await axios.delete('/api/files/delete', { params: { path } })

        this.fetchFiles()
        ElMessage.success(this.t('files.message.delete.success'))
      } catch (e) {
        if (e === 'cancel') {
          return
        }
        if (e.response?.status === 404) {
          ElMessage.error(this.t('files.message.delete.error.not_found'))
        } else if (e.response?.status === 403) {
          ElMessage.error(this.t('files.message.error.invalid_path'))
        } else if (e.response?.status === 400) {
          ElMessage.error(this.t('files.message.delete.error.failed'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + e.message)
        }
      }
    },

    async download(row) {
      const path = this.currentPath ? `${this.currentPath}/${row.name}` : row.name
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
    },
  },

  mounted() {
    this.fetchFiles()
    window.addEventListener('resize', this.updateFullscreenLeft)
    window.addEventListener('resize', this.updatePreviewTextDialogWidth)
    this.updateFullscreenLeft()
    this.updatePreviewTextDialogWidth()
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.updateFullscreenLeft)
    window.removeEventListener('resize', this.updatePreviewTextDialogWidth)
  },
}
</script>

<style scoped>
.breadcrumb-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 允许换行 */
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
