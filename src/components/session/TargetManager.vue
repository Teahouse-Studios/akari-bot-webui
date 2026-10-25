<template>
  <div>
    <el-card class="target-card" shadow="never">
      <div class="header-container">
        <h3><i class="mdi mdi-forum"></i> {{ $t('session.target.title') }}</h3>
        <el-tooltip :content="$t('button.refresh')" placement="top">
          <el-button
            link
            class="plain-icon-button"
            :disabled="loading"
            :aria-label="$t('button.refresh')"
            style="float: right; margin-left: 10px"
            @click="refreshData"
          >
            <i class="mdi mdi-refresh"></i>
          </el-button>
        </el-tooltip>
      </div>

      <div class="filter-container">
        <div class="filter-item">
          <el-select
            v-model="selectedPrefix"
            clearable
            :placeholder="$t('session.select.prefix')"
            @change="debouncedRefresh"
          >
            <el-option
              v-for="prefix in platformPrefixes"
              :key="prefix"
              :label="prefix"
              :value="prefix"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <el-select
            v-model="selectedStatus"
            clearable
            :placeholder="$t('session.select.status')"
            @change="debouncedRefresh"
          >
            <el-option :label="$t('session.target.tag.muted')" value="muted" />
            <el-option :label="$t('session.target.tag.blocked')" value="blocked" />
          </el-select>
        </div>

        <div class="filter-item">
          <el-input
            v-model="platformIdPart"
            :placeholder="$t('session.target.input.target_id')"
            @input="debouncedRefresh"
          >
            <template #prefix>
              <i class="mdi mdi-magnify"></i>
            </template>
          </el-input>
        </div>
      </div>

      <el-table v-loading="loading" :data="targetList" style="width: 100%" stripe>
        <el-table-column
          prop="target_id"
          :label="$t('session.target.table.target_id')"
          sortable
          min-width="220"
        >
          <template #default="{ row }">
            <span>{{ row.target_id }}</span>
            <el-tag v-if="isGroup(row)" type="primary" size="small" style="margin-left: 5px">
              {{ $t('session.target.tag.group') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('session.target.table.group')" min-width="160">
          <template #default="{ row }">
            <template v-if="isGroup(row)">
              <span>{{ row.bound_ids.length }}</span>
              <el-tooltip :content="$t('button.view')" placement="top">
                <el-button
                  link
                  size="small"
                  type="primary"
                  class="row-action-button"
                  :aria-label="$t('button.view')"
                  style="margin-left: 5px"
                  @click="viewGroup(row)"
                >
                  <i class="mdi mdi-message-group"></i>
                </el-button>
              </el-tooltip>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="locale" :label="$t('session.target.table.locale')" min-width="100" />
        <el-table-column prop="modules" :label="$t('session.target.table.modules')" min-width="160">
          <template #default="{ row }">
            {{ row.modules.length }}
            <el-tooltip v-if="row.modules.length > 0" :content="$t('button.view')" placement="top">
              <el-button
                link
                size="small"
                type="primary"
                class="row-action-button"
                :aria-label="$t('button.view')"
                style="margin-left: 5px"
                @click="viewModules(row)"
              >
                <i class="mdi mdi-eye"></i>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('session.target.table.custom_admins')" min-width="160">
          <template #default="{ row }">
            {{ row.custom_admins.length }}
            <el-tooltip
              v-if="row.custom_admins.length > 0"
              :content="$t('button.view')"
              placement="top"
            >
              <el-button
                link
                size="small"
                type="primary"
                class="row-action-button"
                :aria-label="$t('button.view')"
                style="margin-left: 5px"
                @click="viewAdmins(row)"
              >
                <i class="mdi mdi-eye"></i>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('session.target.table.banned_users')" min-width="160">
          <template #default="{ row }">
            {{ row.banned_users.length }}
            <el-tooltip
              v-if="row.banned_users.length > 0"
              :content="$t('button.view')"
              placement="top"
            >
              <el-button
                link
                size="small"
                type="primary"
                class="row-action-button"
                :aria-label="$t('button.view')"
                style="margin-left: 5px"
                @click="viewBanned(row)"
              >
                <i class="mdi mdi-eye"></i>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('session.table.status')" min-width="220">
          <template #default="{ row }">
            <el-tag type="warning" v-if="row.muted">{{ $t('session.target.tag.muted') }}</el-tag>
            <el-tag type="danger" v-if="row.blocked" style="margin-left: 5px">{{
              $t('session.target.tag.blocked')
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('session.target.table.target_data')" min-width="160">
          <template #default="{ row }">
            <el-popover placement="top" width="300" :hide-after="0" :trigger="['hover', 'click']">
              <pre>{{ JSON.stringify(row.target_data, null, 2) }}</pre>
              <template #reference>
                <el-button size="mini" type="text">{{ $t('session.table.text.detail') }}</el-button>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column :label="$t('table.operation')" min-width="120">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip :content="$t('button.edit')" placement="top">
                <el-button
                  link
                  size="small"
                  type="warning"
                  class="row-action-button"
                  :aria-label="$t('button.edit')"
                  @click="editTarget(row)"
                >
                  <i class="mdi mdi-pencil"></i>
                </el-button>
              </el-tooltip>
              <el-tooltip :content="$t('button.delete')" placement="top">
                <el-button
                  link
                  size="small"
                  type="danger"
                  class="row-action-button"
                  :aria-label="$t('button.delete')"
                  @click="confirmDelete(row)"
                >
                  <i class="mdi mdi-delete"></i>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
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
      </div>

      <el-dialog v-model="moduleDialogVisible" :title="$t('session.target.table.modules')">
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
      <el-dialog v-model="adminDialogVisible" :title="$t('session.target.table.custom_admins')">
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
      <el-dialog v-model="bannedDialogVisible" :title="$t('session.target.table.banned_users')">
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
      v-model="groupDialogVisible"
      :title="$t('session.target.title.group_detail')"
      width="500px"
    >
      <div v-loading="groupLoading" class="tag-container">
        <el-tag
          v-for="member in selectedGroupMembers"
          :key="member.target_id"
          style="margin: 4px"
          type="info"
          round
        >
          {{ member.target_id }}
          <el-tooltip :content="$t('session.group.tooltip.channel')" placement="top">
            <span style="margin-left: 4px; color: var(--el-text-color-secondary)"
              >#{{ member.channel_id }}</span
            >
          </el-tooltip>
        </el-tag>
        <el-empty
          v-if="!groupLoading && selectedGroupMembers.length === 0"
          :description="$t('session.group.empty')"
          :image-size="60"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      :title="$t('session.target.title.edit_target_data')"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      width="600px"
    >
      <el-form :model="editForm" label-width="auto">
        <el-alert
          v-if="editGroupMemberCount > 1"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
          :title="t('session.target.alert.edit_group', { count: editGroupMemberCount })"
        />
        <el-col :span="12">
          <el-form-item :label="$t('session.target.table.locale')">
            <el-input v-model="editForm.locale" />
          </el-form-item>
        </el-col>
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item :label="$t('session.target.table.mute')">
              <el-switch v-model="editForm.muted" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item :label="$t('session.target.table.block')">
              <el-switch v-model="editForm.blocked" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('session.target.table.modules_list')">
              <el-select
                v-model="editForm.modules"
                multiple
                filterable
                allow-create
                :placeholder="$t('session.target.input.modules')"
                style="width: 100%"
              >
                <el-option v-for="mod in allModules" :key="mod" :label="mod" :value="mod" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item :label="$t('session.target.table.custom_admins')">
              <el-select
                v-model="editForm.custom_admins"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="$t('session.target.input.custom_admins')"
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
            <el-form-item :label="$t('session.target.table.banned_users')">
              <el-select
                v-model="editForm.banned_users"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="$t('session.target.input.banned_users')"
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
            <el-form-item :label="$t('session.target.table.target_data')">
              <el-input
                type="textarea"
                resize="none"
                class="data-input"
                v-model="targetDataString"
                :rows="6"
                placeholder="{}"
                @blur="normalizeTargetData"
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

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const editForm = reactive({
  target_id: '',
  locale: '',
  muted: false,
  blocked: false,
  modules: [],
  custom_admins: [],
  banned_users: [],
  target_data: {},
})

const targetList = ref([])
const allModules = ref([])
const unionMap = ref(new Map())
const selectedModules = ref([])
const selectedAdmins = ref([])
const selectedBanned = ref([])

const moduleDialogVisible = ref(false)
const adminDialogVisible = ref(false)
const bannedDialogVisible = ref(false)
const groupDialogVisible = ref(false)
const groupLoading = ref(false)
const selectedGroupMembers = ref([])
const editGroupMemberCount = ref(0)
const editDialogVisible = ref(false)

const selectedPrefix = ref('')
const selectedStatus = ref('')
const platformIdPart = ref('')
const targetDataString = ref('')

const debounceTimer = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const loading = ref(false)
const abortController = new AbortController()

/** 平台前缀候选项由后端统一提供，避免只收集到当前页的绑定 ID */
const platformPrefixes = ref([])

const fetchPlatformPrefixes = async () => {
  try {
    const response = await axios.get('/api/platform_prefixes', {
      signal: abortController.signal,
    })
    if (response.status === 200 && Array.isArray(response.data.target_prefixes)) {
      const prefixes = [...response.data.target_prefixes]
      if (selectedPrefix.value && !prefixes.includes(selectedPrefix.value)) {
        prefixes.push(selectedPrefix.value)
      }
      platformPrefixes.value = prefixes
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      console.log('Failed to fetch platform prefixes', error)
    }
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/target', {
      signal: abortController.signal,
      params: {
        prefix: selectedPrefix.value || undefined,
        status: selectedStatus.value || undefined,
        id: platformIdPart.value || undefined,
        page: currentPage.value,
        size: pageSize.value,
      },
    })
    if (response.status === 200) {
      targetList.value = response.data.target_list.map((item) => {
        item.modules = Array.isArray(item.modules) ? item.modules : []
        item.custom_admins = Array.isArray(item.custom_admins) ? item.custom_admins : []
        return item
      })
      const map = new Map()
      for (const item of response.data.target_list) {
        if (item.union_id) {
          map.set(item.union_id, Array.isArray(item.bound_ids) ? item.bound_ids : [])
        }
      }
      unionMap.value = map
      totalItems.value = response.data.total || 0
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error)
    }
  } finally {
    loading.value = false
  }
}

const fetchAllModules = async () => {
  try {
    const response = await axios.get('/api/modules_list')
    if (response.status === 200 && response.data.modules) {
      allModules.value = Object.values(response.data.modules)
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error)
    }
  }
}

const refreshData = async () => {
  currentPage.value = 1
  await fetchData()
  fetchAllModules()
  fetchPlatformPrefixes()
}

const debouncedRefresh = () => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    refreshData()
  }, 500)
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchData()
}

const viewModules = (row) => {
  selectedModules.value = row.modules
  moduleDialogVisible.value = true
}

const isGroup = (row) => (row.bound_ids?.length ?? 1) > 1

const resolveDisplayIds = (ids) => {
  if (!Array.isArray(ids)) {
    return []
  }
  return ids.map((id) => {
    const bound = unionMap.value.get(id)
    return bound && bound.length > 0 ? bound[0] : id
  })
}

const viewGroup = async (row) => {
  groupDialogVisible.value = true
  groupLoading.value = true
  selectedGroupMembers.value = []
  try {
    const response = await axios.get(`/api/target/group/${row.union_id}`, {
      signal: abortController.signal,
    })
    if (response.status === 200 && response.data.target_group) {
      selectedGroupMembers.value = response.data.target_group.members || []
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  } finally {
    groupLoading.value = false
  }
}

const viewAdmins = (row) => {
  selectedAdmins.value = resolveDisplayIds(row.custom_admins || [])
  adminDialogVisible.value = true
}

const viewBanned = (row) => {
  selectedBanned.value = resolveDisplayIds(row.banned_users || [])
  bannedDialogVisible.value = true
}

const editTarget = (row) => {
  editGroupMemberCount.value = row.bound_ids?.length ?? 1
  Object.assign(editForm, {
    target_id: row.target_id,
    locale: row.locale,
    muted: row.muted,
    blocked: row.blocked,
    modules: row.modules ? [...row.modules] : [],
    custom_admins: row.custom_admins ? resolveDisplayIds(row.custom_admins) : [],
    banned_users: row.banned_users ? resolveDisplayIds(row.banned_users) : [],
    target_data: row.target_data ? { ...row.target_data } : {},
  })
  targetDataString.value = JSON.stringify(editForm.target_data, null, 2)
  editDialogVisible.value = true
}

/** 数据框被清空时回落为默认空对象，避免提交空字符串导致 JSON 解析失败 */
const normalizeTargetData = () => {
  if (!targetDataString.value.trim()) {
    targetDataString.value = '{}'
  }
}

const submitEdit = async () => {
  normalizeTargetData()

  let parsedTargetData = {}
  try {
    parsedTargetData = JSON.parse(targetDataString.value)
  } catch {
    ElMessage.error(t('session.message.invalid_json'))
    return
  }

  const { target_id, ...payload } = editForm
  payload.target_data = parsedTargetData

  try {
    await axios.patch(`/api/target/${target_id}`, payload)
    ElMessage.success(t('session.message.success.edit'))
    editDialogVisible.value = false
    fetchData()
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const deleteTarget = async (row) => {
  try {
    await axios.delete(`/api/target/${row.target_id}`)
    ElMessage.success(t('session.message.success.delete'))
    fetchData()
  } catch (error) {
    if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else if (error.response?.status === 409) {
      ElMessage.error(error.response.data?.detail || t('session.message.delete_blocked'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const confirmDelete = (row) => {
  const memberCount = row.bound_ids?.length ?? 1
  ElMessageBox.confirm(
    memberCount > 1
      ? t('session.target.confirm.delete_group', { target_id: row.target_id, count: memberCount })
      : t('session.target.confirm.message', { target_id: row.target_id }),
    t('confirm.warning'),
    {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    },
  )
    .then(() => {
      deleteTarget(row)
    })
    .catch(() => {
      // 用户取消删除，无需处理
    })
}

onMounted(() => {
  refreshData()
})

onBeforeUnmount(() => {
  abortController.abort()
})
</script>

<style scoped>
pre {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.data-input :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

h3 {
  cursor: default;
}

.target-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.el-button i {
  margin-right: 8px;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.row-actions .el-button {
  margin-left: 0;
}

.row-action-button {
  padding: 4px;
  font-size: 16px;
}

.row-action-button i {
  margin-right: 0 !important;
}

.plain-icon-button {
  padding: 4px;
  font-size: 20px;
}

.plain-icon-button i {
  margin-right: 0 !important;
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

.pagination-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
}
</style>
