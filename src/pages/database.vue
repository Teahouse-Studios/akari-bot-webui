<template>
  <div v-if="isDevelopMode">
    <el-row gutter="24">
      <el-col :span="6" :xs="24">
        <DataModels />
      </el-col>
      <el-col :span="18" :xs="24">
        <SQLConsole />
      </el-col>
    </el-row>
  </div>

  <NotFound v-else />
</template>

<script setup>
import { ref } from 'vue'
import SQLConsole from '@/components/database/SQLConsole.vue'
import DataModels from '@/components/database/DataModels.vue'
import NotFound from './notFound.vue'
import { IS_DEMO } from '@/const'

const isDevelopMode = ref(localStorage.getItem('isDevelopMode') === 'true' && !IS_DEMO)
</script>

<style scoped>
h3 {
  cursor: default;
}

@media (max-width: 768px) {
  .el-row {
    row-gap: 16px;
  }
}
</style>
