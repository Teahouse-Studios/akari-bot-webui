<template>
  <div class="container">
    <img width="380" src="@/assets/character_marked.png" alt="Akaribot">
    <h1 class="title">小可 · AkariBot</h1>
    <span class="quote">多功能、多语言、多平台支持的异步聊天机器人</span>
    <span class="text">By <a href="https://github.com/OasisAkari">OasisAkari</a> via <a href="https://teahouse.team">Teahouse Studios</a></span>

    <!-- GitHub Repos -->
    <div class="repo-buttons">
      <div class="github-link">
        <el-button class="repo-button" @click="goToRepo">
          <i class="fab fa-github"></i>
          <span>主项目</span>
        </el-button>
        <img src="https://img.shields.io/github/stars/Teahouse-Studios/akari-bot?style=social" alt="Repo Stars" :title="`你的 Star 是对我们非常大的鼓励！`">
      </div>
      <div class="github-link">
        <el-button class="repo-button" @click="goToWebUIRepo">
          <i class="fab fa-github"></i>
          <span>WebUI</span>
        </el-button>
        <img src="https://img.shields.io/github/stars/DoroWolf/akari-bot-webui?style=social" alt="Repo Stars" :title="`你的 Star 是对我们非常大的鼓励！`">
      </div>
    </div>

    <div class="other-links">
      <el-button class="locale-button" @click="goToI18N">
        <i class="mdi mdi-translate"></i>
        <span>帮助翻译</span>
      </el-button>
      <el-button class="sponsor-button" @click="goToSponsor">
        <i class="mdi mdi-heart-outline"></i>
        <span>赞助我们</span>
      </el-button>
    </div>
    <span class="footer-text">Made with love❤️ and Python🐍.</span>
  </div>
</template>


<script>
export default {
  name: "AboutView",
  methods: {
    updateScreenWidth() {
      this.screenWidth = window.innerWidth;
    },
    goToRepo() {
      window.open("https://github.com/Teahouse-Studios/akari-bot", "_blank");
    },
    goToWebUIRepo() {
      window.open("https://github.com/DoroWolf/akari-bot-webui", "_blank");
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
