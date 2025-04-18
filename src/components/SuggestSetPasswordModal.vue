<template>
    <el-dialog title="建议设置密码" v-model="dialogVisible" width="30%">
      <p>目前暂未设置密码。若你打算在公网访问此面板，为保证服务安全性，请务必前往“更多设置”界面设置一个密码。</p>
      <el-checkbox v-model="noMorePrompt">不再提示</el-checkbox>
      <template #footer>
        <el-button @click="handleClose">稍后再说</el-button>
        <el-button type="primary" @click="goToSetting">去设置</el-button>
      </template>
    </el-dialog>
  </template>
  
  <script>
  export default {
    props: {
      modelValue: Boolean,
    },
    emits: ["update:modelValue"],
    data() {
      return {
        noMorePrompt: false,
      };
    },
    computed: {
      dialogVisible: {
        get() {
          return this.modelValue;
        },
        set(val) {
          this.$emit("update:modelValue", val);
        },
      },
    },
    methods: {
      handleClose() {
        if (this.noMorePrompt) {
          localStorage.setItem("noPasswordPromptDisabled", "true");
        }
        this.dialogVisible = false;
      },
      goToSetting() {
        if (this.noMorePrompt) {
          localStorage.setItem("noPasswordPromptDisabled", "true");
        }
        this.dialogVisible = false;
        this.$router.push({ name: "setting" });
      },
    },
  };
  </script>
  