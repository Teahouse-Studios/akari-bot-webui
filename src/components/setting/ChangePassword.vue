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
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import Cookies from "js-cookie";

export default {
  data() {
    const { t } = useI18n();

    return {
      form: {
        old_password: '',
        new_password: '',
        confirm_password: '',
      },
      noPassword: false,
      rules: {
        old_password: [
          { required: true, message: this.$t('setting.change_password.validate.old_password'), trigger: 'blur' },
        ],
        new_password: [
          { required: true, message: this.$t('setting.change_password.validate.new_password'), trigger: 'blur' },
        ],
        confirm_password: [
          { required: true, message: this.$t('setting.change_password.validate.confirm_password'), trigger: 'blur' },
          { validator: (rule, value, callback) => {
            if (value !== this.form.new_password) {
              callback(new Error(this.$t('setting.change_password.validate.inconsistent')));
            } else {
              callback();
            }
          }, trigger: 'blur' },
        ],
      },
      t
    };
  },
  mounted() {
    this.noPassword = localStorage.getItem('noPassword') === 'true';
  },
  methods: {
    async handleUpdatePassword() {
      try {
        try {
          await this.$refs.formRef.validate();
        } catch {
          return;
        }

        const requestData = {
          new_password: this.form.new_password,
        };

        if (!this.noPassword) {
          requestData.password = this.form.old_password;
        }

        const response = await axios.post('/api/change-password', requestData);

        if (response.status === 200) {
          Cookies.remove('XSRF-TOKEN');
          location.reload();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          ElMessage.error(this.$t('setting.change_password.message.failed'));
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message);
        }
      }
    },

    async handleClearPassword() {
      try {
        await this.$refs.formRef.validateField('old_password');
        
        ElMessageBox.confirm(this.$t('setting.change_password.confirm.message'), this.$t('confirm.warning'), {
          confirmButtonText: this.$t('button.confirm'),
          cancelButtonText: this.$t('button.cancel'),
          type: 'warning',
        })
        .then(async () => {
          await this.confirmClearPassword();
        })
        .catch(() => {
          return;
        });
      } catch {
        return;
      }
    },

    async confirmClearPassword() {
      try {
        const requestData = {
          password: this.form.old_password,
        };

        const response = await axios.post('/api/clear-password', requestData);

        if (response.status === 200) {
          ElMessage.success(this.$t('setting.change_password.message.success.clear'));
          localStorage.removeItem("noPasswordPromptDisabled");
          location.reload();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          ElMessage.error(this.$t('setting.change_password.message.failed'));
        } else {
          ElMessage.error(this.$t('message.error.fetch') + error.message);
        }
      }
    }
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
  white-space: nowrap;
  overflow-x: auto;
}
</style>
