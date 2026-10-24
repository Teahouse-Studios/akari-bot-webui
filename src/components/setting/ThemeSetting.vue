<template>
  <div>
    <h3 class="ak-card-title">
      <i class="mdi mdi-palette"></i> {{ $t('setting.theme_setting.title') }}
    </h3>
    <div class="theme-color-setting">
      <span class="theme-setting-label">{{ $t('setting.theme_setting.color.title') }}</span>
      <div class="preset-buttons">
        <el-button @click="applyPreset('akari')" class="theme-button">
          <span class="theme-swatch akari"></span>
          {{ $t('setting.theme_setting.button.pink') }}
        </el-button>
        <el-button @click="applyPreset('teahouse')" class="theme-button">
          <span class="theme-swatch teahouse"></span>
          {{ $t('setting.theme_setting.button.blue') }}
        </el-button>

        <div class="custom-theme">
          <el-button
            @click="onCustomButtonClick"
            class="theme-button custom"
            :style="customButtonStyle"
          >
            <span class="theme-swatch custom"></span>
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
import { AKARI_PINK, DEFAULT_THEME_COLOR, TEAHOUSE_BLUE } from '@/utils/themeColor.js'

const { darkMode } = useDarkMode()

const presets = reactive({
  akari: AKARI_PINK,
  teahouse: TEAHOUSE_BLUE,
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
    LocalStorageJson.setItem('themeColor', DEFAULT_THEME_COLOR)
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
    return { '--swatch-color': customColor.value }
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
.theme-swatch {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px var(--el-bg-color),
    0 0 0 3px var(--el-border-color);
}
/* 预设色以「主色→副色」的渐变小圆点呈现 */
.theme-swatch.akari {
  background: linear-gradient(135deg, #f2a7c6, #cdadec);
}
.theme-swatch.teahouse {
  background: linear-gradient(135deg, #0091ff, #8f5ae6);
}
.theme-swatch.custom {
  background: var(
    --swatch-color,
    conic-gradient(#f2a7c6, #f6c39b, #f2dc8c, #a3d9bd, #a6c8f0, #cdb0f2, #f2a7c6)
  );
}
.dark-mode-options {
  flex-wrap: nowrap;
}
.dark-mode-options :deep(.el-radio-button) {
  flex: 0 0 auto;
}
</style>
