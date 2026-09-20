<template>
  <div ref="logViewer" class="log-viewer">
    <div v-for="(logLine, index) in lines" :key="index">
      <span v-for="(part, partIndex) in logLine" :key="partIndex" :style="part.style">
        <template v-for="(seg, sIndex) in splitTextIntoSegments(part.text)" :key="sIndex">
          <span v-if="seg.type === 'text'">{{ seg.text }}</span>
          <a v-else class="external-link" @click.prevent="confirmExternal(seg.url)">{{
            seg.text
          }}</a>
        </template>
      </span>
    </div>

    <div v-if="lines.length === 0" class="log-viewer-placeholder">
      There are currently no matching logs here...<br />Use the filters above to adjust the options.
      <!--写死的，不能国际化-->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { confirmExternalLink } from '@/components/confirmExternalLink.js'
import { splitTextIntoSegments } from '@/utils/logFormat.js'

defineProps({
  lines: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const logViewer = ref(null)

function confirmExternal(url) {
  confirmExternalLink(url, t)
}

function scrollToBottom() {
  if (logViewer.value) logViewer.value.scrollTop = logViewer.value.scrollHeight
}

function scrollToTop() {
  if (logViewer.value) logViewer.value.scrollTop = 0
}

defineExpose({
  logViewer,
  scrollToBottom,
  scrollToTop,
})
</script>

<style scoped>
.log-viewer {
  flex-grow: 1;
  height: calc(100vh - 260px);
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;
  background-color: #0c0c0c;
  color: #fff;
  padding: 10px;
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.log-viewer-placeholder {
  color: #636363;
  white-space: normal;
}

.external-link {
  color: inherit;
  cursor: pointer;
  text-decoration: none;
}

.external-link:hover {
  text-decoration: underline;
}
</style>
