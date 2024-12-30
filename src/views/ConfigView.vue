<template>
  <div class="editor-container">
    <h1>配置</h1>
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane v-for="file in configFiles" :key="file" :label="file" :name="file"></el-tab-pane>
    </el-tabs>
      <!--
    <div class="editor-header">

      <el-button-group>
        <el-button
          :type="editorMode === 'tab' ? 'primary' : 'default'"
          @click="switchEditorMode('tab')"
        >
          <i class="mdi mdi-view-dashboard-edit-outline"></i>
        </el-button>
        <el-button
          :type="editorMode === 'source' ? 'primary' : 'default'"
          @click="switchEditorMode('source')"
        >
          <i class="mdi mdi-code-block-brackets"></i>
        </el-button>
      </el-button-group>

    </div>
      -->
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
          <i class="mdi mdi-restart"></i> 重置
        </el-button>
        <el-button type="success"
          @click="confirmApplyConfig">
          <i class="mdi mdi-content-save-outline"></i> 应用
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/axios';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { ElMessageBox } from 'element-plus'; // 引入 MessageBox

export default {
  name: 'ConfigView',
  data() {
    return {
      activeTab: '',
      configFiles: [],
      editorContent: '',
      editorView: null,
      editorOptions: {
        lineWrapping: true,
        theme: oneDark,
        lineNumbers: true,
        scrollbarStyle: 'native',
      },
      fileContents: {},
    };
  },
  methods: {
    async fetchConfigFiles() {
      try {
        const response = await axios.get('/config');
        this.configFiles = response.data.cfg_files;
        if (this.configFiles.length > 0) {
          this.activeTab = this.configFiles[0];
          this.fetchConfig(this.activeTab);
        }
      } catch (error) {
        this.$message.error('无法获取配置文件列表，请稍后再试');
      }
    },
    async fetchConfig(fileName, force = false) {
      if (!force && this.fileContents[fileName]) {
        this.editorContent = this.fileContents[fileName];
        this.updateEditorContent();
        return;
      }

      try {
        const response = await axios.get(`/config/${fileName}`);
        this.fileContents[fileName] = response.data.content;
        this.editorContent = response.data.content;
        this.updateEditorContent();
      } catch (error) {
        this.$message.error('请求失败，请稍后再试');
      }
    },
    resetConfig() {
      this.fetchConfig(this.activeTab, true);
    },
    confirmApplyConfig() {
      ElMessageBox.confirm(
        '是否更新配置？错误的配置可能会导致机器人无法正常工作。',
        '确认',
        {
          confirmButtonText: '应用',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        this.applyConfig();
      }).catch(() => {
      });
    },
    applyConfig() {
      axios.post(`/config/${this.activeTab}`, { content: this.editorContent })
        .then(() => {
          this.$message.success('配置更新成功');
        })
        .catch(() => {
          this.$message.error('配置更新失败，请稍后再试');
        });
    },
    updateEditorContent() {
      if (this.editorView) {
        this.editorView.dispatch({ changes: { from: 0, to: this.editorView.state.doc.length, insert: this.editorContent } });
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
    }
  },
  mounted() {
    this.fetchConfigFiles();

    // 初始化 CodeMirror 编辑器
    const state = EditorState.create({
      doc: this.editorContent,
      extensions: [
      basicSetup,
      oneDark,
      EditorView.updateListener.of(this.handleEditorChange)]
    });

    this.editorView = new EditorView({
      state,
      parent: this.$refs.editor
    });
  }
};
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
}

body.dark-mode .editor-container {
  color: white;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-body {
  flex-grow: 1;
  height: 50vh;
  overflow: auto;
}

::v-deep(.cm-editor) {
  height: 50vh;
}

.codemirror-container {
  height: 50vh;
  position: relative;
}

.editor-footer {
  display: flex;
  justify-content: flex-start;
  padding-top: 16px;
  flex-wrap: nowrap;
}
</style>
