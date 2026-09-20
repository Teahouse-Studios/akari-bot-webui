<template>
  <div class="filter-container">
    <div class="filter-top-row">
      <div class="left-controls">
        <el-input
          v-model="search"
          :placeholder="$t('logs.input.search')"
          class="log-search-input"
          clearable
          @input="$emit('search')"
        >
          <template #prefix>
            <i class="mdi mdi-magnify"></i>
          </template>
        </el-input>
      </div>
      <div class="right-controls">
        <el-tooltip :content="$t('logs.button.refresh')" placement="bottom">
          <el-button class="log-refresh-button" circle @click="$emit('refresh')">
            <i class="mdi mdi-refresh"></i>
          </el-button>
        </el-tooltip>
        <el-switch v-model="scroll" />
        <span class="auto-scroll-label">{{ $t('logs.switch.auto_scroll') }}</span>
      </div>
    </div>

    <div class="filter-bottom-row">
      <el-button
        v-for="level in levels"
        :key="level"
        :class="['log-level-button', level.toLowerCase(), { active: activeLevels.includes(level) }]"
        @click="$emit('toggle-level', level)"
      >
        {{ level }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  searchText: {
    type: String,
    default: '',
  },
  autoScroll: {
    type: Boolean,
    default: true,
  },
  activeLevels: {
    type: Array,
    default: () => [],
  },
  levels: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:searchText',
  'update:autoScroll',
  'search',
  'refresh',
  'toggle-level',
])

const search = computed({
  get: () => props.searchText,
  set: (value) => emit('update:searchText', value),
})

const scroll = computed({
  get: () => props.autoScroll,
  set: (value) => emit('update:autoScroll', value),
})
</script>

<style scoped>
.filter-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}

.dark .filter-container {
  background-color: #555;
}

.filter-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.left-controls {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.log-search-input {
  flex-grow: 1;
  min-width: 100px;
}

.dark .log-search-input {
  background-color: #181818;
  border-radius: 5px;
}

.log-refresh-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 24px !important;
  margin-right: 10px;
  color: inherit;
  transition: color 0.3s ease;
}

.log-refresh-button:hover {
  background-color: transparent;
  color: #888;
}

.dark .log-refresh-button:hover {
  color: #aaa;
}

.auto-scroll-label {
  margin-left: 5px;
  cursor: default;
}

.right-controls {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 10px;
}

@media (max-width: 384px) {
  .right-controls {
    width: 100%;
    justify-content: flex-start;
  }
}

.filter-bottom-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 5px;
  overflow-x: auto;
}

.log-level-button {
  margin: 5px;
  background-color: transparent;
}

.log-level-button:hover {
  background-color: transparent;
}

.log-level-button + .log-level-button {
  margin-left: 5px;
}

.el-input {
  width: 100%;
  margin-top: 5px;
  margin-bottom: 5px;
}

.log-level-button.debug {
  color: #3b8ec9;
  border: 2px solid #3b8ec9;
}

.log-level-button.debug.active {
  color: white;
  background-color: #3b8ec9;
  border-color: #3b8ec9;
}

.log-level-button.info {
  color: #fff;
  border: 2px solid #fff;
}

.log-level-button.info.active {
  color: #333;
  background-color: #fff;
  border-color: #fff;
}

.log-level-button.success {
  color: #23d18b;
  border: 2px solid #23d18b;
}

.log-level-button.success.active {
  color: #333;
  background-color: #23d18b;
  border-color: #23d18b;
}

.log-level-button.warning {
  color: #f5f543;
  border: 2px solid #f5f543;
}

.log-level-button.warning.active {
  color: #333;
  background-color: #f5f543;
  border-color: #f5f543;
}

.log-level-button.error {
  color: #f14c4c;
  border: 2px solid #f14c4c;
}

.log-level-button.error.active {
  color: #fff;
  background-color: #f14c4c;
  border-color: #f14c4c;
}

.log-level-button.critical {
  color: #cd3131;
  background-color: #fff;
  border: 2px solid #cd3131;
}

.log-level-button.critical.active {
  color: #fff;
  background-color: #cd3131;
  border: 2px solid #fff;
}
</style>
