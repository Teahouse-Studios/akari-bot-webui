<template>
  <img
    v-if="block.type === 'image'"
    :src="block.content"
    class="chat-img"
    alt=""
    @click="$emit('image-click', block.content)"
  />

  <audio
    v-else-if="block.type === 'audio'"
    class="chat-audio"
    controls
    preload="metadata"
    :src="block.content"
  ></audio>

  <video
    v-else-if="block.type === 'video'"
    class="chat-video"
    controls
    preload="metadata"
    :src="block.content"
  ></video>
</template>

<script setup>
defineProps({
  block: {
    type: Object,
    required: true,
  },
})

defineEmits(['image-click'])
</script>

<style scoped>
.chat-audio {
  max-width: 100%;
  margin: 8px 0;
  display: block;
}

.chat-video {
  display: block;
  max-width: 100%;
  max-height: 400px;
  margin: 8px 0;
  background-color: #000;
}
</style>
