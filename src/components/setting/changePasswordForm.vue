<template>
  <h3>{{ $t('setting.change_password.title') }}</h3>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="150px">
    <el-form-item v-if="!noPassword" :label="$t('setting.change_password.input.old_password')" prop="old_password">
      <el-input v-model="form.old_password" type="password"/>
    </el-form-item>

    <el-form-item :label="$t('setting.change_password.input.new_password')" prop="new_password">
      <el-input v-model="form.new_password" type="password"/>
    </el-form-item>

    <el-form-item :label="$t('setting.change_password.input.confirm_password')" prop="confirm_password">
      <el-input v-model="form.confirm_password" type="password"/>
    </el-form-item>

    <el-form-item v-if="noPassword">
      <el-button type="primary" @click="handleUpdatePassword">{{ $t('setting.change_password.button.set_password') }}</el-button>
    </el-form-item>

    <el-form-item v-if="!noPassword" class="password-buttons">
      <el-button type="primary" @click="handleUpdatePassword">{{ $t('setting.change_password.button.update_password') }}</el-button>
      <el-button type="danger" @click="handleClearPassword">{{ $t('setting.change_password.button.clear_password') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import Cookies from "js-cookie";

export default {
  setup() {
    const { t } = useI18n();
    const formRef = ref(null);
    const form = ref({
      old_password: '',
      new_password: '',
      confirm_password: '',
    });

    const noPassword = ref(false);

    onMounted(() => {
      noPassword.value = localStorage.getItem('noPassword') === 'true';
    });

    const rules = {
      old_password: [
        { required: true, message: t('setting.change_password.validate.old_password'), trigger: 'blur' },
      ],
      new_password: [
        { required: true, message: t('setting.change_password.validate.new_password'), trigger: 'blur' },
      ],
      confirm_password: [
        { required: true, message: t('setting.change_password.validate.confirm_password'), trigger: 'blur' },
        { validator: (rule, value, callback) => {
          if (value !== form.value.new_password) {
            callback(new Error(t('setting.change_password.validate.inconsistent')));
          } else {
            callback();
          }
        }, trigger: 'blur' },
      ],
    };

    const handleUpdatePassword = async () => {
      try {
        try {
          await formRef.value.validate();
        } catch {
          return;
        }

        const requestData = {
          new_password: form.value.new_password,
        };

        if (!noPassword.value) {
          requestData.password = form.value.old_password;
        }

        const response = await axios.post('/api/change-password', requestData);

        if (response.status === 200) {
          ElMessage.success(t('setting.change_password.message.success.update'));
          Cookies.remove('XSRF-TOKEN');
          location.reload();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          ElMessage.error(t('setting.change_password.message.failed'));
        } else {
          ElMessage.error(t('message.error.fetch') + error.message);
        }
      }
    };

    const handleClearPassword = async () => {
      try {
        await formRef.value.validateField('old_password');
        
        ElMessageBox.confirm(t('setting.change_password.confirm.message'), t('confirm.title.warning'), {
          confirmButtonText: t('button.confirm'),
          cancelButtonText: t('button.cancel'),
          type: 'warning',
        })
        .then(async () => {
          await confirmClearPassword();
        })
        .catch(() => {
          return;
        });
      } catch {
        return;
      }
    };

    const confirmClearPassword = async () => {
      try {
        const requestData = {
          password: form.value.old_password,
        };

        const response = await axios.post('/api/clear-password', requestData);

        if (response.status === 200) {
          ElMessage.success(t('setting.change_password.message.success.clear'));
          Cookies.remove('XSRF-TOKEN');
          localStorage.removeItem("noPasswordPromptDisabled");
          location.reload();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          ElMessage.error(t('setting.change_password.message.failed'));
        } else {
          ElMessage.error(t('message.error.fetch') + error.message);
        }
      }
    };

    return {
      formRef,
      form,
      rules,
      handleUpdatePassword,
      noPassword,
      handleClearPassword,
      confirmClearPassword,
      t
    };
  },
};
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
}
</style>
