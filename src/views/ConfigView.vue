<template>
  <div class="editor-container" v-loading="loading">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane
        v-for="file in configFiles"
        :key="file"
        :label="file"
        :name="file"
      ></el-tab-pane>
    </el-tabs>
    <div class="editor-body">
      <codemirror
        ref="editor"
        v-model="editorContent"
        :options="editorOptions"
      ></codemirror>
    </div>
    <div class="editor-footer">
      <div class="editor-actions">
        <el-button type="warning" @click="resetConfig">
          <i class="mdi mdi-restart"></i> {{ $t("config.button.reset") }}
        </el-button>
        <el-button type="success" @click="applyConfig">
          <i class="mdi mdi-content-save-outline"></i> {{ $t("config.button.save") }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "@/axios";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

export default {
  name: "ConfigView",
  data() {
    const { t } = useI18n();

    return {
      activeTab: "",
      configFiles: [],
      editorContent: "",
      editorView: null,
      editorOptions: {
        lineWrapping: true,
        theme: oneDark,
        lineNumbers: true,
        scrollbarStyle: "native",
      },
      fileContents: {},
      cancelTokenSource: axios.CancelToken.source(),
      loading: false,
      t
    };
  },
  mounted() {
    this.fetchConfigFiles();

    const state = EditorState.create({
      doc: this.editorContent,
      extensions: [
        basicSetup,
        oneDark,
        EditorView.updateListener.of(this.handleEditorChange),
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: this.$refs.editor,
    });
  },
  beforeUnmount() {
    this.cancelTokenSource.cancel("Component unmounted");
  },
  methods: {
    async fetchConfigFiles() {
      this.loading = true;
      try {
        const response = await axios.get("/api/config", {
          cancelToken: this.cancelTokenSource.token,
        });
        this.configFiles = response.data.cfg_files;
        if (this.configFiles.length > 0) {
          this.activeTab = this.configFiles[0];
          this.fetchConfig(this.activeTab);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message);
        }
      } finally {
        this.loading = false;
      }
    },
    async fetchConfig(fileName, force = false) {
      if (!force && this.fileContents[fileName]) {
        this.editorContent = this.fileContents[fileName];
        this.updateEditorContent();
        return;
      }

      try {
        const response = await axios.get(`/api/config/${fileName}`, {
          cancelToken: this.cancelTokenSource.token,
        });
        this.fileContents[fileName] = response.data.content;
        this.editorContent = response.data.content;
        this.updateEditorContent();
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message);
        }
      }
    },
    resetConfig() {
      this.fetchConfig(this.activeTab, true);
    },
    async applyConfig() {
      try {
        await axios.post(`/api/config/${this.activeTab}`, { content: this.editorContent });
        ElMessage.success(this.t('config.message.save.success'));
      } catch (error) {
        ElMessage.error(this.t('message.error.fetch') + error.message);
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
        });
      }
    },
    handleTabClick(pane) {
      this.fetchConfig(pane.paneName);
    },
    handleEditorChange(viewUpdate) {
      const newContent = viewUpdate.state.doc.toString();
      if (this.editorContent !== newContent) {
        this.editorContent = newContent;
        this.fileContents[this.activeTab] = newContent;
      }
    },
  },
};
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-body {
  flex-grow: 1;
  height: 60vh;
  overflow: auto;
  border-radius: 8px;
}

::v-deep(.cm-editor) {
  height: 100%;
}

::v-deep(.cm-gutters) {
  font-family: "Consolas", "Noto Sans Mono", "Courier New", Courier, monospace;
}

::v-deep(.cm-content) {
  font-family: "Consolas", "Noto Sans Mono", "Courier New", Courier, monospace;
}

.editor-footer {
  display: flex;
  justify-content: flex-start;
  padding-top: 16px;
  flex-wrap: nowrap;
}
</style>
