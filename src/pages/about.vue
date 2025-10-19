<template>
  <div class="container">
    <!-- TODO: 压缩 -->
    <img width="300" src="@/assets/akaribot_logo.png" alt="Akaribot" />
    <h1 class="title">小可 · AkariBot</h1>
    <span class="quote">{{ $t('about.slogan') }}</span>
    <span class="text">
      By <a href="https://github.com/OasisAkari">OasisAkari</a> via
      <a href="https://teahouse.team">Teahouse Studios</a>
    </span>

    <!-- GitHub Repos -->
    <div class="repo-buttons">
      <div class="github-link">
        <el-button class="repo-button" @click="goToRepo">
          <i class="mdi mdi-github"></i>
          <span>{{ $t('about.button.repo.main') }}</span>
        </el-button>
        <img
          src="https://img.shields.io/github/stars/Teahouse-Studios/akari-bot?style=social"
          alt="Repo Stars"
          :title="$t('about.star.tooltip')"
        />
      </div>
      <div class="github-link">
        <el-button class="repo-button" @click="goToWebUIRepo">
          <i class="mdi mdi-github"></i>
          <span>{{ $t('about.button.repo.webui') }}</span>
        </el-button>
        <img
          src="https://img.shields.io/github/stars/Teahouse-Studios/akari-bot-webui?style=social"
          alt="Repo Stars"
          :title="$t('about.star.tooltip')"
        />
      </div>
    </div>

    <div class="other-links">
      <el-button class="locale-button" @click="goToI18N">
        <i class="mdi mdi-translate"></i>
        <span>{{ $t('about.button.locale') }}</span>
      </el-button>
      <el-button class="sponsor-button" @click="goToSponsor">
        <i class="mdi mdi-heart-outline"></i>
        <span>{{ $t('about.button.sponsor') }}</span>
      </el-button>
    </div>

    <span class="footer-text">
      Made with love❤️ and
      <span class="python-text" :class="{ disabled: !showDevelopMode }" @click="handleDevClick">
        Python🐍 </span
      >.
    </span>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'

const { t } = useI18n()

const devClickCount = ref(0)
const showDevelopMode = ref(LocalStorageJson.getItem('showDevelopMode') === 'true' && !IS_DEMO)
const demoErrorKey = ref('')

const generateDemoErrorKey = () => {
  const demoErrorIndex = Math.floor(Math.random() * 7) + 1
  demoErrorKey.value = `setting.develop_mode.message.error.demo.${demoErrorIndex}`
}

const handleDevClick = () => {
  if (IS_DEMO) {
    ElMessage.error(t(demoErrorKey.value))
    return
  }

  if (showDevelopMode.value) {
    ElMessage.info(t('setting.develop_mode.message.info.already'))
    return
  }

  devClickCount.value++
  const remainingClicks = 7 - devClickCount.value

  if (remainingClicks > 0 && remainingClicks < 6) {
    ElMessage.info(t('setting.develop_mode.message.info.remain', { remain: remainingClicks }))
  }

  if (devClickCount.value >= 7) {
    LocalStorageJson.setItem('showDevelopMode', 'true')
    showDevelopMode.value = true
    ElMessage.success(t('setting.develop_mode.message.success'))
    devClickCount.value = 0
  }
}

const goToRepo = () => window.open('https://github.com/Teahouse-Studios/akari-bot', '_blank')
const goToWebUIRepo = () =>
  window.open('https://github.com/Teahouse-Studios/akari-bot-webui', '_blank')
const goToI18N = () => window.open('https://crowdin.com/project/akari-bot', '_blank')
const goToSponsor = () => window.open('https://afdian.com/a/teahouse', '_blank')

onMounted(() => {
  if (IS_DEMO) generateDemoErrorKey()
})

onBeforeUnmount(() => {
  demoErrorKey.value = ''
})
</script>

<style scoped>
.el-button {
  border: none;
}

.container {
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: bold;
  margin: 0;
}

.quote {
  font-style: oblique;
  color: gray;
  display: block;
  margin: 16px;
}

.text {
  display: block;
  margin: 16px;
}

.footer-text {
  color: gray;
  display: block;
  margin-top: 60px;
  font-size: 14px;
}

.python-text.disabled {
  cursor: default;
  user-select: none;
}

.repo-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  margin-bottom: 16px;
}

.github-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.other-links {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.repo-button i,
.locale-button i,
.sponsor-button i {
  margin-right: 8px;
}

.repo-button {
  background-color: #242a31;
  color: white;
}

.repo-button:hover {
  background-color: #474a4f;
  color: white;
}

.locale-button {
  background-color: #419c45;
  color: white;
}

.locale-button:hover {
  background-color: #45b24a;
  color: white;
}

.sponsor-button {
  background-color: #916ae4;
  color: white;
}

.sponsor-button:hover {
  background-color: #a284e3;
  color: white;
}
</style>
