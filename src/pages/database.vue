<template>
  <div v-if="isDevelopMode" class="database-page">
    <el-row gutter="24" class="database-row">
      <el-col :span="6" :xs="24" class="models-col">
        <DataModels />
      </el-col>
      <el-col :span="18" :xs="24" class="console-col">
        <SQLConsole />
      </el-col>
    </el-row>
  </div>

  <NotFound v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NotFound from './notFound.vue'
import SQLConsole from '@/components/database/SQLConsole.vue'
import DataModels from '@/components/database/DataModels.vue'
import { getIsDevelopMode } from '@/dev'

const isDevelopMode = ref(true)

onMounted(async () => {
  isDevelopMode.value = await getIsDevelopMode()
})
</script>

<style scoped>
h3 {
  cursor: default;
}

.database-page {
  /* 60px header + 40px el-main padding + 8px body margin-bottom */
  height: calc(100vh - 108px);
}

.database-row {
  height: 100%;
  align-items: stretch;
}

.models-col,
.console-col {
  height: 100%;
  min-height: 0;
}

.el-col > :deep(*) {
  height: 100%;
}

/* 模型列表卡片与右侧控制台同高，内容超出时在列表内滚动 */
.models-col > :deep(*) {
  height: 100%;
  max-height: 100%;
}

@media (max-width: 768px) {
  .database-page {
    height: auto;
  }

  .database-row {
    height: auto;
    row-gap: 16px;
  }

  /* 小螢幕時控制台在上、模型列表在下 */
  .console-col {
    order: -1;
  }

  .models-col {
    height: 320px;
  }
}
</style>
