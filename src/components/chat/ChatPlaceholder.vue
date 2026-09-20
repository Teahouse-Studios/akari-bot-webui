<template>
  <div class="chat-placeholder">
    <div class="placeholder-title">{{ $t('chat.chatbox.title') }}</div>
    <template v-if="!isMobileView">
      <div class="placeholder-sub">
        {{ $t('chat.chatbox.text.prompt1.prefix') }}
        <code class="chat-code">{{ commandPrefix }}help</code>
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
        <code class="chat-code">{{ commandPrefix }}help</code>
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
defineProps({
  commandPrefix: {
    type: String,
    default: '~',
  },
  isMobileView: {
    type: Boolean,
    default: false,
  },
})
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
  color: #999;
  font-size: 28px;
}

.placeholder-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.placeholder-sub {
  color: #777;
  font-size: 14px;
  margin-top: 4px;
}

.dark .chat-placeholder {
  color: #aaa;
}

.dark .placeholder-title {
  color: #eee;
}

.dark .placeholder-sub {
  color: #888;
}
</style>
