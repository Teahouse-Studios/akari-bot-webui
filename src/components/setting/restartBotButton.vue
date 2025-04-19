<template>
  <h3>重启机器人</h3>
  <el-button type="danger" @click="handleRestart">重启</el-button>
</template>

<script>
import axios from "@/axios";
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';

export default {
  name: 'restartBotButton',
  setup() {
    const handleRestart = async () => {
      try {
        await ElMessageBox.confirm('你确定吗?', '重启确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await restartBot();  // 直接调用 restartBot，而不需要 then() 和 catch()
      } catch (error) {
        // 处理用户取消或其他异常
        return;
      }
    };

    const restartBot = async () => {
      try {
        await axios.post("/api/restart", {});
      } catch (error) {
        if (error.message === "Network Error") {
          ElLoading.service({
            fullscreen: true,
            text: '正在重启...',
          });

          setTimeout(() => {
            window.location.href = '/';
          }, 10000);
        } else {
          ElMessage.error("请求失败：" + error.message);
        }
      }
    };

    return {
      handleRestart,
    };
  },
};
</script>