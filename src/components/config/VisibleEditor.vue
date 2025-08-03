<template>
  <el-card class="editor-body" shadow="never">
    <div v-if="Object.keys(parsedSections).length">
      <el-form label-width="auto">
        <div v-for="(section, sectionKey) in parsedSections" :key="sectionKey">
          <div style="display: flex; align-items: center; gap: 8px">
            <h2>{{ sectionKey }}</h2>
            <el-button
              type="primary"
              size="small"
              @click="openAddDialog(sectionKey)"
              style="margin-bottom: 4px"
              ><i class="mdi mdi-plus-box-outline"></i> {{ $t('button.add') }}</el-button
            >
          </div>
          <div v-for="(item, key) in section.items" :key="key">
            <el-form-item :label="key">
              <div class="form-item-content">
                <component
                  :is="getComponent(item.type)"
                  v-model="item.value"
                  v-bind="getComponentProps(item.type)"
                  @change="updateTomlFromParsed"
                />
                <div class="type-selector">
                  <span>
                    <el-tooltip
                      v-if="item.comment"
                      effect="dark"
                      :content="item.comment"
                      placement="top"
                    >
                      <i
                        class="mdi mdi-help-circle-outline help-icon"
                        style="cursor: pointer"
                        @click="openEditCommentDialog(sectionKey, key, item)"
                      />
                    </el-tooltip>
                    <i
                      v-else
                      class="mdi mdi-plus-circle-outline help-icon"
                      style="cursor: pointer"
                      @click="openEditCommentDialog(sectionKey, key, item)"
                    />
                  </span>
                  <el-select
                    v-model="item.type"
                    size="small"
                    style="width: 80px"
                    placeholder="null"
                    @change="onTypeChange(item)"
                  >
                    <el-option value="str" label="str" />
                    <el-option value="bool" label="bool" />
                    <el-option value="num" label="num" />
                    <el-option value="array" label="array" />
                  </el-select>
                  <el-button
                    type="danger"
                    size="small"
                    style="margin-left: 8px"
                    @click="deleteConfig(sectionKey, key)"
                    ><i class="mdi mdi-delete-outline"></i> {{ $t('button.delete') }}</el-button
                  >
                </div>
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>
    <el-empty v-else />
    <el-dialog
      :title="$t('config.session.title.add_config')"
      v-model="addDialogVisible"
      width="400px"
      @close="resetAddDialog"
    >
      <el-form label-width="auto" ref="addFormRef" :model="addForm" :rules="addFormRules">
        <el-form-item :label="$t('config.key')" prop="key">
          <el-input v-model="addForm.key" :placeholder="$t('config.input.key')" />
        </el-form-item>
        <el-form-item :label="$t('config.comment')">
          <el-input v-model="addForm.comment" :placeholder="$t('config.input.comment')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ $t('button.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAddConfig">{{ $t('button.confirm') }}</el-button>
      </template>
    </el-dialog>
    <el-dialog
      :title="$t('config.session.title.edit_comment')"
      v-model="editCommentDialogVisible"
      width="400px"
      @close="resetEditCommentDialog"
    >
      <el-input v-model="editCommentValue" :placeholder="$t('config.input.comment')" clearable />
      <template #footer>
        <el-button @click="editCommentDialogVisible = false">{{ $t('button.cancel') }}</el-button>
        <el-button type="primary" @click="confirmEditComment">{{ $t('button.confirm') }}</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export default {
  name: 'VisibleEditor',
  props: {
    modelValue: String,
    options: Object,
  },
  emits: ['update:modelValue'],
  data() {
    const { t } = useI18n()
    return {
      tomlInput: '',
      parsedSections: {},
      addDialogVisible: false,
      addForm: { key: '', comment: '' },
      addFormRules: {
        key: [
          {
            required: true,
            message: this.$t('config.validate.key'),
            trigger: 'blur',
          },
          {
            pattern: /^[A-Za-z0-9_-]+$/,
            message: this.$t('config.validate.key_ascii'),
            trigger: 'blur',
          },
        ],
      },
      addSectionKey: '',
      editCommentDialogVisible: false,
      editCommentValue: '',
      editCommentSectionKey: '',
      editCommentKey: '',
      debouncedParse: null,
      t,
    }
  },
  mounted() {
    if (!this.tomlInput && this.modelValue) {
      this.tomlInput = this.modelValue
      this.parsedSections = this.parseTomlWithComments(this.tomlInput)
    }
    this.debouncedParse = debounce(() => {
      this.parsedSections = this.parseTomlWithComments(this.tomlInput)
    }, 200)
  },
  watch: {
    modelValue(newVal) {
      this.tomlInput = newVal
      this.parsedSections = this.parseTomlWithComments(this.tomlInput)
    },
    tomlInput(newVal) {
      this.$emit('update:modelValue', newVal)
      this.debouncedParse()
    },
  },
  created() {
    this.parsedSections = this.parseTomlWithComments(this.tomlInput)
  },
  methods: {
    openEditCommentDialog(sectionKey, key, item) {
      this.editCommentSectionKey = sectionKey
      this.editCommentKey = key
      this.editCommentValue = item.comment || ''
      this.editCommentDialogVisible = true
    },
    resetEditCommentDialog() {
      this.editCommentDialogVisible = false
      this.editCommentValue = ''
      this.editCommentSectionKey = ''
      this.editCommentKey = ''
    },
    confirmEditComment() {
      const section = this.parsedSections[this.editCommentSectionKey]
      if (section && section.items[this.editCommentKey]) {
        section.items[this.editCommentKey].comment = this.editCommentValue
      }
      this.resetEditCommentDialog()
      this.updateTomlFromParsed()
    },
    openAddDialog(sectionKey) {
      this.addSectionKey = sectionKey
      this.addForm = { key: '', comment: '' }
      this.addDialogVisible = true
    },
    resetAddDialog() {
      this.addForm = { key: '', comment: '' }
      this.addSectionKey = ''
    },
    confirmAddConfig() {
      this.$refs.addFormRef.validate((valid) => {
        if (!valid) return

        const key = this.addForm.key.trim()
        const section = this.parsedSections[this.addSectionKey]

        if (section.items[key]) {
          ElMessage.error(this.t('config.message.error.duplicated'))
          return
        }

        section.items[key] = {
          value: '',
          comment: this.addForm.comment,
          type: 'str',
        }

        this.addDialogVisible = false
        this.resetAddDialog()
        this.updateTomlFromParsed()
      })
    },
    deleteConfig(sectionKey, key) {
      const section = this.parsedSections[sectionKey]
      if (section && section.items[key] !== undefined) {
        delete section.items[key]
      }
      this.updateTomlFromParsed()
    },
    onTypeChange(item) {
      switch (item.type) {
        case 'bool':
          item.value = false
          break
        case 'num':
          item.value = 0
          break
        case 'array':
          item.value = []
          break
        default:
          item.value = ''
      }
      this.updateTomlFromParsed()
    },
    parseTomlWithComments(input) {
      const result = {}
      let currentSection = ''
      let sectionObj = null
      let i = 0,
        len = input.length,
        lineStart = 0

      while (i <= len) {
        if (i === len || input[i] === '\n') {
          const line = input.slice(lineStart, i).trim()
          lineStart = i + 1
          if (!line || line[0] === '#') {
            i++
            continue
          }
          if (line[0] === '[' && line[line.length - 1] === ']') {
            currentSection = line.slice(1, -1)
            sectionObj = { comment: '', items: {} }
            result[currentSection] = sectionObj
          } else if (
            currentSection &&
            (sectionObj = result[currentSection]) &&
            line.includes('=')
          ) {
            const eqIdx = line.indexOf('=')
            const key = line.slice(0, eqIdx).trim()
            let valueComment = line.slice(eqIdx + 1).trim()
            let valueStr = valueComment,
              comment = ''
            const hashIdx = valueComment.indexOf('#')
            if (hashIdx !== -1) {
              valueStr = valueComment.slice(0, hashIdx).trim()
              comment = valueComment.slice(hashIdx + 1).trim()
            } else {
              valueStr = valueComment
            }
            let value = null,
              type = null
            if (valueStr === 'true' || valueStr === 'false') {
              value = valueStr === 'true'
              type = 'bool'
            } else if (valueStr[0] === '[' && valueStr[valueStr.length - 1] === ']') {
              const arr = valueStr
                .slice(1, -1)
                .split(',')
                .map((s) => s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
                .filter((s) => s.trim() !== '')
              value = valueStr.length > 2 ? arr : []
              type = 'array'
            } else if (
              /^[+-]?\d+(\.\d+)?$/.test(valueStr) &&
              !/^[+-]?\d*\.$/.test(valueStr) &&
              !/^\.[0-9]+$/.test(valueStr)
            ) {
              value = parseFloat(valueStr)
              type = 'num'
            } else if (
              (valueStr[0] === '"' && valueStr[valueStr.length - 1] === '"') ||
              (valueStr[0] === "'" && valueStr[valueStr.length - 1] === "'")
            ) {
              value = valueStr.slice(1, -1)
              type = 'str'
            } else {
              value = null
              type = null
            }
            sectionObj.items[key] = { value, comment, type }
          }
          i++
        } else {
          i++
        }
      }
      return result
    },
    getComponent(type) {
      switch (type) {
        case 'bool':
          return 'el-switch'
        case 'num':
          return 'el-input-number'
        case 'array':
          return 'el-input-tag'
        default:
          return 'el-input'
      }
    },
    updateTomlFromParsed() {
      const lines = this.tomlInput.split('\n')
      const outputLines = []
      let currentSection = ''
      const handledKeys = {}

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i]
        const line = rawLine.trim()

        if (line.startsWith('[') && line.endsWith(']')) {
          if (currentSection && this.parsedSections[currentSection]) {
            const missingLines = this.getMissingLines(currentSection, handledKeys)
            outputLines.push(...missingLines)
          }

          currentSection = line.slice(1, -1)
          handledKeys[currentSection] = new Set()
          outputLines.push(rawLine)
          continue
        }

        if (line === '' || line.startsWith('#')) {
          outputLines.push(rawLine)
          continue
        }

        const eqIdx = line.indexOf('=')
        if (eqIdx !== -1 && currentSection && this.parsedSections[currentSection]) {
          const key = line.slice(0, eqIdx).trim()
          const item = this.parsedSections[currentSection].items[key]

          if (!item) {
            continue
          }

          let valueStr = ''
          switch (item.type) {
            case 'bool':
              valueStr = item.value ? 'true' : 'false'
              break
            case 'num':
              valueStr = isNaN(parseFloat(item.value)) ? '0' : String(item.value)
              break
            case 'array':
              valueStr = `[${item.value.map((v) => `"${v}"`).join(', ')}]`
              break
            case 'str':
              valueStr = `"${String(item.value)}"`
              break
            case null:
              valueStr = item.value === null ? '"<Replace me>"' : `"${String(item.value)}"`
              break
            default:
              valueStr = '"<Replace me>"'
              break
          }

          const commentStr = item.comment ? ` # ${item.comment}` : ''
          outputLines.push(`${key} = ${valueStr}${commentStr}`)
          handledKeys[currentSection].add(key)
        } else {
          outputLines.push(rawLine)
        }
      }

      if (currentSection && this.parsedSections[currentSection]) {
        const missingLines = this.getMissingLines(currentSection, handledKeys)
        outputLines.push(...missingLines)
      }

      this.tomlInput = outputLines.join('\n')
    },

    getMissingLines(sectionKey, handledKeys) {
      const missing = []
      const section = this.parsedSections[sectionKey]
      const seen = handledKeys[sectionKey] || new Set()

      for (const key in section.items) {
        if (!seen.has(key)) {
          const item = section.items[key]
          let valueStr = ''
          switch (item.type) {
            case 'bool':
              valueStr = item.value ? 'true' : 'false'
              break
            case 'num':
              valueStr = isNaN(parseFloat(item.value)) ? '0' : String(item.value)
              break
            case 'array':
              valueStr = `[${item.value.map((v) => `"${v}"`).join(', ')}]`
              break
            case 'str':
              valueStr = `"${String(item.value)}"`
              break
            case null:
              valueStr = item.value === null ? '"<Replace me>"' : `"${String(item.value)}"`
              break
            default:
              valueStr = '"<Replace me>"'
              break
          }
          const commentStr = item.comment ? ` # ${item.comment}` : ''
          missing.push(`${key} = ${valueStr}${commentStr}`)
        }
      }

      return missing
    },

    getComponentProps(type) {
      switch (type) {
        case 'bool':
          return {}
        case 'num':
          return {
            controlsPosition: 'right',
          }
        case 'array':
          return {
            placeholder: this.t('data.input.array'),
            clearable: true,
            style: {
              width: '100%',
              minWidth: '200px',
            },
          }
        default:
          return {
            clearable: true,
            style: {
              width: '100%',
              minWidth: '200px',
            },
          }
      }
    },
  },
}
</script>

<style scoped>
.editor-body {
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.form-item-content {
  width: 100%;
}

.type-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.type-selector .el-select {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.help-icon {
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.el-button i {
  margin-right: 6px;
}
</style>
