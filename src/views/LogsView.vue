<template>
  <div class="log-viewer-container">
    <div class="filter-container">
      <div class="filter-top-row">
        <div class="left-controls">
          <el-input
            v-model="searchText"
            :placeholder="$t('logs.input.search')"
            class="log-search-input"
            @input="handleSearch"
            clearable
          />
        </div>
        <div class="right-controls">
          <el-button
            class="log-refresh-button"
            @click="refreshLog"
            :title="$t('logs.button.refresh')"
            circle
          >
            <i class="mdi mdi-refresh"></i>
          </el-button>
          <el-switch
            v-model="autoScroll"
          />
          <span class="auto-scroll-label">{{ $t('logs.switch.auto_scroll') }}</span>
        </div>
      </div>
      
      <div class="filter-bottom-row">
        <el-button
          v-for="(level, index) in logLevels"
          :key="index"
          :class="[
            'log-level-button',
            level.toLowerCase(),
            { active: activeLogLevels.includes(level) },
          ]"
          @click="toggleLogLevel(level)"
        >
          {{ level }}
        </el-button>
      </div>
    </div>

    <div class="log-viewer" ref="logViewer">
      <div v-for="(logLine, index) in visibleLogs" :key="index">
        <span
          v-for="(part, partIndex) in logLine"
          :key="partIndex"
          :style="part.style"
        >
          {{ part.text }}
        </span>
      </div>

      <div v-if="visibleLogs.length === 0" class="log-viewer-placeholder">There are currently no matching logs here...<br>Use the filter box above to adjust the options.</div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ElMessage } from "element-plus";
import { debounce } from "lodash";
import { useI18n } from 'vue-i18n';

export default {
  name: "LogsView",
  data() {
    const { t } = useI18n();

    return {
      logData: "",
      visibleLogs: [],
      logViewer: null,
      logLevels: [
        "DEBUG",
        "INFO",
        "SUCCESS",
        "WARNING",
        "ERROR",
        "CRITICAL",
      ],
      activeLogLevels: [
        "INFO",
        "SUCCESS",
        "WARNING",
        "ERROR",
        "CRITICAL",
      ],
      searchText: "",
      websocket: null,
      cancelTokenSource: axios.CancelToken.source(),
      autoScroll: true,
      t
    };
  },
  methods: {
    async authenticateToken() {
      try {
        const response = await axios.get("/api/verify-token", {
          cancelToken: this.cancelTokenSource.token,
        });

        if (response.status === 200) {
          this.connectWebSocket();
        } else {
          ElMessage.error(this.t('message.error.connect.auth'));
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          ElMessage.error(this.t('message.error.fetch') + error.message);
        }
      }
    },

    async connectWebSocket() {
      try {
        const config = await (await fetch("/config.json")).json();
        const enableHTTPS = config.enable_https;
        let baseUrl = config.api_url;

        if (!baseUrl) {
          baseUrl = window.location.origin;
        } else if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = (enableHTTPS ? "https://" : "http://") + baseUrl;
        }

        const url = new URL(baseUrl);
        const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${url.hostname}${url.port ? `:${url.port}` : ""}/ws/logs`;

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onmessage = (event) => {
          this.logData += event.data + "\n";
        };

        this.websocket.onerror = () => {
          ElMessage.error(this.t('message.error.connect.server'));
        };
      } catch (error) {
        ElMessage.error(this.t('message.error.connect') + error.message);
      }
    },

    updateLogs: debounce(function () {
      const rawLines = this.logData.split("\n");
      let buffer = "";
      const formattedLines = [];

      rawLines.forEach((line) => {
        if (/^\[.*?\]\[.*?\]\[.*?\]\[.*?\]:/.test(line)) {
          if (buffer) formattedLines.push(this.formatLogLine(buffer));
          buffer = line;
        } else {
          buffer += "\n" + line;
        }
      });

      if (buffer) formattedLines.push(this.formatLogLine(buffer));

      this.visibleLogs = formattedLines.filter((logLine) => {
        const textMatch = this.searchText
          ? logLine.some(part => part.text.toLowerCase().includes(this.searchText.toLowerCase()))
          : true;

        return (
          textMatch &&
          this.activeLogLevels.some((level) =>
            logLine.some(part => part.text.includes(level))
          )
        );
      });

      if (this.visibleLogs.length > 16384) {
        this.visibleLogs = this.visibleLogs.slice(-16384);
      }

      if (this.autoScroll && this.logViewer) {
        setTimeout(() => {
          this.logViewer.scrollTop = this.logViewer.scrollHeight;
        }, 200);
      }
    }, 500),

    refreshLog() {
      this.logData = "";
      this.visibleLogs = [];
      if (this.logViewer) {
        this.logViewer.scrollTop = 0;
      }

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close();
      }

      this.authenticateToken();
    },

    formatLogLine(logLine) {
      const logPattern = /^\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]:(.*)$/s;
      const match = logLine.match(logPattern);

      const logPlatformColor = "#11a8cd";
      const logModulesColor = "#e5e510";
      const logDatetimeColor = "#0dbc79";
      let logContentColor = "#fff";
      let logBackgroundColor = "transparent";

      if (match) {
        const [, logPlatform, logModules, logDatetime, logLevel, logContent] = match;

        switch (logLevel) {
          case "DEBUG":
            logContentColor = "#3b8ec9";
            break;
          case "INFO":
            logContentColor = "#fff";
            break;
          case "SUCCESS":
            logContentColor = "#23d18b";
            break;
          case "WARNING":
            logContentColor = "#f5f543";
            break;
          case "ERROR":
            logContentColor = "#f14c4c";
            break;
          case "CRITICAL":
            logContentColor = "#fff";
            logBackgroundColor = "#cd3131";
            break;
        }

        return [
          { text: `[${logPlatform}]`, style: { color: logPlatformColor } },
          { text: `[${logModules}]`, style: { color: logModulesColor } },
          { text: `[${logDatetime}]`, style: { color: logDatetimeColor } },
          {
            text: `[${logLevel}]:${logContent}`,
            style: {
              color: logContentColor,
              backgroundColor: logBackgroundColor,
            },
          },
        ];
      }

      return [
        {
          text: logLine,
          style: {
            color: "#fff",
          },
        },
      ];
    },

    toggleLogLevel(level) {
      if (this.activeLogLevels.includes(level)) {
        this.activeLogLevels = this.activeLogLevels.filter(
          (item) => item !== level,
        );
      } else {
        this.activeLogLevels.push(level);
      }
      this.updateLogs();
    },

    handleSearch() {
      this.updateLogs();
    },
  },
  watch: {
    logData: "updateLogs",
  },
  mounted() {
    this.logViewer = this.$refs.logViewer;
    this.authenticateToken();
  },
  beforeUnmount() {
    if (this.websocket) {
      this.websocket.close();
    }
    this.cancelTokenSource.cancel("Component unmounted");
  },
};
</script>


<style scoped>
.log-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}

.dark .filter-container {
  background-color: #555;
}

.filter-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
}

.left-controls {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.log-search-input {
  flex-grow: 1;
  min-width: 100px;
}

.dark .log-search-input {
  background-color: #181818;
  border-radius: 5px;
}

.log-refresh-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 24px !important;
  margin-right: 10px;
  color: inherit;
  transition: color 0.3s ease;
  }

.log-refresh-button:hover {
  background-color: #ddd;
  color: #888;
}

.dark .log-refresh-button:hover {
  background-color: #555;
  color: #aaa;
}

.right-controls {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 10px;
}

.auto-scroll-label {
  margin-left: 5px;
}

.filter-bottom-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 5px;
  overflow-x: auto;
}

.log-level-button {
  margin: 5px;
  background-color: transparent;
}

.log-level-button + .log-level-button {
  margin-left: 5px;
}

.el-input {
  width: 100%;
  margin-top: 5px;
  margin-bottom: 5px;
}

.log-level-button.debug {
  color: #3b8ec9;
  border: 2px solid #3b8ec9;
}

.log-level-button.debug.active {
  color: white;
  background-color: #3b8ec9;
}

.log-level-button.info {
  color: #fff;
  border: 2px solid #fff;
}

.log-level-button.info.active {
  color: #333;
  background-color: #fff;
}

.log-level-button.success {
  color: #23d18b;
  border: 2px solid #23d18b;
}

.log-level-button.success.active {
  color: #333;
  background-color: #23d18b;
}
.log-level-button.warning {
  color: #f5f543;
  border: 2px solid #f5f543;
}

.log-level-button.warning.active {
  color: #333;
  background-color: #f5f543;
}

.log-level-button.error {
  color: #f14c4c;
  border: 2px solid #f14c4c;
}

.log-level-button.error.active {
  color: #fff;
  background-color: #f14c4c;
}

.log-level-button {
  color: #cd3131;
  border: 2px solid #cd3131;
}

.log-level-button.critical.active {
  color: #fff;
  background-color: #cd3131;
  border: 2px solid #fff;
}

.log-viewer {
  flex-grow: 1;
  height: 60vh;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;
  background-color: #0c0c0c;
  color: #fff;
  padding: 10px;
  font-family: "Consolas", "Noto Sans Mono", "Courier New", Courier, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.log-viewer-placeholder {
  color: #636363;
}
</style>
