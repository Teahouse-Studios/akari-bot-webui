<template>
  <div>
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        v-for="(p, idx) in pathParts"
        :key="idx"
      >
        {{ p }}
      </el-breadcrumb-item>
    </el-breadcrumb>

      <div class="operation-button-container">
      <el-tooltip content="返回上一级" placement="bottom" v-if="!isRoot">
        <el-button
          class="icon-button"
          type="primary"
          @click="goUp"
          :disabled="loading">
          <i class="mdi mdi-arrow-left-top"></i>
        </el-button>
      </el-tooltip>

      <el-tooltip content="刷新" placement="bottom">
        <el-button
          class="icon-button"
          type="primary"
          @click="refresh"
          :disabled="loading">
          <i class="mdi mdi-refresh"></i>
        </el-button>
      </el-tooltip>

      <el-tooltip content="新建" placement="bottom">
        <el-button
          class="icon-button"
          type="primary"
          @click="showCreateDialog = true"
          :disabled="loading">
          <i class="mdi mdi-plus"></i>
        </el-button>
      </el-tooltip>

      <el-tooltip content="上传" placement="bottom">
        <el-button
          class="icon-button"
          type="primary"
          @click="toggleUpload"
          :disabled="loading">
          <i class="mdi mdi-upload"></i>
        </el-button>
      </el-tooltip>
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
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">拖拽文件或目录到这里，或 <em>点击上传</em></div>
      </el-upload>
    </div>
    </el-collapse-transition>

    <div style="margin-bottom: 15px">
      <el-button type="info" size="small" @click="toggleHiddenFiles">
        <i :class="showHiddenFiles ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
        {{ showHiddenFiles ? "隐藏文件" : "显示文件" }}
      </el-button>
    </div>
    <el-table
      :data="files"
      style="width: 100%"
      stripe
      v-loading="loading">
    <el-table-column
        prop="name"
        label="名称"
        min-width="240"
        sortable
    >
        <template #default="{ row }">
        <i :class="row.is_dir ? 'mdi mdi-folder-outline' : 'mdi mdi-file-outline'" style="margin-right:6px"></i>
        <span
            style="cursor:pointer; color:gray"
            @click="row.is_dir ? openDir(row.name) : previewFile(row.name)"
        >
            {{ row.name }}
        </span>
        </template>
    </el-table-column>

    <el-table-column
        prop="size"
        label="大小"
        min-width="100"
        sortable
        :formatter="formatSize"
    />
    <el-table-column
        prop="modified"
        label="修改时间"
        min-width="160"
        sortable
        :formatter="formatDate"
    />
    <el-table-column
        label="操作"
        min-width="300">
        <template #default="{ row }">
        <el-button size="small" type="info" @click="rename(row)"><i class="mdi mdi-rename"></i>重命名</el-button>
        <el-button size="small" type="primary" @click="download(row)"><i class="mdi mdi-download"></i>下载</el-button>
        <el-button size="small" type="danger" @click="remove(row)"><i class="mdi mdi-delete"></i> 删除</el-button>
        </template>
    </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-if="totalFiles> 0"
        background
        layout="prev, pager, next"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalFiles"
        style="margin-top: 20px"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="showCreateDialog" title="新建">
    <el-radio-group v-model="createType">
        <el-radio label="dir">目录</el-radio>
        <el-radio label="file">文件</el-radio>
    </el-radio-group>
    <el-input v-model="createName" placeholder="请输入名称" style="margin-top:10px; margin-bottom: 10px;"></el-input>
    <span slot="footer" class="dialog-footer">
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createItem">确定</el-button>
    </span>
    </el-dialog>

    <div 
      v-if="fullscreenPreviewVisible" 
      class="fullscreen-preview" 
      @click="closeFullscreenPreview"
      :class="{ 'show': showFullscreenPreviewAnim }"
    >
      <img 
        :src="previewUrl" 
        class="fullscreen-image"
        @click.stop
        ref="fullscreenImage"
      />
    </div>

    <el-dialog
      v-model="previewVisible"
      title="编辑文件"
      v-if="isText"
      :before-close="closePreview"
    >
      <div>
        <div ref="textEditor" class="editor-body"></div>
        <span slot="footer">
          <el-button @click="closePreview">取消</el-button>
          <el-button type="primary" @click="saveFile">保存</el-button>
        </span>
      </div>
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      v-else
      :show-close="false"
    >
      <el-empty 
        :description="emptyDescription"
      />
    </el-dialog>
  </div>
</template>

<script>
import axios from "@/axios.mjs";
import { ElMessageBox, ElMessage } from 'element-plus'
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from "@codemirror/lang-html"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { python } from "@codemirror/lang-python"
import { yaml } from "@codemirror/lang-yaml"
import { oneDark } from '@codemirror/theme-one-dark'
import { useI18n } from 'vue-i18n'

export default {
  name: "FilesPage",
  data() {
    const { t } = useI18n()
    return {
      loading: false,
      currentPath: "",
      isRoot: true,
      files: [],
      showHiddenFiles: false,
      currentPage: 1,
      pageSize: 20,
      totalFiles: 0,
    showCreateDialog: false,
    createType: "dir",
    createName: "",
      previewVisible: false,
      showUpload: false,
      previewUrl: "",
      previewContent: "",
      previewName: "",
      fullscreenPreviewVisible: false,
      showFullscreenPreviewAnim: false,
      isText: false,
      emptyDescription: "无法预览此文件",
      editorView: null,
      previewVisible: false,
      previewContent: '',
      uploadUrl: "/api/files/upload",
      t
    };
  },
  computed: {
    pathParts() {
      const fullPath = this.currentPath ? './' + this.currentPath : '.';
      return fullPath.split('/');
    },
    isRoot() {
      return !this.currentPath || this.currentPath === '.';
    },
    fullscreenImageStyle() {
      if (!this.previewUrl) return {};
      return {
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'block',
        margin: 'auto',
      }
    },
    uploadHeaders() {
        const token = localStorage.getItem('token');
        return {
        Authorization: `Bearer ${token}`
        }
    },
  },
  watch: {
    previewContent(newVal) {
      if (this.editorView && this.editorView.state.doc.toString() !== newVal) {
        this.editorView.dispatch({
          changes: { from: 0, to: this.editorView.state.doc.length, insert: newVal },
        })
      }
    },
    fullscreenPreviewVisible(val) {
      if (val) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
  },
  methods: {
    async fetchFiles() {
      this.loading = true;
      try {
        const res = await axios.get("/api/files/list", {
          params: { path: this.currentPath },
        });
        this.allFiles = res.data.files || [];
        this.updateFiles();
      } finally {
        this.loading = false;
      }
    },

    updateFiles() {
      let filtered = this.showHiddenFiles
        ? this.allFiles
        : this.allFiles.filter(f => !f.name.startsWith('.'));

      this.totalFiles = filtered.length;

      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      this.files = filtered.slice(start, end);
    },

    formatSize(row) {
      const size = row.size;
      if (row.is_dir) return "--";
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      return (size / (1024 * 1024)).toFixed(1) + " MB";
    },

    formatDate(row) {
      if (!row.modified) return '';
      const d = new Date(row.modified);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },

    handlePageChange(page) {
      this.currentPage = page;
      this.fetchFiles();
    },

    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.fetchFiles();
    },

    toggleHiddenFiles() {
      this.showHiddenFiles = !this.showHiddenFiles;
      this.currentPage = 1;
      this.updateFiles();
    },

    openDir(name) {
      this.currentPath = this.currentPath
        ? this.currentPath + "/" + name
        : name;
      this.fetchFiles();
    },

    goUp() {
      const parts = this.currentPath.split("/");
      parts.pop();
      this.currentPath = parts.join("/");
      this.fetchFiles();
    },

    refresh() {
      this.fetchFiles();
    },

    async createItem() {
    if (!this.createName) {
      ElMessage.warning("请输入名称")
      return
    }

    try {
      await axios.post("/api/files/create", null, {
        params: {
          current_path: this.currentPath,
          name: this.createName,
          type: this.createType
        },
        headers: this.uploadHeaders,
      })
      ElMessage.success("创建成功")
      this.showCreateDialog = false
      this.createName = ""
      this.fetchFiles()
    } catch (e) {
      if (e.response.status === 403) {
        ElMessage.error("无效的路径")
      } else if (e.response.status === 400) {
        ElMessage.error("创建失败")
      } else {
      ElMessage.error(this.t('message.error.fetch') + e.message)
      }
    }
  },

    toggleUpload() {
      this.showUpload = !this.showUpload;
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

      const langExt = this.getLanguageExtension(this.previewName)
      const extensions = [
        basicSetup,
        oneDark,
        EditorView.lineWrapping,
      ]
      if (langExt) {
        extensions.push(langExt)
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
  const path = this.currentPath ? this.currentPath + "/" + name : name;

  this.isText = false;
  this.emptyDescription = "无法预览此文件";

  try {
    const res = await axios.get("/api/files/preview", {
      params: { path },
      responseType: "blob",
    });

    const contentType = res.data.type || res.headers["content-type"];

    if (contentType.startsWith("image")) {
      this.previewUrl = URL.createObjectURL(res.data);
      this.fullscreenPreviewVisible = true;
      this.showFullscreenPreviewAnim = false;
      this.$nextTick(() => {
          setTimeout(() => {
            this.showFullscreenPreviewAnim = true;
          }, 10);
        });
    } else if (contentType.startsWith("text")) {
      this.isText = true;
      this.previewName = name;
      this.previewContent = await res.data.text();
      this.$nextTick(this.initTextPreview);
      this.previewVisible = true;
    } else {
      this.emptyDescription = "无法预览此文件";
      this.previewVisible = true;
    }
  } catch (e) {
    if (e.response?.status === 408) {
      this.emptyDescription = "文件过大，无法预览";
      this.previewVisible = true;
    } else if (e.response?.status === 400) {
      this.emptyDescription = "预览失败";
      this.previewVisible = true;
    } else {
      ElMessage.error(this.t('message.error.fetch') + e.message)
    }
  }
},

  closeFullscreenPreview() {
    const imgEl = this.$refs.fullscreenImage;
    const wrapper = document.querySelector('.fullscreen-preview');

    if (imgEl && wrapper) {
      this.showFullscreenPreviewAnim = false;
      setTimeout(() => {
        this.fullscreenPreviewVisible = false;
        this.previewUrl = '';
      }, 300);
    } else {
      this.fullscreenPreviewVisible = false;
      this.previewUrl = '';
    }
  },

  updateFullscreenLeft() {
    const el = document.querySelector('.fullscreen-preview');
    if (!el) return;
    el.style.left = window.innerWidth >= 1024 ? '60px' : '0';
  },

closePreview() {
  this.previewVisible = false;

  if (this.editorView) {
    this.editorView.destroy();
    this.editorView = null;
  }
  this.previewContent = '';
  this.previewName = '';
  this.isText = true;
  this.previewUrl = '';
},

async saveFile() {
  if (!this.editorView) return;

  const content = this.editorView.state.doc.toString();
  const blob = new Blob([content], { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", blob, this.previewName);
  formData.append("path", this.currentPath);

  try {
    await axios.post(this.uploadUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...this.uploadHeaders
      }
    });
    ElMessage.success("保存成功");
    this.previewVisible = false;
    this.closePreview();
    this.fetchFiles();
  } catch (e) {
    if (e.response.status === 400) {
        ElMessage.error("保存失败")
      } else {
      ElMessage.error(this.t('message.error.fetch') + e.message)
      }
    
  }
},

  async handleBeforeUpload(file) {
    const exists = this.files.some(f => !f.is_dir && f.name === file.name)
    if (exists) {
      try {
        await ElMessageBox.confirm(
          `文件 "${file.name}" 已存在，是否替换？`,
          '文件已存在',
          { confirmButtonText: '替换', cancelButtonText: '取消', type: 'warning' }
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
        const { value: newName } = await ElMessageBox.prompt('', '重命名', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: row.name,
        beforeClose: (action, instance, done) => {
          if (action === 'confirm' && !instance.inputValue.trim()) {
            ElMessage.warning('请输入新名称');
            return;
          }
          done();
        }
        })
        
        const path = this.currentPath
        ? this.currentPath + '/' + row.name
        : row.name

        await axios.post('/api/files/rename', { 
        old_path: path, 
        new_name: newName 
        })
    
        this.fetchFiles()
        ElMessage.success('重命名成功')
    } catch (error) {
        if (error === 'cancel') {
        return
        }
        if (error.response?.status === 409) {
        ElMessage.error('文件已存在')
        } else if (error.response?.status === 404) {
        ElMessage.error('文件不存在')
        } else if (error.response?.status === 400) {
        ElMessage.error('重命名失败')
        } else {
      ElMessage.error(this.t('message.error.fetch') + error.message)
        }
    }
    },

    async remove(row) {
    try {
        await ElMessageBox.confirm('你确定要删除吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
        })
        
        const path = this.currentPath
        ? this.currentPath + '/' + row.name
        : row.name
        
        await axios.delete('/api/files/delete', { params: { path } })
        
        this.fetchFiles()
        ElMessage.success('删除成功')
    } catch (error) {
        if (error === 'cancel') {
        return
        }
        if (error.response?.status === 404) {
          ElMessage.error('文件不存在')
        } else if (error.response?.status === 400) {
          ElMessage.error('删除失败')
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      }
    },

    async download(row) {
      const path = this.currentPath ? this.currentPath + "/" + row.name : row.name;
      const res = await axios.get("/api/files/download", {
        params: { path },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = row.name;
      a.click();
      URL.revokeObjectURL(url);
    },
  },

  mounted() {
    this.fetchFiles();
    window.addEventListener('resize', this.updateFullscreenLeft);
    this.updateFullscreenLeft();
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.updateFullscreenLeft);
  },
};
</script>

<style scoped>
.operation-button-container {
  margin: 15px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
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
  height: 100vh;
  background-color: rgba(0,0,0,0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-preview.show {
  opacity: 1;
  background-color: rgba(0,0,0,0.85);
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  display: block;
  transform: scale(0.8);
  transition: transform 0.3s ease, opacity 0.3s ease;
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
