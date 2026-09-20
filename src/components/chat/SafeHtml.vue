<template>
  <!-- 渲染经 DOMPurify 清洗后的 HTML（Markdown 渲染结果） -->
  <div ref="root" v-bind="$attrs" @click="onClick"></div>
</template>

<script setup>
import DOMPurify from 'dompurify'
import { nextTick, onMounted, ref, watch } from 'vue'
import { ALLOWED_ATTR, ALLOWED_TAGS } from '@/utils/chatMessage.js'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  html: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['click'])

const root = ref(null)

const sanitizeAndSet = (value) => {
  if (!root.value) return
  root.value.innerHTML = DOMPurify.sanitize(value || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}

const onClick = (event) => emit('click', event)

onMounted(() => {
  sanitizeAndSet(props.html)
})

watch(
  () => props.html,
  (value) => {
    nextTick(() => sanitizeAndSet(value))
  },
)
</script>
