<template>
  <el-card class="session-card">
    <div class="header-container">
      <h3>会话管理</h3>
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
          <el-option label="未禁言" value="unmuted" />
          <el-option label="已禁言" value="muted" />
          <el-option label="已封禁" value="blocked" />
        </el-select>
      </div>

      <div class="filter-item">
        <el-input
          v-model="platformIdPart"
          placeholder="搜索会话 ID"
          @input="debouncedRefresh"
        />
      </div>
    </div>

    <el-table v-loading="loading" :data="targetList" style="width: 100%" stripe>
      <el-table-column prop="target_id" label="会话 ID" sortable min-width="140" />
      <el-table-column prop="locale" label="语言" min-width="100" />
      <el-table-column prop="modules" label="模块" min-width="160">
        <template #default="{ row }">
          {{ row.modules.length }}
          <el-button
            v-if="row.modules.length > 0"
            size="small"
            type="primary"
            style="margin-left: 5px;"
            @click="viewModules(row)"
          >查看模块</el-button>
        </template>
      </el-table-column>
      <el-table-column label="自定义管理员" min-width="160">
        <template #default="{ row }">
          {{ row.custom_admins.length }}
          <el-button
            v-if="row.custom_admins.length > 0"
            size="small"
            type="primary"
            style="margin-left: 5px;"
            @click="viewAdmins(row)"
          >查看管理员</el-button>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="160">
        <template #default="{ row }">
          <el-tag type="success" v-if="!row.muted">未禁言</el-tag>
          <el-tag type="warning" v-else>已禁言</el-tag>
          <el-tag type="danger" v-if="row.blocked" style="margin-left: 5px;">已封禁</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="会话数据" min-width="100">
        <template #default="{ row }">
          <el-popover
            placement="top"
            width="300"
            trigger="hover"
          >
            <pre style="white-space: pre-wrap; word-break: break-word;">{{ JSON.stringify(row.target_data, null, 2) }}</pre>
            <template #reference>
              <el-button size="mini" type="text">查看详情</el-button>
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="editTarget(row)"><i class="mdi mdi-pencil"></i> 编辑</el-button>
          <el-button size="small" type="danger" @click="confirmDelete(row)"><i class="mdi mdi-delete"></i> 删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="totalItems > 0"
      background
      layout="prev, pager, next"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      style="margin-top: 20px;"
      @current-change="handlePageChange"
    />


    <el-dialog v-model="moduleDialogVisible" title="模块列表">
      <div class="tag-container">
        <el-tag
          v-for="module in selectedModules"
          :key="module"
          style="margin: 4px"
          type="info"
          round
        >
          {{ module }}
        </el-tag>
    </div>
    </el-dialog>
    <el-dialog v-model="adminDialogVisible" title="自定义管理员">
      <div class="tag-container">
        <el-tag
          v-for="admin in selectedAdmins"
          :key="admin"
          style="margin: 4px"
          type="info"
          round
        >
          {{ admin }}
        </el-tag>
      </div>
    </el-dialog>
  </el-card>

  <el-dialog v-model="editDialogVisible" title="编辑会话数据" width="600px">
    <el-form :model="editForm" label-width="100px">
        <el-col :span="12">
          <el-form-item label="语言">
            <el-input v-model="editForm.locale" />
          </el-form-item>
        </el-col>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="禁言状态">
            <el-switch v-model="editForm.muted" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="封禁状态">
            <el-switch v-model="editForm.blocked" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="模块列表">
            <el-select
              v-model="editForm.modules"
              multiple
              filterable
              allow-create
              placeholder="请选择模块"
              style="width: 100%"
            >
              <el-option
                v-for="mod in allModules"
                :key="mod"
                :label="mod"
                :value="mod"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="管理员">
            <el-select
              v-model="editForm.custom_admins"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请输入管理员"
              style="width: 100%"
            >
              <el-option
                v-for="admin in editForm.custom_admins"
                :key="admin"
                :label="admin"
                :value="admin"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="会话数据">
            <el-input
              type="textarea"
              resize="none"
              v-model="targetDataString"
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
        target_id: '',
        locale: '',
        muted: false,
        blocked: false,
        modules: [],
        custom_admins: [],
        target_data: {},
      },
      targetList: [],
      moduleDialogVisible: false,
      adminDialogVisible: false,
      editDialogVisible: false,
      selectedAdmins: [],
      allModules: [],
      selectedModules: [],
      selectedPrefix: '',
      selectedStatus: '',
      platformIdPart: '',
      targetDataString: '',
      debounceTimer: null,
      currentPage: 1,
      pageSize: 20,
      totalItems: 0,
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
    this.fetchAllModules();
  },
  viewModules(row) {
    this.selectedModules = row.modules;
    this.moduleDialogVisible = true;
    },
    async fetchData() {
      this.loading = true;
      try {
        const response = await axios.get('/api/target', {
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
          this.targetList = response.data.target_list.map(item => {
            item.modules = Array.isArray(item.modules) ? item.modules : [];
            item.custom_admins = Array.isArray(item.custom_admins) ? item.custom_admins : [];
            return item;
          });
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
    async fetchAllModules() {
      try {
        const response = await axios.get('/api/modules', {
          params: {
            locale: localStorage.getItem("language")
          }
        });
        if (response.status === 200 && response.data.modules) {
          this.allModules = Object.keys(response.data.modules);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          ElMessage.error('Error fetching modules:' + error);
        }
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchData();
    },
    viewAdmins(row) {
      this.selectedAdmins = row.custom_admins || [];
      this.adminDialogVisible = true;
    },
    editTarget(row) {
      Object.assign(this.editForm, {
        target_id: row.target_id,
        locale: row.locale,
        muted: row.muted,
        blocked: row.blocked,
        modules: row.modules ? [...row.modules] : [],
        custom_admins: row.custom_admins ? [...row.custom_admins] : [],
        target_data: row.target_data ? { ...row.target_data } : {},
      });
      this.targetDataString = JSON.stringify(this.editForm.target_data, null, 2);
      this.editDialogVisible = true;
    },
    async submitEdit() {
      let parsedTargetData;
      try {
        parsedTargetData = JSON.parse(this.targetDataString);
      } catch (e) {
        ElMessage.error('会话数据格式错误，请检查 JSON 格式');
      }

      const { target_id, ...payload } = this.editForm;
      payload.target_data = parsedTargetData;

      try {
        await axios.post(`/api/target/${target_id}/edit`, payload);
        ElMessage.success('编辑成功');
        this.editDialogVisible = false;
        this.fetchData();
      } catch (error) {
        ElMessage.error('编辑失败：' + error.message);
      }
    },
    confirmDelete(row) {
      this.$confirm(`你确定要删除会话 ${row.target_id} 的所有数据吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.deleteTarget(row);
      }).catch(() => {
        return;
      });
    },
    async deleteTarget(row) {
      try {
        await axios.post(`/api/target/${row.target_id}/delete`);
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

.el-dialog .el-tag {
  margin: 4px;
  max-width: 100%;
  overflow-wrap: break-word;
}

.el-dialog .tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  overflow-y: auto;
  max-height: 200px;
  padding: 10px 0;
  max-width: 100%;
}
</style>
