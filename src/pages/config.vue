<template>
  <div class="editor-container" v-loading="loading">
    <el-button-group class="active-button-group">
      <el-button
        :type="activeCard === 'visible' ? 'primary' : 'default'"
        @click="activeCard = 'visible'"
        ><i class="mdi mdi-text-box-edit-outline"></i
      ></el-button>
      <el-button
        :type="activeCard === 'source' ? 'primary' : 'default'"
        @click="activeCard = 'source'"
        ><i class="mdi mdi-code-brackets"></i
      ></el-button>
    </el-button-group>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane v-for="file in configFiles" :key="file" :label="file" :name="file"></el-tab-pane>
    </el-tabs>
    <VisibleEditor v-if="activeCard === 'visible'" ref="visibleEditor" v-model="editorContent" />

    <SourceEditor v-else ref="sourceEditor" v-model="editorContent" />
    <div class="editor-footer">
      <div class="editor-actions">
        <el-button type="warning" :disabled="!unsavedChanges" @click="resetConfig">
          <i class="mdi mdi-restart"></i> {{ $t('button.reset') }}
        </el-button>
        <el-button type="success" :disabled="!unsavedChanges" @click="applyConfig">
          <i class="mdi mdi-content-save-outline"></i> {{ $t('button.apply') }}
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
  </div>
</template>

<script>
import { ref } from 'vue'
import axios from '@/axios.mjs'
import VisibleEditor from '@/components/config/VisibleEditor.vue'
import SourceEditor from '@/components/config/SourceEditor.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { IS_DEMO } from '@/const'

export default {
  name: 'ConfigPage',
  components: {
    VisibleEditor,
    SourceEditor,
  },
  data() {
    const { t } = useI18n()
    const activeCard = ref('visible')

    return {
      activeCard,
      activeTab: '',
      configFiles: [],
      unsavedChanges: false,
      initialContent: '',
      editorContent: '',
      fileContents: {},
      abortController: new AbortController(),
      loading: false,
      t,
    }
  },
  mounted() {
    this.fetchConfigFiles()
  },
  beforeUnmount() {
    this.abortController.abort()
  },
  watch: {
    editorContent(newVal) {
      this.unsavedChanges = newVal !== this.initialContent
    },
  },
  methods: {
    async fetchConfigFiles() {
      this.loading = true
      try {
        const response = await axios.get('/api/config', {
          signal: this.abortController.signal,
        })
        this.configFiles = response.data.cfg_files
        if (this.configFiles.length > 0) {
          this.activeTab = this.configFiles[0]
          this.fetchConfig(this.activeTab)
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled')
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async fetchConfig(fileName, force = false) {
      if (!force && this.fileContents[fileName]) {
        this.editorContent = this.fileContents[fileName]
        this.initialContent = this.fileContents[fileName]
        this.unsavedChanges = false
        this.updateEditorContent()
        return
      }

      try {
        const response = await axios.get(`/api/config/${fileName}`, {
          signal: this.abortController.signal,
        })
        this.fileContents[fileName] = response.data.content
        this.editorContent = response.data.content
        this.initialContent = response.data.content
        this.unsavedChanges = false
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled')
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      }
    },
    updateEditorContent() {
      if (this.editorView) {
        this.editorView.dispatch({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: this.editorContent,
          },
        })
      }
    },
    handleTabClick(pane) {
      this.fetchConfig(pane.paneName)
    },
    resetConfig() {
      this.fetchConfig(this.activeTab, true)
      this.unsavedChanges = false
    },
    async applyConfig() {
      try {
        await axios.post(`/api/config/${this.activeTab}/edit`, {
          content: this.editorContent,
        })
        ElMessage.success(this.t('config.message.save.success'))
        this.unsavedChanges = false
      } catch (error) {
        if (error.response?.status === 403 && IS_DEMO) {
          ElMessage.error(this.t('message.error.demo'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      }
    },
  },
}
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

@media (max-width: 399px) {
  .editor-footer {
    display: wrap;
  }

  .editor-actions {
    flex-wrap: wrap;
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
