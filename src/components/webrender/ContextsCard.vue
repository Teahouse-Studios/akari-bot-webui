<template>
  <el-card class="webrender-card" shadow="never">
    <div class="card-header">
      <h3>
        <i class="mdi mdi-layers-outline"></i>
        {{ $t('webrender.contexts.title') }}
      </h3>
      <span class="contexts-total">
        {{ $t('webrender.contexts.total') }}: {{ contextsTotal }}
      </span>
    </div>

    <el-alert
      v-if="leaked"
      :title="$t('webrender.status.leaked')"
      type="warning"
      show-icon
      :closable="false"
      class="context-alert"
    />

    <div v-if="contexts.length" class="contexts-list">
      <div v-for="context in contexts" :key="context.index" class="context-item">
        <div class="context-title">
          <i class="mdi mdi-chevron-right"></i>
          {{ $t('webrender.contexts.index', { index: context.index }) }}
        </div>
        <div v-if="context.pages && context.pages.length" class="context-pages">
          <div v-for="(page, pageIdx) in context.pages" :key="pageIdx" class="context-page">
            <i class="mdi mdi-file-document-outline"></i>
            <span class="context-page-url">{{ page }}</span>
          </div>
        </div>
        <div v-else class="context-empty">{{ $t('webrender.contexts.empty') }}</div>
      </div>
    </div>

    <el-empty v-else :description="$t('webrender.contexts.none')" :image-size="60" />
  </el-card>
</template>

<script setup>
defineProps({
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

.contexts-total {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.context-alert {
  margin-top: 12px;
}

.contexts-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.context-item {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 8px 10px;
}

.context-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
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
