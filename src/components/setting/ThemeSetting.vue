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
          :style="customButtonStyle()"
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

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'ThemeSelector',
  data() {
    const { t } = useI18n()
    return {
      presets: {
        akari: '#edaab3',
        teahouse: '#0091ff',
      },
      customColor: '',
      showColorPicker: localStorage.getItem('isCustomTheme') === 'true',
      t,
    }
  },
  methods: {
    applyPreset(themeName) {
      const color = this.presets[themeName]
      localStorage.setItem('isCustomTheme', 'false')
      localStorage.setItem('themeColor', color)
      this.showColorPicker = false
      window.dispatchEvent(new Event('theme-change'))
    },
    applyCustomColor(color) {
      if (!color) {
        localStorage.removeItem('isCustomTheme', 'false')
        localStorage.removeItem('themeColor', '#edaab3')
      } else {
        localStorage.setItem('isCustomTheme', 'true')
        localStorage.setItem('themeColor', color)
      }
      window.dispatchEvent(new Event('theme-change'))
    },
    onCustomButtonClick() {
      this.applyCustomColor(this.customColor)
      this.showColorPicker = true
    },
    customButtonStyle() {
      const isCustomTheme = localStorage.getItem('isCustomTheme')
      if (isCustomTheme === 'true') {
        const savedColor = localStorage.getItem('themeColor')
        this.customColor = savedColor
      }
      if (this.customColor) {
        return {
          backgroundColor: this.customColor,
          borderColor: this.customColor,
          color: 'white',
        }
      }
      return {}
    },
  },
}
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
