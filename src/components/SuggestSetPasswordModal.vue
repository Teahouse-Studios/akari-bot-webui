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

<script setup>
import { ref, computed } from 'vue'
import LocalStorageJson from '@/localStorageJson.js'
import { useRouter } from 'vue-router'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  default: false,
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()

const noMorePrompt = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function handleClose() {
  if (noMorePrompt.value) {
    LocalStorageJson.setItem('noPasswordPromptDisabled', 'true')
  }
  dialogVisible.value = false
}

function goToSetting() {
  if (noMorePrompt.value) {
    LocalStorageJson.setItem('noPasswordPromptDisabled', 'true')
  }
  dialogVisible.value = false
  router.push({ name: 'setting' })
}
</script>
