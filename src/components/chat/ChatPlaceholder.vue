<template>
  <div class="chat-placeholder">
    <span class="placeholder-mark" aria-hidden="true">
      <span class="ak-sparkle"></span>
      <span class="ak-sparkle"></span>
      <span class="ak-sparkle"></span>
    </span>
    <div class="placeholder-title">{{ $t('chat.chatbox.title') }}</div>
    <template v-if="!isMobileView">
      <div class="placeholder-sub">
        {{ $t('chat.chatbox.text.prompt1.prefix') }}
        <code
          class="chat-code chat-code-clickable"
          role="button"
          tabindex="0"
          @click="insertHelpCommand"
          @keydown.enter.prevent="insertHelpCommand"
          @keydown.space.prevent="insertHelpCommand"
          >{{ commandPrefix }}help</code
        >
        {{ $t('chat.chatbox.text.prompt1.suffix') }}
      </div>
      <div class="placeholder-sub">
        {{ $t('chat.chatbox.text.prompt2.prefix') }}
        <code class="chat-code">Enter</code>
        {{ $t('chat.chatbox.text.prompt2.suffix') }}
      </div>
      <div class="placeholder-sub">
        {{ $t('chat.chatbox.text.prompt3.prefix') }}
        <code class="chat-code">Shift + Enter</code>
        {{ $t('chat.chatbox.text.prompt3.suffix') }}
      </div>
    </template>
    <template v-else>
      <div class="placeholder-sub">
        {{ $t('chat.chatbox.text.prompt1.prefix') }}
        <code
          class="chat-code chat-code-clickable"
          role="button"
          tabindex="0"
          @click="insertHelpCommand"
          @keydown.enter.prevent="insertHelpCommand"
          @keydown.space.prevent="insertHelpCommand"
          >{{ commandPrefix }}help</code
        >
        {{ $t('chat.chatbox.text.prompt1.suffix') }}
      </div>
      <div class="placeholder-sub">
        {{ $t('chat.chatbox.text.prompt3.prefix') }}
        <code class="chat-code">Enter</code>
        {{ $t('chat.chatbox.text.prompt3.suffix') }}
      </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  commandPrefix: {
    type: String,
    default: '~',
  },
  isMobileView: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['insert-command'])

const insertHelpCommand = () => {
  emit('insert-command', `${props.commandPrefix}help`)
}
</script>

<style scoped>
.chat-placeholder {
  flex: 1;
  gap: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-placeholder);
  font-size: 28px;
}

/* 三颗大小不一的四角星，取自 logo 右上角 */
.placeholder-mark {
  display: inline-flex;
  align-items: flex-end;
  gap: 4px;
  margin-bottom: 10px;
}

.placeholder-mark .ak-sparkle:nth-child(1) {
  width: 14px;
  height: 14px;
}

.placeholder-mark .ak-sparkle:nth-child(2) {
  width: 26px;
  height: 26px;
}

.placeholder-mark .ak-sparkle:nth-child(3) {
  width: 10px;
  height: 10px;
  align-self: flex-start;
}

.placeholder-title {
  font-family: var(--ak-font-display);
  font-size: 24px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
}

.placeholder-sub {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.chat-code {
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 13px;
}

.chat-code-clickable {
  color: var(--ak-primary-text);
  border-style: dashed;
  border-color: var(--el-color-primary);
  cursor: pointer;
}

.chat-code-clickable:hover {
  background-color: var(--ak-tint);
}
</style>
