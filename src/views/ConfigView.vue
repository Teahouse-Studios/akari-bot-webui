<template>
  <div class="editor-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane v-for="file in configFiles" :key="file" :label="file" :name="file"></el-tab-pane>
    </el-tabs>

    <div class="editor-header">
      <!--
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
      -->
      <div class="editor-actions">
        <el-button type="warning" @click="resetConfig">
          <i class="mdi mdi-restart"></i> 重置
        </el-button>
        <el-button type="success" @click="applyConfig">
          <i class="mdi mdi-content-save-outline"></i> 应用
        </el-button>
      </div>
    </div>

    <div class="editor-body">
      <div ref="editor" class="editor"></div>
    </div>
  </div>
</template>

<script>
import axios from '@/axios';
import { onMounted, ref, watch } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';

export default {
  name: 'ConfigView',
  data() {
    return {
      activeTab: 'pipeline.json',
      configFiles: ['command.json', 'pipeline.json', 'platform.json', 'provider.json', 'system.json'],
      configSections: [],
      editorContent: '',
      editorInstance: null,
    };
  },
  methods: {
    handleTabClick(tab) {
      this.fetchConfig(tab.name);
    },
    fetchConfig(fileName) {
      axios.get(`/api/config/${fileName}`)
        .then(response => {
          const data = response.data;
          this.editorContent = data;
          this.updateEditorContent();
        })
        .catch(error => {
          this.$message.error('请求失败，请稍后再试');
        });
    },
    resetConfig() {
      this.fetchConfig(this.activeTab);
    },
    applyConfig() {
      const payload = {
        raw: this.editorContent, // 获取编辑器中的内容
      };


      axios.post(`/api/config/${this.activeTab}`, payload)
        .then(() => {
          this.$message.success('配置已成功更新！');
        })
        .catch(error => {
          this.$message.error('应用配置失败，请稍后再试');
        });
    },
    buildPayload() {},
  },
  mounted() {
    this.fetchConfig(this.activeTab);
  },
};
</script>

<style scoped>

.el-tabs ::v-deep .el-tabs__item {
  color: #333;
}

body.dark-mode .el-tabs ::v-deep .el-tabs__item {
  color: white;
}

.el-tabs ::v-deep .el-tabs__item.is-active {
  color: #0091ff;
}

body.dark-mode .el-tabs ::v-deep .el-tabs__item.is-active {
  color: #0091ff;
}

.el-tabs ::v-deep .el-tabs__active-bar {
  background-color: #0091ff;
}


.el-tabs {
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 10px;
}

.editor-container {
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 560px;  /* 让容器充满窗口 */
}

body.dark-mode .editor-container {
  color: white;
}

.editor-header {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  padding-top: 0;
  gap: 20px;
  flex-wrap: nowrap;
}

.el-button-group {
  display: flex;
  white-space: nowrap;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-body {
  padding-left: 16px;
  padding-right: 16px;
  flex-grow: 1;  /* 让编辑器主体部分填充剩余空间 */
  overflow: hidden;  /* 内容溢出时可以滚动 */
}

.editor {
  height: 100%;
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
