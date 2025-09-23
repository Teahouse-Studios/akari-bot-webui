<template>
  <div>
    <!-- 顶部操作 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        v-for="(p, idx) in pathParts"
        :key="idx"
      >
        {{ p }}
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div style="margin:10px 0">
      <el-button @click="goUp">上一级</el-button>
      <el-button @click="refresh">刷新</el-button>
      <el-button @click="showCreateDialog = true">新建</el-button>
      <el-button @click="toggleUpload">
        {{ "上传" }}
      </el-button>
    </div>

    <div v-if="showUpload" class="upload-area">
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
    <div class="table-wrapper">
    <el-table
      :data="files"
      style="width: 100%"
      stripe
      v-loading="loading">
    <el-table-column
        prop="name"
        label="名称"
        min-width="60"
        sortable
    >
        <template #default="{ row }">
        <i :class="row.is_dir ? 'mdi mdi-folder' : 'mdi mdi-file'" style="margin-right:6px"></i>
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
        min-width="60"
        :formatter="formatSize"
    />
    <el-table-column
        prop="modified"
        label="修改日期"
        min-width="80"
        :formatter="formatDate"
    />
    <el-table-column
        label="操作"
        min-width="120">
        <template #default="{ row }">
        <el-button size="small" @click="rename(row)">重命名</el-button>
        <el-button size="small" type="primary" @click="download(row)">下载</el-button>
        <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
    </el-table-column>
    </el-table>
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
    
    <el-dialog
      v-model="previewVisible"
      :show-close="false"
      :center="true"
    >
        <div v-if="isImage">
    <img
      :src="previewUrl"
      style="width: 100%; height: 100%"
    />
  </div>
  <div v-else-if="isText">
    <div ref="textEditor" class="editor-body"></div>
    <span slot="footer">
      <el-button @click="closePreview">关闭</el-button>
      <el-button type="primary" @click="saveFile">保存</el-button>
    </span>
  </div>
  <el-empty 
    v-else
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
import { oneDark } from '@codemirror/theme-one-dark'
import { useI18n } from 'vue-i18n'

export default {
  name: "FilesPage",
  data() {
    const { t } = useI18n()
    return {
      loading: false,
      currentPath: " ",
      files: [],
    showCreateDialog: false,
    createType: "dir",
    createName: "",
      previewVisible: false,
      showUpload: false,
      previewUrl: "",
      previewContent: "",
      previewName: "",
      isImage: false,
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
        const fullPath = '.' + this.currentPath;
        return fullPath.split('/');
    },
    uploadHeaders() {
        const token = localStorage.getItem('token'); // 假设你把 JWT 存在 localStorage
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
  },
  methods: {
    async fetchFiles() {
      this.loading = true;
      try {
        const res = await axios.get("/api/files/list", {
          params: { path: this.currentPath },
        });
        this.files = res.data.files;
      } finally {
        this.loading = false;
      }
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
      ElMessage.error("创建失败：" + e)
    }
  },

    toggleUpload() {
      this.showUpload = !this.showUpload;
    },

    initTextPreview() {
      if (!this.isText) return
      const state = EditorState.create({
        doc: this.previewContent,
        extensions: [
          basicSetup,
          oneDark,
          EditorView.lineWrapping,
        ],
      })
      this.editorView = new EditorView({
        state,
        parent: this.$refs.textEditor,
      })
    },

async previewFile(name) {
  const path = this.currentPath ? this.currentPath + "/" + name : name;

  this.isImage = false;
  this.isText = false;
  this.emptyDescription = "无法预览此文件";

  try {
    const res = await axios.get("/api/files/preview", {
      params: { path },
      responseType: "blob",
    });

    const contentType = res.data.type || res.headers["content-type"];

    if (contentType.startsWith("image")) {
      this.isImage = true;
      this.previewUrl = URL.createObjectURL(res.data);
    } else if (contentType.startsWith("text")) {
      this.isText = true;
      this.previewContent = await res.data.text();
      this.$nextTick(this.initTextPreview);
    } else {
      this.emptyDescription = "无法预览此文件";
    }

    this.previewVisible = true;
  } catch (e) {
    if (e.response) {
      if (e.response.status === 408) {
        this.emptyDescription = "文件太大，无法预览";
      } else {
        this.emptyDescription = "预览失败";
      }
      this.previewVisible = true;
    } else {
      ElMessage.error(this.t('message.error.fetch') + e.message)
    }
  }
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
  this.isImage = false;
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
    this.fetchFiles();
  } catch (e) {
    ElMessage.error("保存失败：" + e);
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
        } else {
        ElMessage.error('重命名失败：' + error)
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
        } else {
        ElMessage.error('删除失败：' + error)
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
  },
};
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;          /* 横向滚动 */
  -webkit-overflow-scrolling: touch; /* 移动端平滑滚动 */
  width: 100%;
}

.upload-area {
  margin-bottom: 15px;
  border: 1px dashed #d9d9d9;
  padding: 20px;
  border-radius: 4px;
  background: #fafafa;
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

::v-deep(.cm-content) {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 14px;
}

</style>
