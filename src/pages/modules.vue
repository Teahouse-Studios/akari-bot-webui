<template>
  <div>
    <el-card class="module-card" shadow="never">
      <div class="header-container">
        <h3><i class="mdi mdi-puzzle"></i> {{ $t('modules.title') }}</h3>
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
              :placeholder="$t('modules.input.module_name')"
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

      <div style="margin-bottom: 15px">
        <el-button type="info" size="small" @click="showBaseModules = !showBaseModules">
          <i :class="showBaseModules ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
          {{ showBaseModules ? $t('modules.button.hide_base') : $t('modules.button.show_base') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="pagedModules" style="width: 100%" stripe>
        <el-table-column :label="$t('modules.table.name')" min-width="140">
          <template #default="{ row }">
            <span :class="{ unloaded: !row.loaded }">{{ row.bind_prefix }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('modules.table.desc')" min-width="800">
          <template #default="{ row }">
            {{ row.desc || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('modules.table.developers')" min-width="400">
          <template #default="{ row }">
            <el-tag v-for="dev in row.developers" :key="dev" type="info" style="margin: 2px">
              {{ dev }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.table.status')" min-width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.base ? 'warning' : (row.loaded ? 'success' : 'danger')"
            >
              {{ row.base ? $t('modules.tag.base') : (row.loaded ? $t('modules.tag.loaded') : $t('modules.tag.unloaded')) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('data.table.operation')" min-width="360">
          <template #default="{ row }">
            <el-button
              size="small"
              type="info"
              @click="handleHelp(row)"
            >
              <i class="mdi mdi-help-circle-outline"></i> {{ $t('modules.button.helpdoc') }}
            </el-button>

              <el-button size="small" type="warning" @click="handleReload(row)">
                <i class="mdi mdi-reload"></i> {{ $t('modules.button.reload') }}
              </el-button>

              <el-button
                v-if="!row.base && row.loaded"
                size="small"
                type="danger"
                @click="handleUnload(row)"
              >
                <i class="mdi mdi-puzzle-remove"></i> {{ $t('modules.button.unload') }}
              </el-button>

              <el-button
                v-if="!row.base && !row.loaded"
                size="small"
                type="success"
                @click="handleLoad(row)">
                <i class="mdi mdi-puzzle-plus"></i> {{ $t('modules.button.load') }}
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
    <el-dialog
      v-model="helpDialogVisible"
      :title="$t('modules.helpdoc.title', { module: helpDoc?.module_name })"
      width="60%"
    >
      <div v-if="helpDoc">
        <el-collapse v-if="hasAnyHelp" v-model="activeSections">
          <template #title><b>{{ $t('modules.helpdoc.subtitle.desc') }}</b></template>
          <p>{{ helpDoc.desc }}</p>

          <el-collapse-item v-if="helpDoc.commands?.args?.length" name="commands">
            <template #title><b>{{ $t('modules.helpdoc.subtitle.command') }}</b></template>
            <ul>
              <li v-for="cmd in helpDoc.commands.args" :key="cmd.args">
                <code class="help-code">{{ cmd.args }}</code>
                <span v-if="cmd.desc"> - {{ cmd.desc }}</span>
              </li>
            </ul>
          </el-collapse-item>

          <el-collapse-item v-if="helpDoc.commands?.options?.length" name="options">
            <template #title><b>{{ $t('modules.helpdoc.subtitle.option') }}</b></template>
            <ul>
              <li v-for="opt in helpDoc.commands.options" :key="Object.keys(opt)[0]">
                <code class="help-code">{{ Object.keys(opt)[0] }}</code>
                <span v-if="Object.values(opt)[0]"> - {{ Object.values(opt)[0] }}</span>
              </li>
            </ul>
          </el-collapse-item>

          <el-collapse-item v-if="helpDoc.regexp?.length" name="regexp">
            <template #title><b>{{ $t('modules.helpdoc.subtitle.regex') }}</b></template>
            <ul>
              <li v-for="r in helpDoc.regexp" :key="r.pattern">
                <code class="help-code">{{ r.pattern }}</code>
                <span v-if="r.desc"> - {{ r.desc }}</span>
              </li>
            </ul>
          </el-collapse-item>
        </el-collapse>

        <!-- 全部为空 -->
        <el-empty v-else :description="$t('modules.helpdoc.none')"></el-empty>
      </div>

      <template #footer>
        <el-button @click="helpDialogVisible = false">{{ $t('button.close') }}</el-button>
      </template>
    </el-dialog>
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
      showBaseModules: false,
      helpDialogVisible: false,
      helpDoc: null,
      activeSections: ['commands', 'options', 'regexp'],
      currentPage: 1,
      pageSize: 10,
      debounceTimer: null,
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

      if (!this.showBaseModules) {
        result = result.filter((mod) => !mod.base)
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
    hasAnyHelp() {
      return (
        this.helpDoc?.desc ||
        (this.helpDoc?.commands?.args?.length > 0) ||
        (this.helpDoc?.commands?.options?.length > 0) ||
        (this.helpDoc?.regexp?.length > 0)
      )
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
        const language = localStorage.getItem('language') || 'zh_cn'
        const response = await axios.get('/api/modules', {
          params: {
            locale: language
          }
        })
        if (response.status === 200 && response.data.modules) {
          this.modules = Object.entries(response.data.modules)
            .map(([name, info]) => {
              const isLoaded = info?._db_load !== false
              return {
                name,
                bind_prefix: info?.bind_prefix || name,
                desc: info?.desc || '',
                developers: info?.developers || [],
                loaded: isLoaded,
                base: info?.base === true,
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

    async handleHelp(row) {
      try {
        const language = localStorage.getItem('language') || 'zh_cn'
        const res = await axios.get(`/api/module/${row.name}/helpdoc`, {
          params: {
            locale: language
          }
        })
        if (res.status === 200) {
          this.helpDoc = res.data
          this.helpDialogVisible = true
        }
      } catch (error) {
        ElMessage.error(this.$t('message.error.fetch') + error.message)
      }
    },

    async handleReload(row) {
      let msg = ''
      if (row.base) {
        msg = this.t('modules.confirm.message.reload.base')
      } else {
        const related = await this.getRelatedModules(row.name)
        if (related.length === 0) {
          msg = this.t('modules.confirm.message.reload')
        } else {
          msg = this.t('modules.confirm.message.reload.extra', {
            modules: related.map((m) => this.t("format.quote", {msg: m})).join(this.t("format.delimiter")),
          })
        }
      }


      try {
        await ElMessageBox.confirm(msg, this.t('confirm.warning'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        })
        const res = await axios.post(`/api/module/${row.name}/reload`)
        if (res.status === 204) {
          ElMessage.success(this.t('modules.message.reload.success'))
          this.refreshData()
        }
      } catch (error) {
        if (error === 'cancel' || error?.message === 'cancel') {
          return
        }
        if (error.response?.status === 422) {
          ElMessage.error(this.t('modules.message.reload.error.failed'))
          this.refreshData()
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message)
        }
      }
    },

    async handleUnload(row) {
      try {
        const res = await axios.post(`/api/module/${row.name}/unload`)
        if (res.status === 204) {
          ElMessage.success(this.t('modules.message.unload.success'))
          this.refreshData()
        }
      } catch (error) {
        if (error.response?.status === 422) {
          ElMessage.error(this.t('modules.message.unload.error.failed'))
          this.refreshData()
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message)
        }
      }
    },

    async handleLoad(row) {
      try {
        const res = await axios.post(`/api/module/${row.name}/load`)
        if (res.status === 204) {
          ElMessage.success(this.t('modules.message.load.success'))
          this.refreshData()
        }
      } catch (error) {
        if (error.response?.status === 422) {
          ElMessage.error(this.t('modules.message.load.error.failed'))
          this.refreshData()
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message)
        }
      }
    },
  },
}
</script>

<style>
.help-code {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}
</style>

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
