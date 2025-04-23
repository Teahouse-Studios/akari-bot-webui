<template>
  <h3>{{ $t('setting.restart_bot.title') }}</h3>
  <el-button type="danger" @click="handleRestart">{{ $t('setting.restart_bot.button.restart') }}</el-button>
</template>

<script>
import axios from "@/axios";
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { useI18n } from 'vue-i18n';

export default {
  name: 'restartBotButton',
  data() {
    const { t } = useI18n();

    return {
      t
    };
  },
  methods: {
    async handleRestart() {
      try {
        await ElMessageBox.confirm(this.t('confirm.message'), this.t('confirm.warning'), {
          confirmButtonText: this.t('button.confirm'),
          cancelButtonText: this.t('button.cancel'),
          type: 'warning',
        });
        await this.restartBot();
      } catch (error) {
        return;
      }
    },
    
    async restartBot() {
      try {
        const response = await axios.post("/api/restart", {});
        if (response.status === 200) {
          ElLoading.service({
            fullscreen: true,
            text: this.t('setting.restart_bot.loading.text'),
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 10000);
        }
      } catch (error) {
        ElMessage.error(this.t('message.error.fetch') + error.message);
      }
    },
  },
};
</script>
