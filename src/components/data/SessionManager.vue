<template>
  <div>
    <el-card class="session-card" shadow="never">
      <div class="header-container">
        <h3><i class="mdi mdi-forum"></i> {{ $t('data.session.title') }}</h3>
        <el-button
          @click="refreshData"
          type="primary"
          size="small"
          style="float: right; margin-left: 10px"
          ><i class="mdi mdi-refresh"></i> {{ $t('data.button.refresh') }}</el-button
        >
      </div>

      <div class="filter-container">
        <div class="filter-item">
          <el-select
            v-model="selectedPrefix"
            clearable
            :placeholder="$t('data.select.prefix')"
            @change="debouncedRefresh"
          >
            <el-option label="QQ" value="QQ" />
            <el-option label="QQBot" value="QQBot" />
            <el-option label="Discord" value="Discord" />
            <el-option label="Telegram" value="Telegram" />
            <el-option label="KOOK" value="KOOK" />
            <el-option label="Matrix" value="Matrix" />
            <el-option label="Web" value="Web" />
          </el-select>
        </div>

        <div class="filter-item">
          <el-select
            v-model="selectedStatus"
            clearable
            :placeholder="$t('data.select.status')"
            @change="debouncedRefresh"
          >
            <el-option :label="$t('data.session.tag.muted')" value="muted" />
            <el-option :label="$t('data.session.tag.blocked')" value="blocked" />
          </el-select>
        </div>

        <div class="filter-item">
          <el-input
            v-model="platformIdPart"
            :placeholder="$t('data.session.input.target_id')"
            @input="debouncedRefresh"
          />
        </div>
      </div>

      <el-table v-loading="loading" :data="targetList" style="width: 100%" stripe>
        <el-table-column
          prop="target_id"
          :label="$t('data.session.table.target_id')"
          sortable
          min-width="140"
        />
        <el-table-column
          prop="locale"
          :label="$t('data.session.table.locale')"
          sortable
          min-width="100"
        />
        <el-table-column prop="modules" :label="$t('data.session.table.modules')" min-width="160">
          <template #default="{ row }">
            {{ row.modules.length }}
            <el-button
              v-if="row.modules.length > 0"
              size="small"
              type="primary"
              style="margin-left: 5px"
              @click="viewModules(row)"
              ><i class="mdi mdi-eye"></i> {{ $t('data.button.view') }}</el-button
            >
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.session.table.custom_admins')" min-width="160">
          <template #default="{ row }">
            {{ row.custom_admins.length }}
            <el-button
              v-if="row.custom_admins.length > 0"
              size="small"
              type="primary"
              style="margin-left: 5px"
              @click="viewAdmins(row)"
              ><i class="mdi mdi-eye"></i> {{ $t('data.button.view') }}</el-button
            >
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.session.table.banned_users')" min-width="160">
          <template #default="{ row }">
            {{ row.banned_users.length }}
            <el-button
              v-if="row.banned_users.length > 0"
              size="small"
              type="primary"
              style="margin-left: 5px"
              @click="viewBanned(row)"
              ><i class="mdi mdi-eye"></i> {{ $t('data.button.view') }}</el-button
            >
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.table.status')" min-width="220">
          <template #default="{ row }">
            <el-tag type="warning" v-if="row.muted">{{ $t('data.session.tag.muted') }}</el-tag>
            <el-tag type="danger" v-if="row.blocked" style="margin-left: 5px">{{
              $t('data.session.tag.blocked')
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.session.table.target_data')" min-width="140">
          <template #default="{ row }">
            <el-popover placement="top" width="300" :hide-after="0" :trigger="['hover', 'click']">
              <pre>{{ JSON.stringify(row.target_data, null, 2) }}</pre>
              <template #reference>
                <el-button size="mini" type="text">{{ $t('data.table.text.detail') }}</el-button>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.session.table.operation')" min-width="240">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="editTarget(row)"
              ><i class="mdi mdi-pencil"></i> {{ $t('button.edit') }}</el-button
            >
            <el-button size="small" type="danger" @click="confirmDelete(row)"
              ><i class="mdi mdi-delete"></i> {{ $t('button.delete') }}</el-button
            >
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
        style="margin-top: 20px"
        @current-change="handlePageChange"
      />

      <el-dialog v-model="moduleDialogVisible" :title="$t('data.session.table.modules')">
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
      <el-dialog v-model="adminDialogVisible" :title="$t('data.session.table.custom_admins')">
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
      <el-dialog v-model="bannedDialogVisible" :title="$t('data.session.table.banned_users')">
        <div class="tag-container">
          <el-tag
            v-for="banned in selectedBanned"
            :key="banned"
            style="margin: 4px"
            type="info"
            round
          >
            {{ banned }}
          </el-tag>
        </div>
      </el-dialog>
    </el-card>

    <el-dialog
      v-model="editDialogVisible"
      :title="$t('data.session.title.edit_target_data')"
      width="600px"
    >
      <el-form :model="editForm" label-width="auto">
        <el-col :span="12">
          <el-form-item :label="$t('data.session.table.locale')">
            <el-input v-model="editForm.locale" />
          </el-form-item>
        </el-col>
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item :label="$t('data.session.table.mute')">
              <el-switch v-model="editForm.muted" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item :label="$t('data.session.table.block')">
              <el-switch v-model="editForm.blocked" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('data.session.table.modules_list')">
              <el-select
                v-model="editForm.modules"
                multiple
                filterable
                allow-create
                :placeholder="$t('data.session.input.modules')"
                style="width: 100%"
              >
                <el-option v-for="mod in allModules" :key="mod" :label="mod" :value="mod" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('data.session.table.custom_admins')">
              <el-select
                v-model="editForm.custom_admins"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="$t('data.session.input.custom_admins')"
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
            <el-form-item :label="$t('data.session.table.banned_users')">
              <el-select
                v-model="editForm.banned_users"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="$t('data.session.input.banned_users')"
                style="width: 100%"
              >
                <el-option
                  v-for="banned in editForm.banned_users"
                  :key="banned"
                  :label="banned"
                  :value="banned"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('data.session.table.target_data')">
              <el-input
                type="textarea"
                resize="none"
                v-model="targetDataString"
                :rows="6"
                :placeholder="$t('data.input.json_data')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">{{ $t('button.cancel') }}</el-button>
        <el-button type="primary" @click="submitEdit">{{ $t('button.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default {
  data() {
    const { t } = useI18n()
    return {
      editForm: {
        target_id: '',
        locale: '',
        muted: false,
        blocked: false,
        modules: [],
        custom_admins: [],
        banned_users: [],
        target_data: {},
      },
      targetList: [],
      moduleDialogVisible: false,
      adminDialogVisible: false,
      bannedDialogVisible: false,
      editDialogVisible: false,
      selectedAdmins: [],
      selectedBanned: [],
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
      abortController: new AbortController(),
      t,
    }
  },
  mounted() {
    this.refreshData()
  },
  beforeUnmount() {
    this.abortController.abort()
  },
  methods: {
    debouncedRefresh() {
      clearTimeout(this.debounceTimer)

      this.debounceTimer = setTimeout(() => {
        this.refreshData()
      }, 500)
    },
    async refreshData() {
      this.currentPage = 1
      await this.fetchData()
      this.fetchAllModules()
    },
    viewModules(row) {
      this.selectedModules = row.modules
      this.moduleDialogVisible = true
    },
    async fetchData() {
      this.loading = true
      try {
        const response = await axios.get('/api/target', {
          signal: this.abortController.signal,
          params: {
            prefix: this.selectedPrefix || undefined,
            status: this.selectedStatus || undefined,
            id: this.platformIdPart || undefined,
            page: this.currentPage,
            size: this.pageSize,
          },
        })
        if (response.status === 200) {
          this.targetList = response.data.target_list.map((item) => {
            item.modules = Array.isArray(item.modules) ? item.modules : []
            item.custom_admins = Array.isArray(item.custom_admins) ? item.custom_admins : []
            return item
          })
          this.totalItems = response.data.total || 0
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled')
        } else {
          ElMessage.error(this.t('message.error.fetch') + error)
        }
      } finally {
        this.loading = false
      }
    },
    async fetchAllModules() {
      try {
        const response = await axios.get('/api/modules_list')
        if (response.status === 200 && response.data.modules) {
          this.allModules = Object.values(response.data.modules)
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled')
        } else {
          ElMessage.error(this.t('message.error.fetch') + error)
        }
      }
    },
    handlePageChange(page) {
      this.currentPage = page
      this.fetchData()
    },
    viewAdmins(row) {
      this.selectedAdmins = row.custom_admins || []
      this.adminDialogVisible = true
    },
    viewBanned(row) {
      this.selectedBanned = row.banned_users || []
      this.bannedDialogVisible = true
    },
    editTarget(row) {
      Object.assign(this.editForm, {
        target_id: row.target_id,
        locale: row.locale,
        muted: row.muted,
        blocked: row.blocked,
        modules: row.modules ? [...row.modules] : [],
        custom_admins: row.custom_admins ? [...row.custom_admins] : [],
        banned_users: row.banned_users ? [...row.banned_users] : [],
        target_data: row.target_data ? { ...row.target_data } : {},
      })
      this.targetDataString = JSON.stringify(this.editForm.target_data, null, 2)
      this.editDialogVisible = true
    },
    async submitEdit() {
      let parsedTargetData
      try {
        parsedTargetData = JSON.parse(this.targetDataString)
      } catch (e) {
        ElMessage.error(this.t('data.message.invalid_json'))
      }

      const { target_id, ...payload } = this.editForm
      payload.target_data = parsedTargetData

      try {
        await axios.post(`/api/target/${target_id}/edit`, payload)
        ElMessage.success(this.t('data.message.success.edit'))
        this.editDialogVisible = false
        this.fetchData()
      } catch (error) {
        if (error.response?.status === 403 && IS_DEMO) {
          ElMessage.error(this.t('message.error.demo'))
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message)
        }
      }
    },
    confirmDelete(row) {
      ElMessageBox.confirm(
        this.t('data.session.confirm.message', { target_id: row.target_id }),
        this.t('confirm.warning'),
        {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        },
      )
        .then(() => {
          this.deleteTarget(row)
        })
        .catch(() => {
          return
        })
    },
    async deleteTarget(row) {
      try {
        await axios.post(`/api/target/${row.target_id}/delete`)
        ElMessage.success(this.t('data.message.success.delete'))
        this.fetchData()
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
pre {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.session-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.el-button i {
  margin-right: 8px;
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
