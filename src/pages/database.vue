<template>
  <div v-if="isDevelopMode">
    <SQLConsole />
  </div>
  
  <NotFound v-else />
</template>

<script>
import SQLConsole from '@/components/database/SQLConsole.vue';
import NotFound from './notFound.vue';

export default {
  name: 'DatabasePage',
  components: {
    SQLConsole,
    NotFound
  },
  data() {
    return {
      isDevelopMode: localStorage.getItem('isDevelopMode') === 'true',
    }
  }
}
</script>