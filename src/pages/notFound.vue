<template>
  <el-result :title="$t('not_found.result.title')" :sub-title="$t('not_found.result.subtitle')">
    <template #icon>
      <div class="not-found-mark" aria-hidden="true">
        <span class="ak-sparkle"></span>
        <span class="not-found-code">404</span>
        <span class="ak-sparkle"></span>
      </div>
    </template>
    <template #extra>
      <el-button type="primary" @click="goHome">{{ $t('button.back') }}</el-button>
    </template>
  </el-result>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.not-found-mark {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 大号数字底下一道荧光笔，两侧各一颗四角星 */
.not-found-code {
  padding: 0 8px;
  font-family: var(--ak-font-display);
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--el-text-color-primary);
  background-image: var(--ak-gradient-soft);
  background-repeat: no-repeat;
  background-position: 0 90%;
  background-size: 100% 0.36em;
}

.not-found-mark .ak-sparkle:first-child {
  width: 18px;
  height: 18px;
  align-self: flex-start;
}

.not-found-mark .ak-sparkle:last-child {
  width: 28px;
  height: 28px;
  align-self: flex-end;
}
</style>
