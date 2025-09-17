<template>
  <div>
    <el-card class="module-card" shadow="never">
      <div class="header-container">
        <h3><i class="mdi mdi-puzzle"></i> {{ $t('data.modules.title') }}</h3>
        <el-button
          @click="refreshData"
          type="primary"
          size="small"
          style="float: right; margin-left: 10px"
          ><i class="mdi mdi-refresh"></i> {{ $t('data.button.refresh') }}</el-button
        >
      </div>

      <div class="filter-container">
        <el-col :span="6">
          <div class="filter-item">
            <el-input
              v-model="searchKeyword"
              :placeholder="$t('data.modules.input.module_name')"
              clearable
              @input="debouncedRefresh"
              :prefix-icon="Search"
            >
              <template #prefix>
                <i class="mdi mdi-magnify"></i>
              </template>
            </el-input>
          </div>
        </el-col>
      </div>

      <el-table v-loading="loading" :data="pagedModules" style="width: 100%" stripe>
        <el-table-column :label="$t('data.modules.table.name')" min-width="140">
          <template #default="{ row }">
            <span :class="{ unloaded: !row.loaded }">{{ row.bind_prefix }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.modules.table.desc')" min-width="800">
          <template #default="{ row }">
            {{ row.desc || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.modules.table.developers')" min-width="400">
          <template #default="{ row }">
            <el-tag v-for="dev in row.developers" :key="dev" type="info" style="margin: 2px">
              {{ dev }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.table.status')" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.loaded ? 'success' : 'danger'">
              {{ row.loaded ? $t('data.modules.tag.loaded') : $t('data.modules.tag.unloaded') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.table.operation')" min-width="240">
          <template #default="{ row }">
            <el-button v-if="row.loaded" size="small" type="warning" @click="handleReload(row)">
              <i class="mdi mdi-reload"></i> {{ $t('data.modules.button.reload') }}
            </el-button>

            <el-button
              v-if="row.loaded"
              size="small"
              type="danger"
              style="margin-left: 5px"
              @click="handleUnload(row)"
            >
              <i class="mdi mdi-puzzle-remove"></i> {{ $t('data.modules.button.unload') }}
            </el-button>

            <el-button v-else size="small" type="success" @click="handleLoad(row)">
              <i class="mdi mdi-puzzle-plus"></i> {{ $t('data.modules.button.load') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-if="totalModules > 0"
          background
          layout="prev, pager, next"
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalModules"
          style="margin-top: 20px"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from '@/axios.mjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ModulesManager',
  data() {
    const { t } = useI18n()
    return {
      modules: [],
      searchKeyword: '',
      loading: false,
      debounceTimer: null,
      currentPage: 1,
      pageSize: 10,
      t,
    }
  },
  computed: {
    filteredModules() {
      let result = this.modules
      if (this.searchKeyword) {
        result = result.filter((mod) =>
          mod.bind_prefix.toLowerCase().includes(this.searchKeyword.toLowerCase()),
        )
      }
      return result
    },
    pagedModules() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredModules.slice(start, end)
    },
    totalModules() {
      return this.filteredModules.length
    },
  },
  mounted() {
    this.refreshData()
  },
  methods: {
    debouncedRefresh() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => this.refreshData(), 300)
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    handleCurrentChange(page) {
      this.currentPage = page
    },
    async refreshData() {
      this.loading = true
      try {
        const response = await axios.get('/api/modules')
        if (response.status === 200 && response.data.modules) {
          this.modules = Object.entries(response.data.modules)
            .map(([name, info]) => {
              const isLoaded = Object.keys(info).length > 0
              return {
                name,
                bind_prefix: info?.bind_prefix || name,
                desc: info?.desc || '',
                developers: info?.developers || [],
                loaded: isLoaded,
                ...info,
              }
            })
            .sort((a, b) => a.name.localeCompare(b.name))
        }
      } catch (error) {
        ElMessage.error(this.$t('message.error.fetch') + error.message)
      } finally {
        this.loading = false
      }
    },

    async getRelatedModules(moduleName) {
      try {
        const res = await axios.get(`/api/module/${moduleName}/related`)
        return res.data.modules || []
      } catch (err) {
        ElMessage.error(this.$t('message.error.fetch') + error.message)
        return []
      }
    },

    async handleReload(row) {
      const related = await this.getRelatedModules(row.name)
      let msg = ''
      if (related.length === 0) {
        msg = this.t('data.modules.confirm.message.reload')
      } else {
        msg = this.t('data.modules.confirm.message.reload.extra', {
          modules: related.map((m) => `"${m}"`).join('、'),
        })
      }

      try {
        await ElMessageBox.confirm(msg, this.t('confirm.warning'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        })
        const res = await axios.post(`/api/module/${row.name}/reload`)
        if (res.status === 204) {
          ElMessage.success(this.t('data.modules.message.reload.success'))
          this.refreshData()
        }
      } catch (error) {
        if (error === 'cancel' || error?.message === 'cancel') {
          return
        }
        if (error.response?.status === 422) {
          ElMessage.error(this.t('data.modules.message.reload.error.failed'))
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message)
        }
      }
    },

    async handleUnload(row) {
      const related = await this.getRelatedModules(row.name)
      let msg = ''
      if (related.length === 0) {
        msg = this.$t('data.modules.confirm.message.unload')
      } else {
        msg = this.$t('data.modules.confirm.message.unload.extra', {
          modules: related.map((m) => `"${m}"`).join('、'),
        })
      }

      try {
        await ElMessageBox.confirm(msg, this.t('confirm.warning'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        })
        const res = await axios.post(`/api/module/${row.name}/unload`)
        if (res.status === 204) {
          ElMessage.success(this.t('data.modules.message.unload.success'))
          this.refreshData()
        }
      } catch (error) {
        if (error === 'cancel' || error?.message === 'cancel') {
          return
        }
        if (error.response?.status === 422) {
          ElMessage.error(this.$t('data.modules.message.unload.error.failed'))
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message)
        }
      }
    },

    async handleLoad(row) {
      try {
        const res = await axios.post(`/api/module/${row.name}/load`)
        if (res.status === 204) {
          ElMessage.success(this.t('data.modules.message.load.success'))
          this.refreshData()
        }
      } catch (error) {
        if (error.response?.status === 422) {
          ElMessage.error(this.t('data.modules.message.load.error.failed'))
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message)
        }
      }
    },
  },
}
</script>
<style scoped>
.module-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.unloaded {
  color: gray;
  font-style: oblique;
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

.pagination-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
}
</style>
