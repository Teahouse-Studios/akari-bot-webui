<template>
  <div>
    <el-button-group class="mb-4">
      <el-button :type="activeCard === 'session' ? 'primary' : 'default'" @click="activeCard = 'session'"><i class="mdi mdi-forum"></i></el-button>
      <el-button :type="activeCard === 'user' ? 'primary' : 'default'" @click="activeCard = 'user'"><i class="mdi mdi-account"></i></el-button>
    </el-button-group>

    <div v-if="activeCard === 'session'">
      <SessionManager />
    </div>
    <div v-else>
      <UserManager />
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import SessionManager from "@/components/data/SessionManager.vue";
import UserManager from "@/components/data/UserManager.vue";

export default {
  components: {
    SessionManager,
    UserManager
  },
  setup() {
    const activeCard = ref('session'); // 默认显示会话管理
    return {
      activeCard
    };
  }
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>
