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
  setup() {
    const { t } = useI18n();

    const handleRestart = async () => {
      try {
        await ElMessageBox.confirm(t('confirm.message'), t('confirm.title.warning'), {
          confirmButtonText: t('button.confirm'),
          cancelButtonText: t('button.cancel'),
          type: 'warning',
        });
        await restartBot();

      } catch (error) {
        return;
      }
    };

    const restartBot = async () => {
      try {
        const response = await axios.post("/api/restart", {});
        if (response.status === 200) {
          ElLoading.service({
            fullscreen: true,
            text: t('setting.restart_bot.loading.text'),
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 10000);
        }
      } catch (error) {
        ElMessage.error(t('message.error.fetch') + error.message);
      }
    };

    return {
      handleRestart,
      t
    };
  },
};
</script>