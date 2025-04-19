<template>
  <ChangePasswordForm />
  <RestartBotButton />
</template>

<script>
import ChangePasswordForm from "@/components/setting/ChangePasswordForm.vue";
import RestartBotButton from "@/components/setting/RestartBotButton.vue";

export default {
  components: {
    ChangePasswordForm,
    RestartBotButton,
  }
}
</script>
