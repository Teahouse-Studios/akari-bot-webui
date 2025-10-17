<template>
  <div v-loading="loading">
    <h3><i class="mdi mdi-lock"></i> {{ $t('setting.change_password.title') }}</h3>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
      <el-form-item
        v-if="!noPassword"
        :label="$t('setting.change_password.input.old_password')"
        prop="old_password"
      >
        <el-input v-model="form.old_password" type="password" />
      </el-form-item>

      <el-form-item
        v-if="!noPassword"
        :label="$t('setting.change_password.input.new_password')"
        prop="new_password"
      >
        <el-input v-model="form.new_password" type="password" />
      </el-form-item>

      <el-form-item
        v-if="noPassword"
        :label="$t('setting.change_password.input.set_password')"
        prop="new_password"
      >
        <el-input v-model="form.new_password" type="password" />
      </el-form-item>

      <el-form-item
        :label="$t('setting.change_password.input.confirm_password')"
        prop="confirm_password"
      >
        <el-input v-model="form.confirm_password" type="password" />
      </el-form-item>

      <el-form-item v-if="noPassword">
        <el-button type="primary" @click="handleUpdatePassword">{{
          $t('setting.change_password.button.set_password')
        }}</el-button>
      </el-form-item>

      <el-form-item v-if="!noPassword">
        <div class="password-buttons">
          <el-button type="primary" @click="handleUpdatePassword">{{
            $t('setting.change_password.button.update_password')
          }}</el-button>
          <el-button type="danger" @click="handleClearPassword">{{
            $t('setting.change_password.button.clear_password')
          }}</el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'

const { t } = useI18n()

const formRef = ref(null)

const loading = ref(true)
const noPassword = ref(false)

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const rules = reactive({
  old_password: [
    {
      required: true,
      message: t('setting.change_password.validate.old_password'),
      trigger: 'blur',
    },
  ],
  new_password: [
    {
      required: true,
      message: t('setting.change_password.validate.new_password'),
      trigger: 'blur',
    },
  ],
  confirm_password: [
    {
      required: true,
      message: t('setting.change_password.validate.confirm_password'),
      trigger: 'blur',
    },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.new_password) {
          callback(new Error(t('setting.change_password.validate.inconsistent')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/password')
    noPassword.value = !data.have_password
  } catch (error) {
    ElMessage.error(t('message.error.fetch') + error.message)
  } finally {
    loading.value = false
  }
})

const handleUpdatePassword = async () => {
  try {
    await formRef.value.validate()

    const requestData = { new_password: form.new_password }
    if (!noPassword.value) {
      requestData.password = form.old_password
    }

    const response = await axios.put('/api/password', requestData)
    if (response.status === 205) location.reload()
  } catch (error) {
    if (error.response?.status === 401) {
      ElMessage.error(t('setting.change_password.message.failed'))
    } else if (error.response?.status === 403 && IS_DEMO) {
      ElMessage.error(t('message.error.demo'))
    } else if (error.message) {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}

const handleClearPassword = async () => {
  try {
    await formRef.value.validateField('old_password')

    ElMessageBox.confirm(t('setting.change_password.confirm.message'), t('confirm.warning'), {
      confirmButtonText: t('button.confirm'),
      cancelButtonText: t('button.cancel'),
      type: 'warning',
    })
      .then(async () => {
        await confirmClearPassword()
      })
      .catch(() => {})
  } catch {}
}

const confirmClearPassword = async () => {
  try {
    const response = await axios.delete('/api/password', {
      data: { password: form.old_password },
    })

    if (response.status === 205) {
      ElMessage.success(t('setting.change_password.message.success.clear'))
      localStorage.removeItem('noPasswordPromptDisabled')
      location.reload()
    }
  } catch (error) {
    if (error.response?.status === 401) {
      ElMessage.error(t('setting.change_password.message.failed'))
    } else {
      ElMessage.error(t('message.error.fetch') + error.message)
    }
  }
}
</script>

<style scoped>
.el-input {
  width: 300px;
}

.el-form-item {
  margin-bottom: 20px;
}

.password-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  white-space: nowrap;
  overflow-x: hidden;
}

.el-button + .el-button {
  margin-left: 5px;
}
</style>
