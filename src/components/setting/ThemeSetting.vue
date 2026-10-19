<template>
  <div>
    <h3><i class="mdi mdi-palette"> </i> {{ $t('setting.theme_setting.title') }}</h3>
    <div class="theme-color-setting">
      <span class="theme-setting-label">{{ $t('setting.theme_setting.color.title') }}</span>
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

    <div class="dark-mode-setting">
      <span class="theme-setting-label">{{ $t('setting.theme_setting.dark_mode.title') }}</span>
      <el-radio-group v-model="darkMode" class="dark-mode-options">
        <el-radio-button value="on">
          {{ $t('setting.theme_setting.dark_mode.option.on') }}
        </el-radio-button>
        <el-radio-button value="off">
          {{ $t('setting.theme_setting.dark_mode.option.off') }}
        </el-radio-button>
        <el-radio-button value="system">
          {{ $t('setting.theme_setting.dark_mode.option.system') }}
        </el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import LocalStorageJson from '@/localStorageJson.js'
import { useDarkMode } from '@/composables/useDarkMode.js'

const { darkMode } = useDarkMode()

const presets = reactive({
  akari: '#edaab3',
  teahouse: '#0091ff',
})

const customColor = ref('')
const showColorPicker = ref(LocalStorageJson.getItem('isCustomTheme') === 'true')

function applyPreset(themeName) {
  const color = presets[themeName]
  LocalStorageJson.setItem('isCustomTheme', 'false')
  LocalStorageJson.setItem('themeColor', color)
  showColorPicker.value = false
  window.dispatchEvent(new Event('theme-change'))
}

function applyCustomColor(color) {
  if (!color) {
    LocalStorageJson.removeItem('isCustomTheme')
    LocalStorageJson.setItem('themeColor', '#edaab3')
  } else {
    LocalStorageJson.setItem('isCustomTheme', 'true')
    LocalStorageJson.setItem('themeColor', color)
  }
  window.dispatchEvent(new Event('theme-change'))
}

function onCustomButtonClick() {
  applyCustomColor(customColor.value)
  showColorPicker.value = true
}

onMounted(() => {
  const isCustomTheme = LocalStorageJson.getItem('isCustomTheme')
  if (isCustomTheme === 'true') {
    customColor.value = LocalStorageJson.getItem('themeColor') || ''
  }
})

const customButtonStyle = computed(() => {
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
.theme-color-setting,
.dark-mode-setting {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.theme-setting-label {
  flex-shrink: 0;
  cursor: default;
}
.preset-buttons {
  display: flex;
  flex-wrap: nowrap;
}
.custom-theme {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.theme-button {
  flex-shrink: 0;
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
.dark-mode-options {
  flex-wrap: nowrap;
}
.dark-mode-options :deep(.el-radio-button) {
  flex: 0 0 auto;
}
</style>
