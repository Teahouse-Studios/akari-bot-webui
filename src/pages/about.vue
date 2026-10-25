<template>
  <div class="container">
    <!-- TODO: 压缩 -->
    <img class="logo" src="@/assets/akaribot_logo.png" alt="Akaribot" />
    <h1 class="title">小可 · AkariBot</h1>
    <span class="quote">
      <span class="ak-sparkle"></span>
      {{ $t('about.slogan') }}
      <span class="ak-sparkle"></span>
    </span>
    <span class="text">
      By <a href="https://github.com/OasisAkari">OasisAkari</a> via
      <a href="https://teahouse.team">Teahouse Studios</a>
    </span>

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

    <span class="footer-text"> Made with love❤️ and Python🐍. </span>
  </div>
</template>
<script setup>
const goToRepo = () => window.open('https://github.com/Teahouse-Studios/akari-bot', '_blank')
const goToWebUIRepo = () =>
  window.open('https://github.com/Teahouse-Studios/akari-bot-webui', '_blank')
const goToI18N = () => window.open('https://hosted.weblate.org/engage/akaribot', '_blank')
const goToSponsor = () => window.open('https://afdian.com/a/teahouse', '_blank')
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 24px;
}

.logo {
  display: inline-block;
  width: min(400px, 72vw);
  max-width: 100%;
  height: auto;
}

@media (max-width: 640px) {
  .logo {
    width: min(260px, 70vw);
  }
}

/* 标题底下一道荧光笔，与卡片标题同一语言 */
.title {
  display: inline-block;
  margin: 0;
  padding: 0 6px;
  font-family: var(--ak-font-display);
  font-size: 32px;
  font-weight: 800;
  background-image: var(--ak-gradient-soft);
  background-repeat: no-repeat;
  background-position: 0 88%;
  background-size: 100% 0.42em;
}

.quote {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 20px 16px 4px;
  padding: 8px 18px;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 60%, transparent);
  border-radius: 999px;
  background-color: var(--ak-tint);
  color: var(--el-text-color-regular);
}

.quote .ak-sparkle {
  width: 10px;
  height: 10px;
}

.text {
  display: block;
  margin: 16px;
  color: var(--el-text-color-secondary);
}

.footer-text {
  color: var(--el-text-color-secondary);
  display: block;
  margin-top: 60px;
  font-size: 14px;
}

.repo-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  margin-bottom: 16px;
}

.github-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.other-links {
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 四个外链按钮统一成同一种扁平样式，只用图标颜色区分 */
.repo-button,
.locale-button,
.sponsor-button {
  --about-accent: var(--el-text-color-primary);
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.repo-button:hover,
.locale-button:hover,
.sponsor-button:hover {
  border-color: var(--about-accent);
  background-color: color-mix(in srgb, var(--about-accent) 8%, var(--el-bg-color));
  color: var(--el-text-color-primary);
}

.repo-button i,
.locale-button i,
.sponsor-button i {
  margin-right: 8px;
  font-size: 18px;
  color: var(--about-accent);
}

.locale-button {
  --about-accent: #2a9d82;
}

.sponsor-button {
  --about-accent: #9b78e0;
}
</style>
