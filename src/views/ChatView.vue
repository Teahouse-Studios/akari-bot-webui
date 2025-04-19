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
        :title="connectionStatus === 'connected' ? '已连接' : 
                connectionStatus === 'connecting' ? '连接中' : '未连接'"
      ></div>
      <div class="chat-title"># 聊天</div>
      <el-button
        class="reset-button"
        @click="resetChat"
        title="清空会话"
        circle
      >
        <i class="mdi mdi-restart"></i>
      </el-button>
    </div>

    <div class="chat-box" ref="chatBox">
      <div v-if="messages.length === 0" class="chat-placeholder">
        <div class="placeholder-title">我是 AkariBot，很高兴见到你！</div>
        <div class="placeholder-sub">使用 <code>~help</code> 命令查看帮助</div>
        <div class="placeholder-sub">按下 <code>Enter</code> 发送消息</div>
        <div class="placeholder-sub">按下 <code>Shift + Enter</code> 换行</div>
      </div>

      <div v-for="(msg, idx) in messages" :key="idx" class="chat-message" :class="msg.from">
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
      </div>
    </div>

    <div class="send-box">
      <el-input
        v-model="inputText"
        placeholder="发送消息..."
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
        发送
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
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";

export default {
  name: "ChatView",
  setup() {
    const inputText = ref("");
    const messages = ref([]);
    const chatBox = ref(null);
    const websocket = ref(null);
    const connectionStatus = ref("connecting");
    const imageDialogVisible = ref(false);
    const previewImageSrc = ref("");
    const cancelTokenSource = axios.CancelToken.source();

    const connectWebSocket = async () => {
      connectionStatus.value = "connecting";

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

        websocket.value = new WebSocket(wsUrl);

        websocket.value.onopen = () => {
          connectionStatus.value = "connected";
        };

        websocket.value.onmessage = (event) => {
          const data = JSON.parse(event.data);
          messages.value.push({ from: "bot", text: renderResponse(data) });
          scrollToBottom();
        };

        websocket.value.onerror = () => {
          connectionStatus.value = "disconnected";
          ElMessage.error("与服务端的连接中断");
        };
      } catch (error) {
        connectionStatus.value = "disconnected";
        ElMessage.error("连接失败: " + error.message);
      }
    };

    const authenticateToken = async () => {
      try {
        const response = await axios.get("/api/verify-token", {
          cancelToken: cancelTokenSource.token,
        });

        if (response.status === 200) {
          connectWebSocket();
        } else {
          connectionStatus.value = "disconnected";
          ElMessage.error("身份验证失败");
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled");
        } else {
          connectionStatus.value = "disconnected";
          ElMessage.error("请求失败：" + error.message);
        }
      }
    };

    const sendMessage = () => {
      const text = inputText.value.trim();
      if (!text) return;

      messages.value.push({ from: "user", text: text });
      websocket.value?.send(text);
      inputText.value = "";
      scrollToBottom();
    };

    const resetChat = () => {
      connectionStatus.value = "connecting";
      messages.value = [];

      if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
          websocket.value.close();
      }

      authenticateToken();
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (chatBox.value) {
          chatBox.value.scrollTop = chatBox.value.scrollHeight;
        }
      });
    };

    const handleEnterKey = (event) => {
      if (event.shiftKey) {
        return;
      } else {
        event.preventDefault();
        sendMessage();
      }
    };

    const processMessage = (text) => {
      const parts = [];
      const codeBlockRegex = /```\n*([\s\S]*?)\n*```/g;
      const imageRegex = /\[image:([^<]+)\]/g;

      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
          const index = match.index;

          if (index > lastIndex) {
          const beforeCode = text.slice(lastIndex, index);
          parts.push(...processInlineMessage(beforeCode));
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
          parts.push(...processInlineMessage(beforeImage));
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
          parts.push(...processInlineMessage(text.slice(lastIndex)));
      }

      return parts;
    };

    const processInlineMessage = (text) => {
      const parts = [];
      let lastIndex = 0;

      const pattern =
          /(?:\*\*(.+?)\*\*)|(?:_(.+?)_)|(?:~~(.+?)~~)|(?:`(.+?)`)|(?:\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|((?:https?:\/\/)[^\s]+)/g;

      let match;
      while ((match = pattern.exec(text)) !== null) {
          const index = match.index;

          if (index > lastIndex) {
          const before = text.slice(lastIndex, index);
          parts.push(...splitTextWithLineBreaks(before));
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
          parts.push(...splitTextWithLineBreaks(text.slice(lastIndex)));
      }

      return parts;
    };

    const splitTextWithLineBreaks = (text) => {
      const parts = [];
      const lines = text.split('\n');

      lines.forEach((line, i) => {
          if (line) parts.push({ type: 'text', text: line });
          if (i < lines.length - 1) {
          parts.push({ type: 'newline' });
          }
      });

      return parts;
    };

    const confirmExternalLink = (url) => {
      ElMessageBox.confirm(
        `你正在前往外部链接：${url}，你确定吗？`,
        '外部链接警告',
        {
          confirmButtonText: '是',
          cancelButtonText: '否',
          type: 'warning',
        }
      )
        .then(() => {
          window.open(url, '_blank');
        })
        .catch(() => {
          console.log('Link blocked');
        });
    };

    const renderResponse = (data) => {
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
    };

    const showImagePreview = (src) => {
      previewImageSrc.value = src;
      imageDialogVisible.value = true;
    };

    onMounted(() => {
      authenticateToken();
    });

    onBeforeUnmount(() => {
      if (websocket.value) {
        websocket.value.close();
      }
      cancelTokenSource.cancel("Component unmounted");
    });

    return {
      inputText,
      messages,
      chatBox,
      connectionStatus,
      sendMessage,
      resetChat,
      processMessage,
      confirmExternalLink,
      handleEnterKey,
      imageDialogVisible,
      previewImageSrc,
      showImagePreview
    };
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
