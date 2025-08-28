<template>
  <div>
    <el-button-group class="active-button-group">
      <el-button
        :type="activeCard === 'session' ? 'primary' : 'default'"
        @click="activeCard = 'session'"
        ><i class="mdi mdi-forum"></i
      ></el-button>
      <el-button :type="activeCard === 'user' ? 'primary' : 'default'" @click="activeCard = 'user'"
        ><i class="mdi mdi-account"></i
      ></el-button>
    </el-button-group>
    <SessionManager v-if="activeCard === 'session'" />

    <UserManager v-else />
  </div>
</template>

<script>
import { ref } from 'vue'
import SessionManager from '@/components/data/SessionManager.vue'
import UserManager from '@/components/data/UserManager.vue'

export default {
  name: 'DataPage',
  components: {
    SessionManager,
    UserManager,
  },
  setup() {
    const activeCard = ref('session') // 默认显示会话管理
    return {
      activeCard,
    }
  },
}
</script>

<style scoped>
.active-button-group {
  margin-bottom: 1rem;
}

.active-button-group .el-button {
  font-size: 18px;
}
</style>
