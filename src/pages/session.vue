<template>
  <div>
    <el-button-group class="active-button-group">
      <el-button
        :type="activeCard === 'target' ? 'primary' : 'default'"
        @click="activeCard = 'target'"
        ><i class="mdi mdi-forum"></i
      ></el-button>
      <el-button :type="activeCard === 'sender' ? 'primary' : 'default'" @click="activeCard = 'sender'"
        ><i class="mdi mdi-account"></i
      ></el-button>
    </el-button-group>
    <TargetManager v-if="activeCard === 'target'" />

    <SenderManager v-else />
  </div>
</template>

<script>
import { ref } from 'vue'
import TargetManager from '@/components/session/TargetManager.vue'
import SenderManager from '@/components/session/SenderManager.vue'

export default {
  name: 'SessionPage',
  components: {
    TargetManager,
    SenderManager,
  },
  setup() {
    const activeCard = ref('target') // 默认显示会话管理
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
