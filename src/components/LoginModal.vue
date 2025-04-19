<template>
  <div class="overlay">
    <div class="password-modal">
      <span>{{ $t('login.title') }}</span>
      <el-input
        v-model="password"
        :placeholder="$t('login.input.password')"
        show-password
        @keyup.enter="checkPassword"
      ></el-input>

      <div class="remember-device-container">
        <el-checkbox v-model="rememberDevice">{{ $t('login.checkbox.remember') }}</el-checkbox>
        <span
          class="forgot-password"
          @mouseenter="showTooltip = true"
          @mouseleave="showTooltip = false"
          >{{ $t('login.forgot_password.text') }}
        </span>
        <div v-show="showTooltip" class="tooltip">
          {{ $t('login.forgot_password.tooltip') }}
        </div>
      </div>

      <el-button
        type="primary"
        @click="checkPassword"
        :loading="loading"
        :disabled="loading"
      >
        {{ $t('login.button.login') }}
      </el-button>
    </div>
  </div>
</template>

<script>
import axios from "@/axios";
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

export default {
  setup() {
    const { t } = useI18n();
    const password = ref("");
    const rememberDevice = ref(false);
    const loading = ref(false);
    const showTooltip = ref(false);

    const checkPassword = async () => {
      loading.value = true;
      try {
        const response = await axios.post("/api/auth", {
          password: password.value,
          remember: rememberDevice.value,
        });

        if (response.status === 200) {
          ElMessage.success(t("login.message.success"));
          localStorage.setItem("noPassword", JSON.stringify(response.data.no_password));
          location.reload();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          ElMessage.error(t("login.message.failed"));
        } else if (error.response?.status === 403) {
          ElMessage.error(t("login.message.abuse"));
        } else {
          ElMessage.error(t("message.error.fetch") + error.message);
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      t,
      password,
      rememberDevice,
      loading,
      showTooltip,
      checkPassword,
    };
  },
};
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.password-modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 300px;
}
.dark .password-modal {
  background: #333;
  color: white;
}


.remember-device-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.forgot-password {
  color: #666;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.3s;
}
.forgot-password:hover {
  color: #333;
}

.dark .forgot-password {
  color: #ccc;
}

.dark .forgot-password:hover {
  color: white;
}

.tooltip {
  position: absolute;
  top: 50vh;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  z-index: 10;
}
</style>
