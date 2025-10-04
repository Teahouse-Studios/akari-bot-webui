<template>
  <div class="sql-console">
    <div class="button-toolbar">
      <el-button type="primary" :disabled="loading" @click="executeSQL">
        <i class="mdi mdi-console-line"></i> {{ $t("database.button.execute") }}
      </el-button>
      <el-button :disabled="loading" @click="clearSQL">
        <i class="mdi mdi-restart"></i> {{ $t("database.button.clear") }}
      </el-button>
    </div>

    <el-card class="editor-card" shadow="never">
      <div class="editor-area">
        <el-input
          type="textarea"
          v-model="sql"
          :placeholder="$t('database.input.sql')"
          resize="none"
          rows="9"
          class="sql-input"
        ></el-input>

        <el-card class="history-area" shadow="never">
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
      
      <div v-if="error" class="error">{{ error }}</div>

      <div v-else-if="affectedRows !== null" class="affected-rows">
        ({{ affectedRows }} row(s) affected)
      </div>

      <el-empty v-else-if="show_result && !result.length" />

      <div v-else class="table-wrapper">
        <el-table
          v-if="result.length"
          :data="pagedResult"
          stripe
          width="100%"
        >
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
    </el-card>
  </div>
</template>

<script>
import axios from "@/axios.mjs";
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default {
  data() {
    const { t } = useI18n()
    return {
      sql: "",
      show_result: false,
      result: [],
      error: "",
      affectedRows: null,
      history: [],
      historyPage: 1,
      resultPage: 1,
      historyPageSize: 5,
      resultPageSize: 10,
      loading: false,
      t
    };
  },
  computed: {
    pagedResult() {
      const start = (this.resultPage - 1) * this.resultPageSize;
      return this.result.slice(start, start + this.resultPageSize);
    },
    pagedHistory() {
      const start = (this.historyPage - 1) * this.historyPageSize;
      return this.history.slice(start, start + this.historyPageSize);
    },
  },
  methods: {
    async executeSQL() {
      if (!this.sql) return;
      this.result = [];
      this.error = "";
      this.affectedRows = null;
      this.show_result = false;
      this.history.unshift(this.sql);
      this.loading = true;
      try {
        const res = await axios.post("/api/database/exec", { sql: this.sql });
        this.show_result = true;
        if (res.data.success) {
          if (res.data.affected_rows !== undefined) {
            this.affectedRows = res.data.affected_rows;
          } else {
            this.result = res.data.data || [];
          }
          this.error = "";
        } else {
          this.result = [];
          this.error = res.data.error;
        }
      } catch (e) {
        ElMessage.error(this.t('message.error.fetch') + e.message)
      } finally {
        this.loading = false;
      }
    },
    clearSQL() {
      this.sql = "";
      this.result = [];
      this.error = "";
      this.show_result = false;
      this.resultPage = 1;
    },
    setSQL(item) {
      this.sql = item;
    },
  },
};
</script>

<style scoped>
.sql-console {
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
  gap: 16px;
  height: 200px;
}

.sql-input {
  flex: 1;
  min-height: 100px;
  height: 100%;
}

.history-area {
  flex: 1;
  height: 198px;
  display: flex;
  background-color: var(--el-fill-color-blank);
  flex-direction: column;
}

.history {
  flex: 1;
  overflow-y: auto;
  height: 120px;
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
}

@media (max-width: 384px) {
  .editor-area {
    flex-direction: column;
    height: 400px;
  }

  .sql-input,
  .history-area {
    width: 100%;
    height: 200px;
  }
}

.affected-rows {
  font-weight: bold;
  margin-bottom: 10px;
  color: #606266;
}

.error {
  color: red;
  margin-bottom: 10px;
  font-weight: bold;
}

.result-card {
  min-height: 300px;
  height: calc(100vh - 420px);
  overflow-y: auto;
}


.pagination-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  width: 100%;
}
</style>
