<template>
  <el-card class="data-models" shadow="never">
    <h3><i class="mdi mdi-database"></i> {{ $t('database.models.title') }}</h3>

    <div class="models">
      <el-collapse v-model="expandedKeys" accordion style="width: 100%">
        <el-collapse-item
          v-for="model in modelList"
          :key="model.model"
          :name="model.model"
          @click="fetchFields(model)"
        >
          <template #title>
            <span class="model-title" :title="model.model">{{ model.model }}</span>
          </template>
          <el-table :data="model.fields" size="small" style="width: 100%">
            <el-table-column
              prop="name"
              :label="t('database.models.label.name')"
              show-overflow-tooltip
            />
            <el-table-column
              prop="type"
              :label="t('database.models.label.type')"
              show-overflow-tooltip
            />
            <el-table-column
              prop="max_length"
              :label="t('database.models.label.max_length')"
              show-overflow-tooltip
            />
            <el-table-column
              prop="nullable"
              :label="t('database.models.label.nullable')"
              show-overflow-tooltip
            />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axios.mjs'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const modelList = ref([])
const expandedKeys = ref([])

const fetchModels = async () => {
  try {
    const res = await axios.get('/api/dev/database/list')
    modelList.value = res.data.model_list.map((model) => ({ model, fields: [] }))
  } catch (e) {
    ElMessage.error(t('message.error.fetch') + e.message)
  }
}

const fetchFields = async (model) => {
  if (model.fields.length) return
  try {
    const res = await axios.get(`/api/dev/database/field/${model.model}`)
    model.fields = res.data.model_fields
  } catch (e) {
    ElMessage.error(t('message.error.fetch') + e.message)
  }
}

onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
h3 {
  cursor: default;
}

.data-models {
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.data-models ::v-deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.models {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: block;
}

.models ::v-deep(.el-collapse-item__title) {
  flex: 1;
  min-width: 0;
}

.model-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.models ::v-deep(.el-table .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
