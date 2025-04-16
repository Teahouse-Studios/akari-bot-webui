<template>
  <h3>密码</h3>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
    <el-form-item v-if="!noPassword" label="旧密码" prop="old_password">
      <el-input v-model="form.old_password" type="password"/>
    </el-form-item>

    <el-form-item label="新密码" prop="new_password">
      <el-input v-model="form.new_password" type="password"/>
    </el-form-item>

    <el-form-item label="确认密码" prop="confirm_password">
      <el-input v-model="form.confirm_password" type="password"/>
    </el-form-item>

    <el-form-item v-if="noPassword">
      <el-button type="primary" @click="handleUpdatePassword">修改密码</el-button>
    </el-form-item>

    <el-form-item v-if="!noPassword" class="password-buttons">
      <el-button type="primary" @click="handleUpdatePassword">修改密码</el-button>
      <el-button type="danger" @click="handleClearPassword">清除密码</el-button>
    </el-form-item>
  </el-form>

  <el-dialog v-model="dialogVisible" title="确认清除密码">
    <span>您确定要清除密码吗？</span>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmClearPassword">确定</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Cookies from "js-cookie";

export default {
  setup() {
    const formRef = ref(null);
    const form = ref({
      old_password: '',
      new_password: '',
      confirm_password: '',
    });

    const noPassword = ref(false);
    const dialogVisible = ref(false);

    onMounted(() => {
      noPassword.value = localStorage.getItem('noPassword') === 'true';
    });

    const rules = {
      old_password: [
        { required: true, message: '请输入旧密码', trigger: 'blur' },
      ],
      new_password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
      ],
      confirm_password: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: (rule, value, callback) => {
          if (value !== form.value.new_password) {
            callback(new Error('两次密码输入不一致'));
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
          ElMessage.success('密码修改成功');
          Cookies.remove('XSRF-TOKEN');
          location.reload();
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          ElMessage.error('密码错误，请重新输入');
        } else {
          this.$message.error("请求失败：" + error.message);
        }
      }
    };

    const handleClearPassword = async () => {
      try {
        await formRef.value.validateField('old_password');
      } catch {
        return;
      }
      dialogVisible.value = true;
    };

    const confirmClearPassword = async () => {
      try {
        const requestData = {
          password: form.value.old_password,
        };

        const response = await axios.post('/api/clear-password', requestData);

        if (response.status === 200) {
          ElMessage.success('密码已清除');
          Cookies.remove('XSRF-TOKEN');
          location.reload();
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          ElMessage.error('密码错误，请重新输入');
        } else {
          this.$message.error("请求失败：" + error.message);
        }
      } finally {
      dialogVisible.value = false;
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
      dialogVisible,
    };
  },
};
</script>

<style scoped>
.el-input {
  width: 50%;
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
