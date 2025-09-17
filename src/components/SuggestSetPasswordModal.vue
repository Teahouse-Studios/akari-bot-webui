<template>
  <el-dialog
    :title="$t('suggest_set_password.title')"
    v-model="dialogVisible"
    width="400px"
    align-center
  >
    <p>{{ $t('suggest_set_password.text') }}</p>
    <el-checkbox v-model="noMorePrompt">{{
      $t('suggest_set_password.checkbox.no_more_prompt')
    }}</el-checkbox>
    <template #footer>
      <el-button @click="handleClose">{{ $t('suggest_set_password.button.cancel') }}</el-button>
      <el-button type="primary" @click="goToSetting">{{
        $t('suggest_set_password.button.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'SuggestSetPasswordModal',
  props: {
    modelValue: {
      type: Boolean,
    },
  },
  emits: ['update:modelValue'],
  data() {
    const { t } = useI18n()
    return {
      t,
      noMorePrompt: false,
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(val) {
        this.$emit('update:modelValue', val)
      },
    },
  },
  methods: {
    handleClose() {
      if (this.noMorePrompt) {
        localStorage.setItem('noPasswordPromptDisabled', 'true')
      }
      this.dialogVisible = false
    },
    goToSetting() {
      if (this.noMorePrompt) {
        localStorage.setItem('noPasswordPromptDisabled', 'true')
      }
      this.dialogVisible = false
      this.$router.push({ name: 'setting' })
    },
  },
}
</script>
