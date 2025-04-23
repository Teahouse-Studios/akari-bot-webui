<template>
  <ChangePassword />
  <SelectLanguage />
  <RestartBot />
</template>

<script>
import ChangePassword from "@/components/setting/ChangePassword.vue";
import SelectLanguage from '@/components/setting/SelectLanguage.vue';
import RestartBot from "@/components/setting/RestartBot.vue";

export default {
  components: {
    ChangePassword,
    SelectLanguage,
    RestartBot,
  }
}
</script>