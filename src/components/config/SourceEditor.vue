<template>
  <div class="editor-body">
    <div ref="editor"></div>
  </div>
</template>

<script>
import { basicSetup } from 'codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'

export default {
  name: 'SourceEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editorView: null,
      editorOptions: {
        lineWrapping: true,
        theme: oneDark,
        lineNumbers: true,
        scrollbarStyle: 'native',
      },
    }
  },
  mounted() {
    this.initEditor()
  },
  beforeUnmount() {
    if (this.editorView) {
      this.editorView.destroy()
    }
  },
  watch: {
    modelValue(newVal) {
      if (this.editorView && this.editorView.state.doc.toString() !== newVal) {
        this.editorView.dispatch({
          changes: {
            from: 0,
            to: this.editorView.state.doc.length,
            insert: newVal,
          },
        })
      }
    },
  },
  methods: {
    initEditor() {
      const state = EditorState.create({
        doc: this.modelValue,
        extensions: [
          basicSetup,
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const value = update.state.doc.toString()
              this.$emit('update:modelValue', value)
            }
          }),
        ],
      })
      this.editorView = new EditorView({
        state,
        parent: this.$refs.editor,
      })
    },
    getContent() {
      return this.editorView ? this.editorView.state.doc.toString() : ''
    },
  },
}
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
