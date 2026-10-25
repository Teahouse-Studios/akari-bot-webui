<template>
  <div class="editor-container" v-loading="loading">
    <el-button-group class="active-button-group">
      <el-button
        :type="activeCard === 'visible' ? 'primary' : 'default'"
        @click="activeCard = 'visible'"
      >
        <i class="mdi mdi-text-box-edit-outline"></i>
      </el-button>
      <el-button
        :type="activeCard === 'source' ? 'primary' : 'default'"
        @click="activeCard = 'source'"
      >
        <i class="mdi mdi-code-brackets"></i>
      </el-button>
    </el-button-group>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane v-for="file in configFiles" :key="file" :label="file" :name="file"></el-tab-pane>
    </el-tabs>

    <VisibleEditor v-if="activeCard === 'visible'" ref="visibleEditor" v-model="editorContent" />
    <SourceEditor v-else ref="sourceEditor" v-model="editorContent" />

    <div class="editor-footer">
      <div class="editor-actions">
        <el-button type="warning" :disabled="!canUndo || loading" @click="undoConfig">
          <i class="mdi mdi-undo"></i> {{ $t('button.undo') }}
        </el-button>
        <el-button type="danger" :disabled="!unsavedChanges" @click="resetConfig">
          <i class="mdi mdi-restart"></i> {{ $t('button.reset') }}
        </el-button>
        <el-button type="success" :disabled="!unsavedChanges" @click="applyConfig">
          <i class="mdi mdi-content-save-outline"></i> {{ $t('button.apply') }}
        </el-button>
        <el-button v-if="canDeleteConfig" type="danger" :disabled="loading" @click="deleteConfig">
          <i class="mdi mdi-delete-outline"></i> {{ $t('button.delete') }}
        </el-button>
        <div v-if="unsavedChanges" class="unsaved-warning">
          <el-alert
            :title="$t('config.alert.warning.unsaved')"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </div>

    <el-button
      class="refresh-button"
      circle
      size="large"
      type="primary"
      @click="refreshConfig"
      :disabled="loading"
    >
      <i class="mdi mdi-refresh"></i>
    </el-button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import axios from '@/axios.mjs'
import VisibleEditor from '@/components/config/VisibleEditor.vue'
import SourceEditor from '@/components/config/SourceEditor.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from '@/const'

const { t } = useI18n()

const PROTECTED_CONFIG_FILES = ['config.toml']

const activeCard = ref('visible')
const activeTab = ref('')
const configFiles = ref([])
const unsavedChanges = ref(false)
const initialContent = ref('')
const editorContent = ref('')
const fileContents = reactive({})
const loading = ref(false)
const abortController = new AbortController()

const UNDO_HISTORY_LIMIT = 50
const UNDO_GROUP_WINDOW = 500

const undoStack = ref([])
const canUndo = computed(() => undoStack.value.length > 0)
let lastContent = ''
let lastChangeAt = 0
let lastChangeCard = null
let isUndoing = false

const resetUndoHistory = (content = '') => {
  undoStack.value = []
  lastContent = content
  lastChangeAt = 0
  lastChangeCard = null
  isUndoing = false
}

const hasKeyValuePairs = (content) =>
  String(content || '')
    .split('\n')
    .some((raw) => {
      const line = raw.trim()
      if (!line || line.startsWith('#') || line.startsWith('[')) return false
      return line.includes('=')
    })

const canDeleteConfig = computed(
  () =>
    Boolean(activeTab.value) &&
    !PROTECTED_CONFIG_FILES.includes(activeTab.value) &&
    !hasKeyValuePairs(editorContent.value),
)

const editorView = ref(null)
const updateEditorContent = () => {
  if (editorView.value) {
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: editorView.value.state.doc.length,
        insert: editorContent.value,
      },
    })
  }
}

const fetchConfig = async (fileName, force = false) => {
  if (!force && fileContents[fileName]) {
    editorContent.value = fileContents[fileName]
    initialContent.value = fileContents[fileName]
    unsavedChanges.value = false
    resetUndoHistory(editorContent.value)
    updateEditorContent()
    return
  }

  try {
    const response = await axios.get(`/api/config/${fileName}`, {
      signal: abortController.signal,
    })
    fileContents[fileName] = response.data.content
    editorContent.value = response.data.content
    initialContent.value = response.data.content
    unsavedChanges.value = false
    resetUndoHistory(editorContent.value)
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const fetchConfigFiles = async (cfgFiles = null) => {
  loading.value = true
  try {
    let files = cfgFiles
    if (!files) {
      const response = await axios.get('/api/config', {
        signal: abortController.signal,
      })
      files = response.data.cfg_files
    }
    configFiles.value = files || []

    if (configFiles.value.length === 0) {
      activeTab.value = ''
      editorContent.value = ''
      initialContent.value = ''
      unsavedChanges.value = false
      resetUndoHistory()
      return
    }

    if (!configFiles.value.includes(activeTab.value)) {
      activeTab.value = configFiles.value[0]
    }
    fetchConfig(activeTab.value, true)
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

const handleTabClick = (pane) => {
  fetchConfig(pane.paneName)
}

const resetConfig = () => {
  fetchConfig(activeTab.value, true)
  unsavedChanges.value = false
}

const undoConfig = () => {
  if (!undoStack.value.length) return
  const previous = undoStack.value.pop()
  if (previous === editorContent.value) return
  isUndoing = true
  editorContent.value = previous
}

const applyConfig = async () => {
  try {
    await axios.put(`/api/config/${activeTab.value}`, {
      content: editorContent.value,
    })
    ElMessage.success(t('config.message.save.success'))
    resetConfig()
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const deleteConfig = async () => {
  const fileName = activeTab.value
  if (!fileName) return

  try {
    await ElMessageBox.confirm(
      t('config.confirm.delete', { file: fileName }),
      t('confirm.warning'),
      {
        confirmButtonText: t('button.confirm'),
        cancelButtonText: t('button.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const response = await axios.delete(`/api/config/${fileName}`)
    delete fileContents[fileName]
    if (response.data?.changed === false) {
      ElMessage.info(t('config.message.delete.absent'))
    } else {
      ElMessage.success(t('config.message.delete.success'))
    }
    await fetchConfigFiles(response.data?.cfg_files)
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    loading.value = false
  }
}

const refreshConfig = () => {
  if (activeTab.value) {
    fetchConfig(activeTab.value, true)
  }
}

watch(editorContent, (newVal) => {
  unsavedChanges.value = newVal !== initialContent.value

  if (isUndoing) {
    isUndoing = false
    lastContent = newVal
    lastChangeAt = 0
    lastChangeCard = null
    return
  }

  if (newVal === lastContent) return

  const now = Date.now()
  // 原始碼模式的連續輸入合併為一次復原；可視化模式則保留每次表單操作
  const shouldGroup =
    activeCard.value === 'source' &&
    lastChangeCard === 'source' &&
    now - lastChangeAt <= UNDO_GROUP_WINDOW

  if (!shouldGroup) {
    undoStack.value.push(lastContent)
    if (undoStack.value.length > UNDO_HISTORY_LIMIT) undoStack.value.shift()
  }

  lastContent = newVal
  lastChangeAt = now
  lastChangeCard = activeCard.value
})

onMounted(() => {
  fetchConfigFiles()
})

onBeforeUnmount(() => {
  abortController.abort()
})
</script>

<style scoped>
.active-button-group {
  margin-bottom: 1rem;
}

.active-button-group .el-button {
  font-size: 18px;
}

.editor-container {
  display: flex;
  flex-direction: column;
  position: relative; /* 让固定按钮相对于容器定位 */
}

.editor-footer {
  display: flex;
  justify-content: flex-start;
  padding-top: 16px;
  flex-wrap: nowrap;
}

.editor-actions {
  display: flex;
  align-items: center;
}

.unsaved-warning {
  margin-left: 16px;
}

.refresh-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-size: 22px !important;
}

@media (max-width: 576px) {
  .editor-footer {
    flex-wrap: wrap;
  }

  .editor-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .editor-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  .unsaved-warning {
    margin-top: 12px;
    margin-left: 0;
  }
}

::v-deep(.unsaved-warning .el-alert__title) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-actions .el-button i {
  margin-right: 8px;
}
</style>
