<template>
  <div class="sql-console">
    <el-card class="editor-card" shadow="never">
      <div class="button-toolbar">
        <el-button type="primary" size="small" :disabled="loading" @click="executeSQL">
          <i class="mdi mdi-console-line"></i> {{ $t('database.button.execute') }}
        </el-button>
        <el-button size="small" :disabled="loading" @click="clearSQL">
          <i class="mdi mdi-restart"></i> {{ $t('database.button.clear') }}
        </el-button>
      </div>

      <div class="editor-area">
        <el-input
          type="textarea"
          v-model="sql"
          placeholder="SELECT * FROM ...;"
          resize="none"
          rows="9"
          class="sql-input"
        ></el-input>

        <el-card class="history-area" shadow="never">
          <span><i class="mdi mdi-history"></i> {{ $t('database.sql.history.title') }}</span>
          <div class="history">
            <div
              v-for="(item, index) in pagedHistory"
              :key="index"
              class="history-item"
              @click="setSQL(item)"
            >
              {{ item }}
            </div>
          </div>
          <div class="pagination-wrapper">
            <el-pagination
              v-if="history.length > historyPageSize"
              layout="prev, pager, next"
              :page-size="historyPageSize"
              :total="history.length"
              v-model:current-page="historyPage"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <el-card class="result-card" shadow="never" v-loading="loading">
      <h3><i class="mdi mdi-console-line"></i> {{ $t('database.sql.result.title') }}</h3>
      <div class="result-area">
        <div v-if="error" class="error">{{ error }}</div>

        <div v-else-if="affectedRows !== null" class="affected-rows">
          ({{ affectedRows }} row(s) affected)
        </div>

        <el-empty
          v-else-if="!result.length"
          class="result-empty"
          :description="$t('database.sql.result.empty')"
          :image-size="80"
        />

        <div v-else>
          <div class="table-wrapper">
            <el-table v-if="result.length" :data="pagedResult" stripe width="100%">
              <el-table-column
                v-for="(value, key) in result[0]"
                :key="key"
                :prop="key"
                :label="key"
              />
            </el-table>
          </div>

          <div class="pagination-wrapper">
            <el-pagination
              v-if="result.length > resultPageSize"
              background
              layout="prev, pager, next"
              :page-size="resultPageSize"
              :total="result.length"
              style="margin-top: 20px"
              v-model:current-page="resultPage"
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from '@/axios.mjs'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const sql = ref('')
const result = ref([])
const error = ref('')
const affectedRows = ref(null)
const history = ref([])
const historyPage = ref(1)
const resultPage = ref(1)
const historyPageSize = ref(5)
const resultPageSize = ref(10)
const loading = ref(false)

const pagedResult = computed(() => {
  const start = (resultPage.value - 1) * resultPageSize.value
  return result.value.slice(start, start + resultPageSize.value)
})

const pagedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize.value
  return history.value.slice(start, start + historyPageSize.value)
})

const executeSQL = async () => {
  if (!sql.value) return

  result.value = []
  error.value = ''
  affectedRows.value = null
  history.value.unshift(sql.value)
  loading.value = true

  try {
    const res = await axios.post('/api/dev/database/exec', { sql: sql.value })

    if (res.data.success) {
      if (res.data.affected_rows !== undefined) {
        affectedRows.value = res.data.affected_rows
      } else {
        result.value = res.data.data || []
      }
      error.value = ''
    } else {
      result.value = []
      error.value = res.data.error
    }
  } catch (e) {
    ElMessage.error(t('message.error.fetch') + e.message)
  } finally {
    loading.value = false
  }
}

const clearSQL = () => {
  sql.value = ''
  result.value = []
  error.value = ''
  resultPage.value = 1
}

const setSQL = (item) => {
  sql.value = item
}
</script>

<style scoped>
h3 {
  cursor: default;
}

.sql-console {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 控制台与下方执行结果平分可用高度，避免窗口变矮时结果被挤没 */
.editor-card {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-card ::v-deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.button-toolbar {
  flex-wrap: wrap;
}

.button-toolbar .el-button i {
  margin-right: 8px;
}

.editor-area {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
}

.sql-input {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.sql-input ::v-deep(.el-textarea__inner) {
  height: 100%;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}

.history-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  background-color: var(--el-fill-color-blank);
  flex-direction: column;
}

.history-area ::v-deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.history-area span {
  cursor: default;
}

.history {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  cursor: pointer;
  word-break: break-word;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}

.history-empty ::v-deep(.el-empty__description) {
  margin-top: 4px;
  font-size: 12px;
}

@media (max-width: 384px) {
  .editor-area {
    flex-direction: column;
    height: 400px;
    min-height: 0;
  }

  .sql-input,
  .history-area {
    width: 100%;
    min-height: 0;
  }
}

.affected-rows {
  margin-bottom: 10px;
  color: var(--el-text-color-regular);
}

.error {
  margin-bottom: 10px;
  color: var(--el-color-danger);
}

.result-card {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.result-card ::v-deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-area {
  flex: 1;
  min-height: 0;
  padding-bottom: 40px;
  overflow-y: auto;
}

.result-empty {
  padding: 24px 0;
}

.pagination-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
}

@media (max-width: 768px) {
  .sql-console {
    height: auto;
  }

  /* 小螢幕改回依內容高度排列，避免上下兩塊各被壓成半個螢幕 */
  .editor-card {
    flex: 0 0 auto;
  }

  .editor-area {
    min-height: 200px;
  }

  .result-card {
    flex: 1 1 auto;
    min-height: 300px;
  }
}
</style>
