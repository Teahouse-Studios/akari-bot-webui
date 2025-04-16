<template>
  <div style="text-align: center;">
    <img width="400" src="@/assets/character_marked.png" alt="Akaribot">
    <h1 class="title">小可 · AkariBot</h1>
    <span class="quote">多功能、多语言、多平台支持的异步聊天机器人</span>
    <br />
    <br />
    <span>By <a href="https://teahouse.team">Teahosue Studios</a></span>
    <br />
    <div class="github-link">
      <el-button class="repo-button" @click="goToRepo">
        <i class="fab fa-github"></i>
        <span>主项目</span>
      </el-button>
      <img src="https://img.shields.io/github/stars/Teahouse-Studios/akari-bot?style=social"
      alt="Repo Stars"
      :title="`请帮助我们 Star 这个项目！`">
    </div>
    <div class="github-link">
        <el-button class="repo-button" @click="goToWebUIRepo">
        <i class="fab fa-github"></i>
        <span>WebUI</span>
      </el-button>
      <img src="https://img.shields.io/github/stars/DoroWolf/akari-bot-webui?style=social"
      alt="Repo Stars"
      :title="`请帮助我们 Star 这个项目！`">
    </div>
    <div class="links">
      <el-button class="locale-button" @click="goToI18N">
        <i class="mdi mdi-translate"></i>
        <span>帮助翻译</span>
      </el-button>
      <el-button class="sponsor-button" @click="goToSponsor">
        <i class="mdi mdi-heart-outline"></i>
        <span>赞助我们</span>
      </el-button>
    </div>
    <br />
    <br />
    <br />
    <span class="quote">Made with love❤️ and Python🐍.</span>
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

<style>
.title {
  font-size: 32px;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 16px;
}

.quote {
  font-style: oblique;
  color: gray;
}

.github-link {
  margin: 16px;
  gap: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.links {
  display: flex;
  justify-content: center;
}

.repo-button i {
  margin-right: 8px;
}

.locale-button i {
  margin-right: 2px;
}

.sponsor-button i {
  margin-right: 2px;
}

.repo-button {
  background-color: #242a31 !important;
  color: white !important;
}

.locale-button {
  background-color: #419c45 !important;
  color: white !important;
}

.sponsor-button {
  background-color: #916ae4 !important;
  color: white !important;
}

.repo-button:hover {
  background-color: #1b1d1f !important;
}

.locale-button:hover {
  background-color: #357f32 !important;
}

.sponsor-button:hover {
  background-color: #a284e3 !important;
}
</style>
