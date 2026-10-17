import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MAX_IMAGE_BYTES, MAX_IMAGES, isDataImage } from '@/utils/chatMessage.js'

/**
 * 待发送图片：文件选择、拖拽投放与读取（统一转为 data URL）。
 *
 * @param connectionStatus 连接状态 ref，未连接时忽略拖拽与选择
 */
export function useChatImages(connectionStatus) {
  const { t } = useI18n()

  const pendingImages = ref([])
  const isDraggingOver = ref(false)

  const isFull = computed(() => pendingImages.value.length >= MAX_IMAGES)

  const readImageFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string' || !isDataImage(reader.result)) {
          reject(new Error(t('chat.message.error.image_read')))
          return
        }
        resolve({ name: file.name, dataUrl: reader.result, id: uuidv4() })
      }
      reader.onerror = () => reject(new Error(t('chat.message.error.image_read')))
      reader.readAsDataURL(file)
    })

  const addImageFiles = async (files) => {
    const list = Array.from(files || [])
    if (!list.length) return

    const availableSlots = MAX_IMAGES - pendingImages.value.length
    if (list.length > availableSlots) {
      ElMessage.error(t('chat.message.error.image_count'))
    }

    const selectedFiles = list.slice(0, Math.max(availableSlots, 0))
    const loadedImages = []
    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        ElMessage.error(t('chat.message.error.image_type'))
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        ElMessage.error(t('chat.message.error.image_size'))
        continue
      }

      try {
        loadedImages.push(await readImageFile(file))
      } catch (error) {
        ElMessage.error(error.message)
      }
    }

    pendingImages.value.push(...loadedImages)
  }

  const removePendingImage = (index) => {
    pendingImages.value.splice(index, 1)
  }

  const clearPendingImages = () => {
    pendingImages.value = []
  }

  const handleImageSelected = (event) => {
    const input = event.target
    const files = Array.from(input.files || [])
    input.value = ''
    addImageFiles(files)
  }

  const handleDragOver = (event) => {
    const hasFiles = event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files')
    if (connectionStatus.value !== 'connected' || !hasFiles) return
    event.dataTransfer.dropEffect = 'copy'
    isDraggingOver.value = true
  }

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isDraggingOver.value = false
    }
  }

  const handleImageDrop = (event) => {
    isDraggingOver.value = false
    if (connectionStatus.value !== 'connected') return
    addImageFiles(event.dataTransfer?.files)
  }

  return {
    pendingImages,
    isDraggingOver,
    isFull,
    addImageFiles,
    removePendingImage,
    clearPendingImages,
    handleImageSelected,
    handleDragOver,
    handleDragLeave,
    handleImageDrop,
  }
}
