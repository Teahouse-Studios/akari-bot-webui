<template>
  <div class="container">
    <img width="300" src="@/assets/akaribot_logo.png" alt="Akaribot">
    <h1 class="title">小可 · AkariBot</h1>
    <span class="quote">{{ $t("about.quote") }}</span>
    <span class="text">By <a href="https://github.com/OasisAkari">OasisAkari</a> via <a href="https://teahouse.team">Teahouse Studios</a></span>

    <!-- GitHub Repos -->
    <div class="repo-buttons">
      <div class="github-link">
        <el-button class="repo-button" @click="goToRepo">
          <i class="fab fa-github"></i>
          <span>{{ $t("about.button.repo.main") }}</span>
        </el-button>
        <img src="https://img.shields.io/github/stars/Teahouse-Studios/akari-bot?style=social" alt="Repo Stars" :title="$t('about.star.tooltip')">
      </div>
      <div class="github-link">
        <el-button class="repo-button" @click="goToWebUIRepo">
          <i class="fab fa-github"></i>
          <span>{{ $t("about.button.repo.webui") }}</span>
        </el-button>
        <img src="https://img.shields.io/github/stars/Teahouse-Studios/akari-bot-webui?style=social" alt="Repo Stars" :title="$t('about.star.tooltip')">
      </div>
    </div>

    <div class="other-links">
      <el-button class="locale-button" @click="goToI18N">
        <i class="mdi mdi-translate"></i>
        <span>{{ $t("about.button.locale") }}</span>
      </el-button>
      <el-button class="sponsor-button" @click="goToSponsor">
        <i class="mdi mdi-heart-outline"></i>
        <span>{{ $t("about.button.sponsor") }}</span>
      </el-button>
    </div>
    <span class="footer-text">Made with love❤️ and Python🐍.</span>
  </div>
</template>


<script>
  import { useI18n } from 'vue-i18n';
    
  export default {
    name: "AboutView",
    data() {
      const { t } = useI18n();

      return {
        t
      };
    },
    methods: {
      updateScreenWidth() {
        this.screenWidth = window.innerWidth;
      },
      goToRepo() {
        window.open("https://github.com/Teahouse-Studios/akari-bot", "_blank");
      },
      goToWebUIRepo() {
        window.open("https://github.com/Teahouse-Studios/akari-bot-webui", "_blank");
      },
      goToI18N() {
        window.open("https://crowdin.com/project/akari-bot", "_blank");
      },
      goToSponsor() {
        window.open("https://afdian.com/a/teahouse", "_blank");
      }
    }
  };
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
  gap: 12px;
}

.repo-button i, .locale-button i, .sponsor-button i {
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
