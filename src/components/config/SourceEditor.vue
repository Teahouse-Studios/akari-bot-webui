<template>
  <div class="editor-body">
    <div ref="editor"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const editor = ref(null)
let editorView = null

const initEditor = () => {
  const state = EditorState.create({
    doc: __props.modelValue,
    extensions: [
      basicSetup,
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const value = update.state.doc.toString()
          emit('update:modelValue', value)
        }
      }),
    ],
  })

  editorView = new EditorView({
    state,
    parent: editor.value,
  })
}

watch(
  () => __props.modelValue,
  (newVal) => {
    if (editorView && editorView.state.doc.toString() !== newVal) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newVal,
        },
      })
    }
  }
)

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy()
  }
})
</script>

<style scoped>
.editor-body {
  height: calc(100vh - 260px);
  overflow: auto;
  border-radius: 4px;
}

::v-deep(.cm-editor) {
  height: calc(100vh - 260px);
}

::v-deep(.cm-gutters) {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

::v-deep(.cm-content) {
  font-family: 'Consolas', 'Noto Sans Mono', 'Courier New', Courier, monospace;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
