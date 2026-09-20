<template>
  <div v-if="images.length" class="pending-images-bar">
    <div class="pending-images">
      <div v-for="(image, imageIdx) in images" :key="image.id" class="pending-image">
        <img
          :src="image.dataUrl"
          :alt="image.name"
          @click="$emit('preview-image', image.dataUrl)"
        />
        <el-button
          class="remove-image-button"
          circle
          size="small"
          :title="$t('chat.button.remove_image')"
          @click="$emit('remove-image', imageIdx)"
        >
          <i class="mdi mdi-close"></i>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  images: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['preview-image', 'remove-image'])
</script>

<style scoped>
.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.pending-images-bar {
  padding: 10px 20px;
  background: #f3f3f3;
  border-top: 1px solid #e0e0e0;
}

.pending-images-bar .pending-images {
  margin-bottom: 0;
}

.pending-image {
  position: relative;
  flex: 0 0 42px;
  height: 42px;
}

.pending-image img {
  width: 42px;
  height: 42px;
  display: block;
  border: 1px solid var(--el-border-color);
  border-radius: 5px;
  object-fit: cover;
  cursor: pointer;
}

.remove-image-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  min-height: 20px;
  padding: 0;
}

.dark .pending-images-bar {
  border-top: 1px solid #1f1f1f;
  background: #333;
}
</style>
