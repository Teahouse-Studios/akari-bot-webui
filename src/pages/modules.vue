<template>
  <div>
    <el-card class="module-card" shadow="never">
      <div class="header-container">
        <h3><i class="mdi mdi-puzzle"></i> {{ $t('modules.title') }}</h3>
        <el-tooltip :content="$t('button.refresh')" placement="top">
          <el-button
            link
            class="plain-icon-button"
            :disabled="loading"
            :aria-label="$t('button.refresh')"
            style="float: right; margin-left: 10px"
            @click="refreshAll"
          >
            <i class="mdi mdi-refresh"></i>
          </el-button>
        </el-tooltip>
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
        <el-table-column :label="$t('modules.table.type')" min-width="140">
          <template #default="{ row }">
            <el-tag class="module-type-tag" :class="`module-type-tag--${moduleType(row)}`">
              {{ $t(moduleTypeLabel(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('session.table.status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.loaded ? 'success' : 'danger'">
              {{ row.loaded ? $t('modules.tag.loaded') : $t('modules.tag.unloaded') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('table.operation')" min-width="220">
          <template #default="{ row }">
            <div class="row-actions">
              <el-tooltip :content="$t('modules.button.helpdoc')" placement="top">
                <el-button
                  link
                  size="small"
                  type="info"
                  class="row-action-button"
                  :aria-label="$t('modules.button.helpdoc')"
                  @click="handleHelp(row)"
                >
                  <i class="mdi mdi-help-circle-outline"></i>
                </el-button>
              </el-tooltip>

              <el-tooltip
                v-if="hasModuleConfig(row)"
                :content="$t('modules.button.config')"
                placement="top"
              >
                <el-button
                  link
                  size="small"
                  type="primary"
                  class="row-action-button"
                  :aria-label="$t('modules.button.config')"
                  @click="openConfigEditor(row)"
                >
                  <i class="mdi mdi-cog"></i>
                </el-button>
              </el-tooltip>

              <el-tooltip
                v-if="hasModuleFiles(row)"
                :content="$t('modules.button.files')"
                placement="top"
              >
                <el-button
                  link
                  size="small"
                  type="primary"
                  class="row-action-button"
                  :aria-label="$t('modules.button.files')"
                  @click="openFilesDialog(row)"
                >
                  <i class="mdi mdi-folder-outline"></i>
                </el-button>
              </el-tooltip>

              <el-tooltip
                v-if="!row.base && row.loaded"
                :content="$t('modules.button.unload')"
                placement="top"
              >
                <el-button
                  link
                  size="small"
                  type="warning"
                  class="row-action-button"
                  :aria-label="$t('modules.button.unload')"
                  @click="handleUnload(row)"
                >
                  <i class="mdi mdi-puzzle-remove"></i>
                </el-button>
              </el-tooltip>

              <el-tooltip
                v-if="!row.base && !row.loaded"
                :content="$t('modules.button.load')"
                placement="top"
              >
                <el-button
                  link
                  size="small"
                  type="success"
                  class="row-action-button"
                  :aria-label="$t('modules.button.load')"
                  @click="handleLoad(row)"
                >
                  <i class="mdi mdi-puzzle-plus"></i>
                </el-button>
              </el-tooltip>

              <el-tooltip :content="$t('modules.button.reload')" placement="top">
                <el-button
                  link
                  size="small"
                  type="danger"
                  class="row-action-button"
                  :aria-label="$t('modules.button.reload')"
                  @click="handleReload(row)"
                >
                  <i class="mdi mdi-reload"></i>
                </el-button>
              </el-tooltip>
            </div>
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
      width="600px"
    >
      <div v-if="helpDoc">
        <el-collapse v-if="hasAnyHelp" v-model="activeSections">
          <template #title
            ><b>{{ $t('modules.helpdoc.subtitle.desc') }}</b></template
          >
          <p>{{ helpDoc.desc }}</p>

          <el-collapse-item v-if="helpDoc.commands?.args?.length" name="commands">
            <template #title
              ><b>{{ $t('modules.helpdoc.subtitle.command') }}</b></template
            >
            <ul>
              <li v-for="cmd in helpDoc.commands.args" :key="cmd.args">
                <code class="help-code">{{ cmd.args }}</code>
                <span v-if="cmd.desc"> - {{ cmd.desc }}</span>
              </li>
            </ul>
          </el-collapse-item>

          <el-collapse-item v-if="helpDoc.commands?.options?.length" name="options">
            <template #title
              ><b>{{ $t('modules.helpdoc.subtitle.option') }}</b></template
            >
            <ul>
              <li v-for="opt in helpDoc.commands.options" :key="Object.keys(opt)[0]">
                <code class="help-code">{{ Object.keys(opt)[0] }}</code>
                <span v-if="Object.values(opt)[0]"> - {{ Object.values(opt)[0] }}</span>
              </li>
            </ul>
          </el-collapse-item>

          <el-collapse-item v-if="helpDoc.regexp?.length" name="regexp">
            <template #title
              ><b>{{ $t('modules.helpdoc.subtitle.regex') }}</b></template
            >
            <ul>
              <li v-for="r in helpDoc.regexp" :key="r.pattern">
                <code class="help-code">{{ r.pattern }}</code>
                <span v-if="r.desc"> - {{ r.desc }}</span>
              </li>
            </ul>
          </el-collapse-item>
        </el-collapse>

        <el-empty v-else :description="$t('modules.helpdoc.none')"></el-empty>
      </div>

      <template #footer>
        <el-button @click="helpDialogVisible = false">{{ $t('button.close') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="configDialogVisible"
      :title="$t('modules.config.title')"
      :width="moduleConfigDialogWidth"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      @close="resetConfigDialog"
    >
      <el-card v-if="configNotFound" shadow="never">
        <el-empty :description="$t('modules.config.none')" />
      </el-card>
      <VisibleEditor v-else-if="configDialogVisible" v-model="configContent" ref="visibleEditor" />
      <template #footer>
        <el-button @click="configDialogVisible = false">{{ $t('button.cancel') }}</el-button>
        <el-button type="primary" @click="applyConfig" :disabled="!unsavedConfigChanges">{{
          $t('button.apply')
        }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="filesDialogVisible"
      :title="$t('modules.files.title')"
      :width="moduleConfigDialogWidth"
      align-center
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      @close="resetFilesDialog"
    >
      <div class="module-files-dialog-body">
        <FileManager v-if="filesDialogVisible" :module-name="filesModuleName" embedded />
      </div>
      <template #footer>
        <el-button @click="filesDialogVisible = false">{{ $t('button.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'
import VisibleEditor from '@/components/config/VisibleEditor.vue'
import FileManager from '@/components/files/FileManager.vue'
import LocalStorageJson from '@/localStorageJson.js'

const { t } = useI18n()

const modules = ref([])
const searchKeyword = ref('')
const loading = ref(false)
const showBaseModules = ref(false)
const helpDialogVisible = ref(false)
const helpDoc = ref(null)
const activeSections = ref(['commands', 'options', 'regexp'])
const currentPage = ref(1)
const pageSize = ref(10)
const moduleConfigDialogWidth = ref('90%')
const debounceTimer = ref(null)
const configDialogVisible = ref(false)
const configModuleName = ref('')
const configContent = ref('')
const initialConfigContent = ref('')
const unsavedConfigChanges = ref(false)
const configNotFound = ref(false)
const filesDialogVisible = ref(false)
const filesModuleName = ref('')

/** 配置文件名与模块存储根目录，用于判断「配置」「文件」入口是否可用 */
const configFileNames = ref([])
const moduleStorageRoots = ref([])

const MODULE_TYPE_LABELS = {
  base: 'modules.type.base',
  extension: 'modules.type.extension',
  subscription: 'modules.type.subscription',
}

const moduleType = (row) => {
  if (row?.base) return 'base'
  if (row?.rss) return 'subscription'
  return 'extension'
}

const moduleTypeLabel = (row) => MODULE_TYPE_LABELS[moduleType(row)]

const configFileSet = computed(() => new Set(configFileNames.value))

const moduleFileRootSet = computed(
  () =>
    new Set(
      moduleStorageRoots.value
        .filter((root) => root.scope === 'module' && root.module)
        .map((root) => root.module),
    ),
)

/** 配置文件名、模块存储目录均以 Python 模块名为准 */
const modulePythonName = (row) => row._py_module_name || row.name

const hasModuleConfig = (row) =>
  !row.base && configFileSet.value.has(`module_${modulePythonName(row)}.toml`)

const hasModuleFiles = (row) => moduleFileRootSet.value.has(modulePythonName(row))

const filteredModules = computed(() => {
  let result = modules.value
  if (searchKeyword.value) {
    result = result.filter((mod) =>
      mod.bind_prefix.toLowerCase().includes(searchKeyword.value.toLowerCase()),
    )
  }
  if (!showBaseModules.value) {
    result = result.filter((mod) => !mod.base)
  }
  return result
})

const pagedModules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredModules.value.slice(start, end)
})

const totalModules = computed(() => filteredModules.value.length)

const hasAnyHelp = computed(() => {
  return (
    helpDoc.value?.desc ||
    helpDoc.value?.commands?.args?.length > 0 ||
    helpDoc.value?.commands?.options?.length > 0 ||
    helpDoc.value?.regexp?.length > 0
  )
})

watch(configContent, (newVal) => {
  unsavedConfigChanges.value = newVal !== initialConfigContent.value
})

const refreshData = async () => {
  loading.value = true
  try {
    const language = LocalStorageJson.getItem('language') || 'zh_cn'
    const response = await axios.get('/api/modules', { params: { locale: language } })
    if (response.status === 200 && response.data.modules) {
      modules.value = Object.entries(response.data.modules)
        .map(([name, info]) => {
          const base = info?.base === true
          return {
            ...info,
            name,
            bind_prefix: info?.bind_prefix || name,
            desc: info?.desc || '',
            developers: info?.developers || [],
            base,
            // 基础模块不可卸载，状态恒为已加载
            loaded: base || info?._db_load !== false,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    }
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + error.message)
  } finally {
    loading.value = false
  }
}

const debouncedRefresh = () => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => refreshData(), 300)
}

/** 读取已有配置文件与模块存储根目录；失败时保留上次结果，不阻塞模块列表 */
const loadModuleResources = async () => {
  const [configResponse, rootsResponse] = await Promise.allSettled([
    axios.get('/api/config'),
    axios.get('/api/files/roots'),
  ])

  if (configResponse.status === 'fulfilled') {
    const files = configResponse.value.data?.cfg_files
    configFileNames.value = Array.isArray(files) ? files : []
  }
  if (rootsResponse.status === 'fulfilled') {
    const roots = rootsResponse.value.data?.roots
    moduleStorageRoots.value = Array.isArray(roots) ? roots : []
  }
}

const refreshAll = () => Promise.all([refreshData(), loadModuleResources()])

const getRelatedModules = async (moduleName) => {
  try {
    const res = await axios.get(`/api/module/${moduleName}/related`)
    return res.data.modules || []
  } catch (err) {
    ElMessage.error(t('message.error.fetch') + err.message)
    return []
  }
}

const handleHelp = async (row) => {
  try {
    const language = LocalStorageJson.getItem('language') || 'zh_cn'
    const res = await axios.get(`/api/module/${row.name}/helpdoc`, { params: { locale: language } })
    if (res.status === 200) {
      helpDoc.value = res.data
      helpDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + error.message)
  }
}

const handleReload = async (row) => {
  let msg = ''
  if (row.base) {
    msg = t('modules.confirm.message.reload.base')
  } else {
    const related = await getRelatedModules(row.name)
    if (related.length === 0) {
      msg = t('modules.confirm.message.reload')
    } else {
      msg = t('modules.confirm.message.reload.extra', {
        modules: related.map((m) => t('format.quote', { msg: m })).join(t('format.delimiter')),
      })
    }
  }
  try {
    await ElMessageBox.confirm(msg, t('confirm.warning'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    })
    const res = await axios.post(`/api/module/${row.name}/reload`)
    if (res.status === 204) {
      ElMessage.success(t('modules.message.reload.success'))
      refreshData()
    }
  } catch (error) {
    if (error === 'cancel' || error?.message === 'cancel') return
    if (error.response?.status === 422) {
      ElMessage.error(t('modules.message.reload.error.failed'))
      refreshData()
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const handleUnload = async (row) => {
  try {
    const res = await axios.post(`/api/module/${row.name}/unload`)
    if (res.status === 204) {
      ElMessage.success(t('modules.message.unload.success'))
      refreshData()
    }
  } catch (error) {
    if (error.response?.status === 422) {
      ElMessage.error(t('modules.message.unload.error.failed'))
      refreshData()
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const handleLoad = async (row) => {
  try {
    const res = await axios.post(`/api/module/${row.name}/load`)
    if (res.status === 204) {
      ElMessage.success(t('modules.message.load.success'))
      refreshData()
    }
  } catch (error) {
    if (error.response?.status === 422) {
      ElMessage.error(t('modules.message.load.error.failed'))
      refreshData()
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const updateModuleConfigDialogWidth = () => {
  const screenWidth = window.innerWidth
  if (screenWidth < 1024) {
    moduleConfigDialogWidth.value = '90%'
  } else {
    const newWidth = screenWidth * 0.9 - 400
    moduleConfigDialogWidth.value = `${newWidth}px`
  }
}

const openFilesDialog = (row) => {
  filesModuleName.value = row._py_module_name || row.name
  filesDialogVisible.value = true
}

const resetFilesDialog = () => {
  filesDialogVisible.value = false
  filesModuleName.value = ''
}

const openConfigEditor = async (row) => {
  configModuleName.value = row._py_module_name
  configDialogVisible.value = true
  unsavedConfigChanges.value = false
  configNotFound.value = false
  try {
    const res = await axios.get(`/api/config/module_${configModuleName.value}.toml`)
    configContent.value = res.data.content
    initialConfigContent.value = res.data.content
  } catch (error) {
    if (error.response?.status === 404) {
      configNotFound.value = true
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
      configDialogVisible.value = false
    }
  }
}

const applyConfig = async () => {
  try {
    await axios.put(`/api/config/module_${configModuleName.value}.toml`, {
      content: configContent.value,
    })
    ElMessage.success(t('config.message.save.success'))
    initialConfigContent.value = configContent.value
    unsavedConfigChanges.value = false
    configDialogVisible.value = false
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + error.message)
  }
}

const resetConfigDialog = () => {
  configDialogVisible.value = false
  configModuleName.value = ''
  configContent.value = ''
  initialConfigContent.value = ''
  unsavedConfigChanges.value = false
  configNotFound.value = false
}

onMounted(() => {
  refreshAll()
  window.addEventListener('resize', updateModuleConfigDialogWidth)
  updateModuleConfigDialogWidth()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateModuleConfigDialogWidth)
})
</script>

<style scoped>
h3 {
  cursor: default;
}

.module-card {
  margin-bottom: 20px;
  line-height: 1;
  white-space: nowrap;
}

.unloaded {
  color: var(--el-text-color-secondary);
  font-style: oblique;
}

.el-tag.module-type-tag {
  font-weight: 500;
}

.el-tag.module-type-tag--base {
  --el-tag-bg-color: #f5d9c5;
  --el-tag-border-color: #e9af8b;
  --el-tag-text-color: #9f430b;
}

.el-tag.module-type-tag--extension {
  --el-tag-bg-color: #d1dfe9;
  --el-tag-border-color: #a2bfd1;
  --el-tag-text-color: #305e7a;
}

.el-tag.module-type-tag--subscription {
  --el-tag-bg-color: #cddfc9;
  --el-tag-border-color: #96be92;
  --el-tag-text-color: #2d5a27;
}

html.dark .el-tag.module-type-tag--base {
  --el-tag-bg-color: rgba(214, 128, 74, 0.16);
  --el-tag-border-color: rgba(214, 128, 74, 0.55);
  --el-tag-text-color: #e9af8b;
}

html.dark .el-tag.module-type-tag--extension {
  --el-tag-bg-color: rgba(109, 152, 179, 0.16);
  --el-tag-border-color: rgba(109, 152, 179, 0.55);
  --el-tag-text-color: #a2bfd1;
}

html.dark .el-tag.module-type-tag--subscription {
  --el-tag-bg-color: rgba(90, 143, 85, 0.16);
  --el-tag-border-color: rgba(90, 143, 85, 0.55);
  --el-tag-text-color: #96be92;
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

.pagination-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
}

.help-code {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

.module-files-dialog-body {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
