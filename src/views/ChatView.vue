<template>
  <div class="chat-container">
    <div class="chat-header">
      <div 
        :style="{ 
          backgroundColor: 
            connectionStatus === 'connected' ? 'limegreen' : 
            connectionStatus === 'connecting' ? 'orange' : 'red' 
        }" 
        class="connection-indicator"
        :title="connectionStatus === 'connected' ? $t('chat.status.tooltip.connected') : 
                connectionStatus === 'connecting' ? $t('chat.status.tooltip.connecting') : $t('chat.status.tooltip.disconnected')"
      ></div>
      <div class="chat-title"># {{ $t('chat.title') }}</div>
      <el-button
        class="reset-button"
        @click="resetChat"
        :title="$t('chat.button.reset')"
        circle
      >
        <i class="mdi mdi-restart"></i>
      </el-button>
    </div>

    <div class="chat-box" ref="chatBox">
      <div v-if="messages.length === 0" class="chat-placeholder">
        <div class="placeholder-title">{{ $t('chat.chatbox.title') }}</div>
        <div class="placeholder-sub">
          {{ $t('chat.chatbox.text.prompt1.prefix') }}
          <code>~help</code>
          {{ $t('chat.chatbox.text.prompt1.suffix') }}
        </div>
        <div class="placeholder-sub">
          {{ $t('chat.chatbox.text.prompt2.prefix') }}
          <code>Enter</code>
          {{ $t('chat.chatbox.text.prompt2.suffix') }}
        </div>
        <div class="placeholder-sub">
          {{ $t('chat.chatbox.text.prompt3.prefix') }}
          <code>Shift + Enter</code>
          {{ $t('chat.chatbox.text.prompt3.suffix') }}
        </div>
      </div>

      <div v-for="(msg, idx) in messages" :key="msg.id || idx" class="chat-message" :class="msg.from" :data-id="msg.id">
        <span v-for="(part, pidx) in processMessage(msg.text)" :key="pidx">
          <template v-if="part.type === 'text'">
            {{ part.text }}
          </template>
          <template v-else-if="part.type === 'newline'">
            <br />
          </template>
          <template v-else-if="part.type === 'bold'">
            <strong>{{ part.text }}</strong>
          </template>
          <template v-else-if="part.type === 'italic'">
            <em>{{ part.text }}</em>
          </template>
          <template v-else-if="part.type === 'del'">
            <del>{{ part.text }}</del>
          </template>
          <template v-else-if="part.type === 'code'">
            <code>{{ part.text }}</code>
          </template>
          <template v-else-if="part.type === 'pre'">
            <pre>{{ part.text }}</pre>
          </template>
          <template v-else-if="part.type === 'link'">
            <a
                :href="part.url"
                target="_blank"
                rel="noopener noreferrer"
                @click.prevent="confirmExternalLink(part.url)"
            >
              {{ part.text }}
            </a>
          </template>
          <template v-else-if="part.type === 'img'">
            <img
              :src="part.src"
              style="max-width: 80%; max-height: 300px; margin: 8px 0; object-fit: contain;"
              @click="showImagePreview(part.src)"
            />
          </template>
        </span>
        <div v-if="debug" class="debug-uuid">{{ msg.id }}</div>
      </div>
    </div>

    <div class="send-box">
      <el-input
        v-model="inputText"
        :placeholder="$t('chat.input.send')"
        @keydown.enter="handleEnterKey"
        class="chat-send-input"
        type="textarea"
        resize="none"
        clearable
        autosize
        :disabled="connectionStatus != 'connected'"
      />
      <el-button
      type="primary"
      @click="sendMessage"
      style="margin-left: 10px;"
      :disabled="connectionStatus != 'connected' || inputText.trim() === ''"
      >
        {{ $t('chat.button.send') }}
      </el-button>
    </div>
    <el-dialog
      v-model="imageDialogVisible"
      class="image-preview-dialog"
      :show-close="false"
      :center="true"
    >
      <img :src="previewImageSrc" style="width: 100%; height: 100%;">
    </el-dialog>
  </div>
</template>

<script>
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { v4 as uuidv4 } from 'uuid';
import { useI18n } from 'vue-i18n';

export default {
  name: "ChatView",
  data() {
    const { t } = useI18n();

    return {
      inputText: "",
      messages: [],
      chatBox: null,
      websocket: null,
      connectionStatus: "connecting",
      imageDialogVisible: false,
      previewImageSrc: "",
      cancelTokenSource: axios.CancelToken.source(),
      debug: process.env.VUE_APP_DEBUG === "true",
      t
    };
  },
  methods: {
    async connectWebSocket() {
      this.connectionStatus = "connecting";
      try {
        const response = await fetch("/config.json");
        const config = await response.json();
        let baseUrl = config.api_url;

        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = "http://" + baseUrl;
        }

        const url = new URL(baseUrl);
        const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${url.hostname}:${url.port}/ws/chat`;

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          this.connectionStatus = "connected";
        };

        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.action === "delete" && Array.isArray(data.id)) {
            this.messages = this.messages.filter(msg => !data.id.includes(msg.id));
            return;
          }

          if (data.action === "send") {
            this.messages.push({
              from: "bot",
              text: this.renderResponse(data.message),
              id: data.id || uuidv4()
            });
            
            this.scrollToBottom();
          }
        };

        this.websocket.onerror = () => {
          this.connectionStatus = "disconnected";
          ElMessage.error(this.t('message.error.connect.server'));
        };
      } catch (error) {
        this.connectionStatus = "disconnected";
        ElMessage.error(this.t('message.error.connect') + error.message);
      }
    },

    async authenticateToken() {
      try {
        const response = await axios.get("/api/verify-token", {
          cancelToken: this.cancelTokenSource.token,
        });

        if (response.status === 200) {
          this.connectWebSocket();
        } else {
          this.connectionStatus = "disconnected";
          ElMessage.error(this.t('message.error.connect.auth'));
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          this.connectionStatus = "disconnected";
          ElMessage.error(this.t('message.error.fetch') + error.message);
        }
      }
    },

    sendMessage() {
      const text = this.inputText.trim();
      if (!text) return;

      const uuid = uuidv4();
      this.messages.push({ from: "user", text: text, id: uuid });
      this.websocket?.send(JSON.stringify({
        action: "send",
        message: [{ type: "text", content: text }],
        id: uuid
      }));
      this.inputText = "";
      this.scrollToBottom();
    },

    resetChat() {
      this.connectionStatus = "connecting";
      this.messages = [];

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close();
      }

      this.authenticateToken();
    },

    scrollToBottom() {
      this.$nextTick(() => {
        if (this.chatBox) {
          this.chatBox.scrollTop = this.chatBox.scrollHeight;
        }
      });
    },

    handleEnterKey(event) {
      if (event.shiftKey) {
        return;
      } else {
        event.preventDefault();
        this.sendMessage();
      }
    },

    processMessage(text) {
      const parts = [];
      const codeBlockRegex = /```\n*([\s\S]*?)\n*```/g;
      const imageRegex = /\[image:([^<]+)\]/g;

      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        const index = match.index;

        if (index > lastIndex) {
          const beforeCode = text.slice(lastIndex, index);
          parts.push(...this.processInlineMessage(beforeCode));
        }

        parts.push({
          type: 'pre',
          text: match[1],
        });

        lastIndex = codeBlockRegex.lastIndex;
      }

      while ((match = imageRegex.exec(text)) !== null) {
        const index = match.index;
        if (index > lastIndex) {
          const beforeImage = text.slice(lastIndex, index);
          parts.push(...this.processInlineMessage(beforeImage));
        }

        const base64Content = `${match[1]}`;
        if (base64Content.startsWith("data:image/png;base64,") || base64Content.startsWith("data:image/jpeg;base64,") || base64Content.startsWith("data:image/gif;base64,")) {
          parts.push({
            type: 'img',
            src: base64Content,
          });
        }

        lastIndex = imageRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push(...this.processInlineMessage(text.slice(lastIndex)));
      }

      return parts;
    },

    processInlineMessage(text) {
      const parts = [];
      let lastIndex = 0;

      const pattern =
        /(?:\*\*(.+?)\*\*)|(?:_(.+?)_)|(?:~~(.+?)~~)|(?:`(.+?)`)|(?:\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|((?:https?:\/\/)[^\s]+)/g;

      let match;
      while ((match = pattern.exec(text)) !== null) {
        const index = match.index;

        if (index > lastIndex) {
          const before = text.slice(lastIndex, index);
          parts.push(...this.splitTextWithLineBreaks(before));
        }

        if (match[1]) {
          parts.push({ type: 'bold', text: match[1] });
        } else if (match[2]) {
          parts.push({ type: 'italic', text: match[2] });
        } else if (match[3]) {
          parts.push({ type: 'del', text: match[3] });
        } else if (match[4]) {
          parts.push({ type: 'code', text: match[4] });
        } else if (match[5] && match[6]) {
          parts.push({ type: 'link', text: match[5], url: match[6] });
        } else if (match[7]) {
          parts.push({ type: 'link', text: match[7], url: match[7] });
        }

        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push(...this.splitTextWithLineBreaks(text.slice(lastIndex)));
      }

      return parts;
    },

    splitTextWithLineBreaks(text) {
      const parts = [];
      const lines = text.split('\n');

      lines.forEach((line, i) => {
        if (line) parts.push({ type: 'text', text: line });
        if (i < lines.length - 1) {
          parts.push({ type: 'newline' });
        }
      });

      return parts;
    },

    confirmExternalLink(url) {
      ElMessageBox.confirm(
        this.$t('chat.external_link.confirm.message', {url: url}),
        this.$t('chat.external_link.confirm.title'),
        {
          confirmButtonText: this.$t('yes'),
          cancelButtonText: this.$t('no'),
          type: 'warning',
        }
      )
        .then(() => {
          window.open(url, '_blank');
        })
        .catch(() => {
          console.log('Link blocked');
        });
    },

    renderResponse(data) {
      if (Array.isArray(data)) {
        return data
          .map((item) => {
            if (item.type === "text") {
              return item.content;
            }
            if (item.type === "image") {
              const base64Content = item.content;
              if (base64Content.startsWith("data:image/png;base64,") || 
                  base64Content.startsWith("data:image/jpeg;base64,") || 
                  base64Content.startsWith("data:image/gif;base64,")) {
                return `[image:${base64Content}]`;
              }
              return "";
            }
            return "";
          })
          .join("\n");
      }
      return data;
    },

    showImagePreview(src) {
      this.previewImageSrc = src;
      this.imageDialogVisible = true;
    },
  },

  mounted() {
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
  pre {
    color : black;
    background-color: #f7f7f7;
    border: 1px solid #dcdcdc;
    padding: 15px;
    border-radius: 8px;
    font-family: "Consolas", "Noto Sans Mono", "Courier New", Courier, monospace;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  code {
    color : black;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Consolas", "Noto Sans Mono", "Courier New", Courier, monospace;
  }

  .dark pre {
    color : white;
    background-color: #2a2a2a;
    border: 1px solid #444;
  }

  .dark code {
    color : white;
    background-color: #3a3a3a;
    border: 1px solid #555;
  }

  .chat-container {
    border-radius: 10px;
    overflow-y: auto;
  }

  .chat-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 20px;
    background: #f3f3f3;
    border-bottom: 1px solid #e0e0e0;
  }

  .dark .chat-header {
    background: #333;
    border-bottom: 1px solid #1f1f1f;
  }

  .connection-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .connection-indicator:hover::after {
    content: attr(title);
    display: block;
    position: absolute;
    top: 20px;
    left: 0;
    background-color: #000;
    color: #fff;
    padding: 5px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
  }

  .chat-title {
    flex: 1;
    font-size: 18px;
    font-weight: bold;
  }

  .reset-button {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 22px !important;
  color: inherit;
  transition: color 0.3s ease;
  }

  .reset-button:hover {
    background-color: #f3f3f3;
    color: #888;
  }

  .dark .reset-button:hover {
    background-color: #333;
    color: #aaa;
  }

  .chat-box {
    height: calc(80vh - 100px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background-color: #e8e8e8;
  }

  .dark .chat-box {
    background-color: #242424;
  }

  .chat-placeholder {
    flex: 1;
    gap: 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    color: #999;
    font-size: 28px;
  }

  .placeholder-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 20px;
  }

  .placeholder-sub {
    color: #777;
    font-size: 14px;
    margin-top: 4px;
  }

  .dark .chat-placeholder {
    color: #aaa;
  }

  .dark .placeholder-title {
    color: #eee;
  }

  .dark .placeholder-sub {
    color: #888;
  }

  .chat-message {
    margin: 12px 20px;
    line-height: 1.6;
    display: inline-block;
    max-width: 70%;
    border-radius: 10px;
    padding: 10px;
    word-wrap: break-word;
    word-break: break-word;
  }

  .chat-message.user {
    background-color: #0091ff;
    color: white;
    align-self: flex-end;
    border-top-right-radius: 0;
  }

  .chat-message.bot {
    background-color: white;
    color: black;
    align-self: flex-start;
    border-top-left-radius: 0;
  }

  .dark .chat-message.bot {
    background-color: #333;
    color: white;
  }

  .debug-uuid {
    margin-top: 4px;
    font-size: 10px;
    color: #666;
  }

  .send-box {
    height: auto;
    min-height: 50px;
    display: flex;
    align-items: center;
    padding: 10px 20px;
    background: #f3f3f3;
    border-top: 1px solid #e0e0e0;
  }

  .dark .send-box {
    border-top: 1px solid #1f1f1f;
    background: #333;
  }

  .dark .chat-send-input {
    background-color: #181818;
    border-radius: 5px;
  }

  .el-button:disabled {
    cursor: default !important;
  }
</style>
