<template>
  <changePasswordForm />
  <restartBotButton />
</template>

<script>
import changePasswordForm from "@/components/setting/changePasswordForm.vue";
import restartBotButton from "@/components/setting/restartBotButton.vue";

export default {
  components: {
    changePasswordForm,
    restartBotButton,
  }
}
</script>
