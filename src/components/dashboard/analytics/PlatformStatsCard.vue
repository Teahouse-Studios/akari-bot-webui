<template>
  <el-card class="fixed-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-format-list-numbered"></i>
        {{ $t('dashboard.analytics.platform.title') }}
      </h3>
    </div>
    <div v-if="items.length > 0">
      <div class="proportion-bar">
        <div
          v-for="item in items"
          :key="item.prefix"
          class="proportion-segment"
          :style="{
            width: Math.round((item.count / count) * 100 * 100) / 100 + '%',
            backgroundColor: getColorByIndex(item.prefix),
          }"
          :title="`${item.prefix}: ${item.count} (${Math.round((item.count / count) * 100 * 100) / 100}%)`"
        ></div>
      </div>
      <div class="ranking-total-label">
        <strong>{{ $t('dashboard.analytics.command.label.total') }}</strong>
        <span>{{ count || 0 }}</span>
      </div>
      <el-scrollbar height="260px">
        <div v-for="(item, index) in items" :key="item.prefix" class="ranking-item">
          <span
            :style="{
              backgroundColor: getColorByIndex(item.prefix),
              color: '#fff',
              borderRadius: '100%',
              padding: '6px 10px',
              display: 'inline-block',
              marginRight: '8px',
            }"
            >{{ index + 1 }}
          </span>
          <div class="ranking-label">
            <strong>{{ item.prefix }}</strong>
            <span>{{ item.count }}</span>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <el-empty v-else />
  </el-card>
</template>

<script setup>
import { getColorByIndex } from '@/utils/analytics.js'

defineProps({
  // [{ prefix, count }]
  items: {
    type: Array,
    default: () => [],
  },
  count: {
    type: Number,
    default: 0,
  },
})
</script>

<style scoped>
.el-card {
  line-height: 1;
}

.fixed-card {
  height: 450px;
  display: flex;
  flex-direction: column;
}

.fixed-card .el-card__body {
  flex: 1;
}

h3 {
  cursor: default;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.ranking-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.ranking-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
  width: 100%;
}

.ranking-total-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 14px;
  width: 100%;
}

.proportion-bar {
  display: flex;
  height: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 10px;
}

.proportion-segment {
  height: 100%;
  transition: width 0.3s ease;
}
</style>
