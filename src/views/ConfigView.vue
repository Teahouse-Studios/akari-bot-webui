<template>
  <div class="editor-container">
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
        <el-button type="success" @click="applyConfig">
          <i class="mdi mdi-content-save-outline"></i> 应用
        </el-button>
      </div>
</div>
  </div>
</template>

<script>
import axios from '@/axios';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';

export default {
  name: 'ConfigView',
  data() {
    return {
      activeTab: 'pipeline.toml',
      configFiles: ['command.toml', 'pipeline.toml', 'platform.toml', 'provider.toml', 'system.toml'],
      editorContent: '',
      editorView: null,
      editorOptions: {
        lineWrapping: true, // 自动换行
        theme: oneDark, // 使用 oneDark 主题
        lineNumbers: true, // 显示行号
        scrollbarStyle: 'native', // 使用原生滚动条
      }
    };
  },
  methods: {
    handleTabClick(tab) {
      this.fetchConfig(tab.name);
    },
    fetchConfig(fileName) {
      axios.get(`/api/config/${fileName}`)
        .then(response => {
          this.editorContent = response.data;
          this.updateEditorContent();
        })
        .catch(() => {
          this.$message.error('请求失败，请稍后再试');
        });
    },
    resetConfig() {
      this.fetchConfig(this.activeTab);
    },
    applyConfig() {
      axios.post(`/api/config/${this.activeTab}`, { raw: this.editorContent })
        .then(() => {
          this.$message.success('配置已成功更新！');
        })
        .catch(() => {
          this.$message.error('应用配置失败，请稍后再试');
        });
    },
    updateEditorContent() {
      if (this.editorView) {
        this.editorView.dispatch({ changes: { from: 0, to: this.editorView.state.doc.length, insert: this.editorContent } });
      }
    }
  },
  mounted() {
    this.fetchConfig(this.activeTab);
    const state = EditorState.create({
      doc: this.editorContent,
      extensions: [javascript(), basicSetup, oneDark]
    });
    this.editorView = new EditorView({
      state,
      parent: this.$refs.editor
    });
  }
};
</script>

<style scoped>
.el-tabs ::v-deep(.el-tabs__item) {
  color: #333;
}

body.dark-mode .el-tabs ::v-deep(.el-tabs__item) {
  color: white;
}

.el-tabs ::v-deep(.el-tabs__item.is-active) {
  color: #0091ff;
}

body.dark-mode .el-tabs ::v-deep(.el-tabs__item.is-active) {
  color: #0091ff;
}

.el-tabs ::v-deep(.el-tabs__active-bar) {
  background-color: #0091ff;
}

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
  position: relative; /* 为了确保 CodeMirror 编辑器可以填充容器 */
}

.editor-footer {
  display: flex;
  justify-content: flex-start;
  padding-top: 16px;
  flex-wrap: nowrap;
}

.el-button-group {
  display: flex;
  white-space: nowrap;
}

.el-button {
  border-color: #e0e0e0;

}

body.dark-mode .el-button {
  border-color: #4d4d4d;

}
/*
.el-button--default {
  background-color: white;
  color: #333;
  border-color: #e0e0e0;

}

.el-button--default:hover {
  background-color: #ddd;
  color: #333;
  border-color: #e0e0e0;
}

body.dark-mode .el-button--default {
  background-color: #2e2e2e;
  color: white;
  border-color: #4d4d4d;
}

body.dark-mode .el-button--default:hover {
  background-color: #666;
  color: white;
  border-color: #4d4d4d;
}

.el-button--primary {
  background-color: #0091ff;
  color: white;
  border-color: #e0e0e0;
}

.el-button--primary:hover {
  background-color: #66bbff;
  color: white;
  border-color: #e0e0e0;
}
*/
</style>
