<template>
  <el-card class="webrender-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-layers-outline"></i>
        {{ $t('webrender.contexts.title') }}
      </h3>
      <el-tag size="small" type="info">{{ contextsTotal }}</el-tag>
    </div>

    <el-alert
      v-if="leaked"
      :title="$t('webrender.status.leaked')"
      type="warning"
      show-icon
      :closable="false"
      class="context-alert"
    />

    <div v-if="contexts.length" class="contexts-summary">
      <div class="summary-block">
        <span class="summary-caption">{{ $t('webrender.contexts.total') }}</span>
        <strong>{{ contextsTotal }}</strong>
      </div>
      <div class="summary-block">
        <span class="summary-caption">Pages</span>
        <strong>{{ pageCount }}</strong>
      </div>
    </div>

    <el-collapse v-if="contexts.length" class="contexts-collapse">
      <el-collapse-item
        v-for="context in contexts"
        :key="context.index"
        :name="String(context.index)"
      >
        <template #title>
          <div class="context-title-row">
            <span class="context-title">{{
              $t('webrender.contexts.index', { index: context.index })
            }}</span>
            <el-tag size="small" type="info">{{ context.pages?.length || 0 }}</el-tag>
          </div>
        </template>

        <div v-if="context.pages && context.pages.length" class="context-pages">
          <div v-for="(page, pageIdx) in context.pages" :key="pageIdx" class="context-page">
            <i class="mdi mdi-file-document-outline"></i>
            <span class="context-page-url">{{ page }}</span>
          </div>
        </div>
        <div v-else class="context-empty">{{ $t('webrender.contexts.empty') }}</div>
      </el-collapse-item>
    </el-collapse>

    <el-empty v-else :image-size="60" />
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ index, pages: [] }]
  contexts: {
    type: Array,
    default: () => [],
  },
  contextsTotal: {
    type: Number,
    default: 0,
  },
  leaked: {
    type: Boolean,
    default: false,
  },
})

const pageCount = computed(() =>
  props.contexts.reduce((total, context) => total + (context.pages?.length || 0), 0),
)
</script>

<style scoped>
.webrender-card {
  line-height: 1.4;
}

h3 {
  cursor: default;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.context-alert {
  margin-top: 12px;
}

.contexts-summary {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.summary-caption {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.contexts-collapse {
  margin-top: 12px;
}

.context-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-title {
  font-weight: 600;
  font-size: 13px;
}

.context-pages {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.context-page {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  min-width: 0;
}

.context-page-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
