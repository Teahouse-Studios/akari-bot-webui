<template>
    <el-card class="session-card">
      <div class="header-container">
        <h3>用户管理</h3>
        <el-button
          @click="refreshData"
          type="primary"
          style="float: right; margin-left: 10px;"
        ><i class="mdi mdi-refresh"></i> 刷新</el-button>
      </div>
  
      <div class="filter-container">
        <div class="filter-item">
          <el-select
            v-model="selectedPrefix"
            clearable
            placeholder="选择平台前缀"
            @change="debouncedRefresh"
          >
            <el-option label="QQ" value="QQ" />
            <el-option label="QQBot" value="QQBot" />
            <el-option label="Discord" value="Discord" />
            <el-option label="Telegram" value="Telegram" />
            <el-option label="KOOK" value="KOOK" />
            <el-option label="Web" value="Web" />
            <el-option label="TEST" value="TEST" />
          </el-select>
        </div>
  
        <div class="filter-item">
          <el-select
            v-model="selectedStatus"
            clearable
            placeholder="选择状态"
            @change="debouncedRefresh"
          >
            <el-option label="超级用户" value="superuser" />
            <el-option label="已信任" value="trusted" />
            <el-option label="已封禁" value="blocked" />
          </el-select>
        </div>
  
        <div class="filter-item">
          <el-input
            v-model="platformIdPart"
            placeholder="搜索用户 ID"
            @input="debouncedRefresh"
          />
        </div>
      </div>
  
      <el-table v-loading="loading" :data="senderList" style="width: 100%" stripe>
        <el-table-column prop="sender_id" label="用户 ID" sortable min-width="140" />
        <el-table-column prop="warns" label="警告次数" min-width="60" />
        <el-table-column prop="petal" label="花瓣" min-width="60" />
        <el-table-column label="状态" min-width="220">
          <template #default="{ row }">
            <el-tag type="primary" v-if="row.superuser">超级用户</el-tag>
            <el-tag type="success" v-if="row.trusted" style="margin-left: 5px;">已信任</el-tag>
            <el-tag type="danger" v-if="row.blocked" style="margin-left: 5px;">已封禁</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户数据" min-width="100">
          <template #default="{ row }">
            <el-popover
              placement="top"
              width="300"
              trigger="hover"
            >
              <pre style="white-space: pre-wrap; word-break: break-word;">{{ JSON.stringify(row.sender_data, null, 2) }}</pre>
              <template #reference>
                <el-button size="mini" type="text">查看详情</el-button>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="editSender(row)"><i class="mdi mdi-pencil"></i> 编辑</el-button>
            <el-button size="small" type="danger" @click="confirmDelete(row)"><i class="mdi mdi-delete"></i> 删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    <el-pagination
      v-if="totalItems > 0"
      background
      layout="prev, pager, next"
      :current-page.sync="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      style="margin-top: 20px;"
      @current-change="handlePageChange"
    />
    </el-card>
  
    <el-dialog v-model="editDialogVisible" title="编辑用户数据" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="超级用户">
              <el-switch v-model="editForm.superuser" @change="handleSuperUserChange" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="信任状态">
              <el-switch v-model="editForm.trusted" @change="handleTrustedChange" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="封禁状态">
              <el-switch v-model="editForm.blocked" @change="handleBlockedChange" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="警告次数">
              <el-input-number v-model="editForm.warns" :min="0"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="花瓣">
              <el-input-number v-model="editForm.petal" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="用户数据">
              <el-input
                type="textarea"
                resize="none"
                v-model="senderDataString"
                :rows="6"
                placeholder='请输入 JSON 数据'
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
  
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </template>
  
  <script>
  import axios from 'axios';
  import { ElMessage } from 'element-plus';
  
  export default {
    data() {
      return {
        editForm: {
          sender_id: '',
          warns: 0,
          petal: 0,
          superuser: false,
          trusted: false,
          blocked: false,
          sender_data: {},
        },
        senderList: [],
        editDialogVisible: false,
        selectedPrefix: '',
        selectedStatus: '',
        platformIdPart: '',
        senderDataString: '',
        currentPage: 1,
        pageSize: 20,
        totalItems: 0,
        debounceTimer: null,
        loading: false,
        cancelTokenSource: axios.CancelToken.source()
      };
    },
    mounted() {
      this.refreshData()
    },
    beforeUnmount() {
      this.cancelTokenSource.cancel("Component unmounted");
    },
    methods: {
      debouncedRefresh() {
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
          this.refreshData();
        }, 500);
      },
    async refreshData() {
      this.currentPage = 1;
      await this.fetchData();
    },
      async fetchData() {
        this.loading = true;
        try {
          const response = await axios.get('/api/sender', {
            cancelToken: this.cancelTokenSource.token,
            params: {
              prefix: this.selectedPrefix || undefined,
              status: this.selectedStatus || undefined,
              id: this.platformIdPart || undefined,
              page: this.currentPage,
              size: this.pageSize
            }
          });
          if (response.status === 200) {
            this.senderList = response.data.sender_list;
            this.totalItems = response.data.total || 0;
          }
        } catch (error) {
          if (axios.isCancel(error)) {
            console.log("Request canceled");
          } else {
            ElMessage.error('Error fetching data:' + error);
          } 
        } finally {
            this.loading = false;
          }
      },
      handlePageChange(page) {
        this.currentPage = page;
        this.fetchData();
      },
      handleSuperUserChange(value) {
        if (value) {
          this.editForm.trusted = false;
          this.editForm.blocked = false;
        }
      },
      handleTrustedChange(value) {
        if (value) {
          this.editForm.superuser = false;
          this.editForm.blocked = false;
        }
      },
      handleBlockedChange(value) {
        if (value) {
          this.editForm.superuser = false;
          this.editForm.trusted = false;
        }
      },
      editSender(row) {
        Object.assign(this.editForm, {
          sender_id: row.sender_id,
          superuser: row.superuser,
          trusted: row.trusted,
          blocked: row.blocked,
          warns: row.warns,
          petal: row.petal,
          sender_data: row.sender_data ? { ...row.sender_data } : {},
        });
        this.senderDataString = JSON.stringify(this.editForm.sender_data, null, 2);
        this.editDialogVisible = true;
      },
      async submitEdit() {
        let parsedSenderData;
        try {
            parsedSenderData = JSON.parse(this.senderDataString);
        } catch (e) {
          ElMessage.error('用户数据格式错误，请检查 JSON 格式');
        }
  
        const { sender_id, ...payload } = this.editForm;
        payload.sender_data = parsedSenderData;
  
        try {
          await axios.post(`/api/sender/${sender_id}/edit`, payload);
          ElMessage.success('编辑成功');
          this.editDialogVisible = false;
          this.fetchData();
        } catch (error) {
          ElMessage.error('编辑失败：' + error.message);
        }
      },
      confirmDelete(row) {
        this.$confirm(`你确定要删除用户 ${row.sender_id} 的所有数据吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          this.deleteSender(row);
        }).catch(() => {
          return;
        });
      },
      async deleteSender(row) {
        try {
          await axios.post(`/api/sender/${row.sender_id}/delete`);
          ElMessage.success('删除成功');
          this.fetchData();
        } catch (error) {
          ElMessage.error('删除失败：' + error.message);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .el-card {
    box-shadow: none !important;
    margin-bottom: 20px;
    line-height: 1;
    white-space: nowrap;
  }
  
  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .filter-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .filter-item {
    flex: 1 1 0;
    min-width: 200px;
  }
  </style>
  