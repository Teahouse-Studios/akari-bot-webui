<template>
  <div>
    <h3><i class="mdi mdi-palette"> </i> {{ $t('setting.theme_setting.title') }}</h3>
    <div class="preset-buttons">
      <el-button @click="applyPreset('akari')" class="theme-button akari">
        {{ $t('setting.theme_setting.button.pink') }}
      </el-button>
      <el-button @click="applyPreset('teahouse')" class="theme-button teahouse">
        {{ $t('setting.theme_setting.button.blue') }}
      </el-button>

      <div class="custom-theme">
        <el-button
          @click="onCustomButtonClick"
          class="theme-button custom"
          :style="customButtonStyle"
        >
          {{ $t('setting.theme_setting.button.custom') }}
        </el-button>
        <el-color-picker
          v-if="showColorPicker"
          v-model="customColor"
          @change="applyCustomColor"
          :clearable="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const presets = reactive({
  akari: '#edaab3',
  teahouse: '#0091ff',
})

const customColor = ref('')
const showColorPicker = ref(localStorage.getItem('isCustomTheme') === 'true')

function applyPreset(themeName) {
  const color = presets[themeName]
  localStorage.setItem('isCustomTheme', 'false')
  localStorage.setItem('themeColor', color)
  showColorPicker.value = false
  window.dispatchEvent(new Event('theme-change'))
}

function applyCustomColor(color) {
  if (!color) {
    localStorage.removeItem('isCustomTheme')
    localStorage.setItem('themeColor', '#edaab3')
  } else {
    localStorage.setItem('isCustomTheme', 'true')
    localStorage.setItem('themeColor', color)
  }
  window.dispatchEvent(new Event('theme-change'))
}

function onCustomButtonClick() {
  applyCustomColor(customColor.value)
  showColorPicker.value = true
}

const customButtonStyle = computed(() => {
  const isCustomTheme = localStorage.getItem('isCustomTheme')
  if (isCustomTheme === 'true') {
    const savedColor = localStorage.getItem('themeColor')
    customColor.value = savedColor
  }
  if (customColor.value) {
    return {
      backgroundColor: customColor.value,
      borderColor: customColor.value,
      color: 'white',
    }
  }
  return {}
})
</script>

<style scoped>
.preset-buttons {
  display: flex;
  flex-wrap: wrap;
}
.custom-theme {
  display: flex;
  align-items: center;
}
.theme-button {
  margin: 5px;
}
.theme-button + .theme-button {
  margin-left: 5px;
}
.theme-button.akari {
  background-color: #edaab3;
  border-color: #edaab3;
  color: white;
}
.theme-button.teahouse {
  background-color: #0091ff;
  border-color: #0091ff;
  color: white;
}
</style>
