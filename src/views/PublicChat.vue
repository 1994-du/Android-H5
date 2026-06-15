<template>
  <div class="public-chat dxx_wrap">
    <Transition name="notify-fade">
      <div 
        v-if="notifyMessage.show" 
        class="custom-notify"
        :style="{ 
          top: 'var(--app-header-height)',
          background: notifyMessage.background 
        }"
      >
        {{ notifyMessage.text }}
      </div>
    </Transition>
    <div class="chat-container" :style="chatContainerStyle">
      <div class="message-list" ref="messageList">
        <div 
          v-for="(msg, index) in messages" 
          :key="msg.id || index"
          :class="['message-item', msg.isSelf ? 'self' : 'other']"
        >
          <div class="avatar">
            <van-image
              round
              width="40"
              height="40"
              :src="msg.avatar"
            />
          </div>
          <div class="message-content">
            <div class="username" v-if="!msg.isSelf">{{ msg.fromUsername }}</div>
            <div :class="['bubble', msg.type === 'card' ? 'card-bubble' : '']">{{ msg.content }}</div>
            <div class="time">{{ msg.time }}</div>
          </div>
        </div>
        <div ref="bottomAnchor"></div>
      </div>

      <Transition name="drawer-slide">
        <div
          v-if="showOnlineUsers"
          class="online-users-overlay"
          :style="onlineUsersOverlayStyle"
          @click.self="showOnlineUsers = false"
        >
          <div class="online-users-panel">
            <div class="panel-header">
              <span>在线用户 ({{ onlineUsers.length }})</span>
              <van-icon name="cross" size="20" @click="showOnlineUsers = false" />
            </div>
            <div class="user-list">
              <div 
                v-for="user in onlineUsers" 
                :key="user.userId"
                class="user-item"
              >
                <van-image
                  round
                  width="40"
                  height="40"
                  :src="user.avatar"
                />
                <div class="user-info">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-status">在线</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="input-area" :style="inputAreaStyle">
        <div class="chat-toolbar">
          <button
            type="button"
            class="tool-btn emoji-btn"
            :class="{ active: showEmojiPanel }"
            @click="toggleEmojiPanel"
          >
            <van-icon name="smile-o" size="22" />
          </button>

          <div class="message-input-shell">
            <textarea
              ref="textareaRef"
              v-model="inputMessage"
              class="message-textarea"
              rows="1"
              placeholder="输入消息..."
              @input="handleInputChange"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              @keydown.enter.exact.prevent="sendMessage"
            ></textarea>
          </div>

          <button
            v-if="hasInputText"
            type="button"
            class="send-text-btn"
            @click="sendMessage"
          >
            发送
          </button>

          <button
            v-else
            type="button"
            class="tool-btn plus-btn"
            :class="{ active: showMorePanel }"
            @click="toggleMorePanel"
          >
            <van-icon name="add-o" size="22" />
          </button>
        </div>

        <Transition name="emoji-panel">
          <div v-if="showEmojiPanel" class="emoji-panel">
            <button
              v-for="emoji in emojiList"
              :key="emoji"
              type="button"
              class="emoji-item"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </Transition>

        <Transition name="emoji-panel">
          <div v-if="showMorePanel" class="more-panel">
            <button
              v-for="action in moreActionList"
              :key="action.title"
              type="button"
              class="more-item"
              @click="handleMoreAction(action)"
            >
              <span class="more-icon" :style="{ background: action.background }">
                <van-icon :name="action.icon" size="22" />
              </span>
              <span class="more-title">{{ action.title }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import wsService from '@/utils/websocket'

const userStore = useUserStore()

const inputMessage = ref('')
const messageList = ref(null)
const bottomAnchor = ref(null)
const showOnlineUsers = ref(false)
const onlineUsers = ref([])
const keyboardHeight = ref(0)
const textareaRef = ref(null)
const activePanel = ref('')
const BASE_COMPOSER_HEIGHT = 72
const BOTTOM_PANEL_HEIGHT = 220
const emojiList = ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🥳', '🤔', '😭', '😡', '👍', '👀', '🙏', '🎉', '❤️', '🔥', '👏', '💪', '😴', '🤝', '✨', '🎈']
const moreActionList = [
  { title: '拍照', icon: 'photograph', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { title: '相册', icon: 'photo-o', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
]

const notifyMessage = ref({
  show: false,
  text: '',
  background: '#07c160'
})

let notifyTimer = null

const showEmojiPanel = computed(() => activePanel.value === 'emoji')
const showMorePanel = computed(() => activePanel.value === 'more')
const hasInputText = computed(() => inputMessage.value.trim().length > 0)

const showUserNotify = (text, background = '#07c160') => {
  if (notifyTimer) {
    clearTimeout(notifyTimer)
  }
  notifyMessage.value = { show: true, text, background }
  notifyTimer = setTimeout(() => {
    notifyMessage.value.show = false
  }, 2000)
}

const handleInputFocus = () => {
  activePanel.value = ''
  setTimeout(() => {
    resizeTextarea()
    scrollToBottom()
  }, 100)
}

const handleInputBlur = () => {
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

const resizeTextarea = () => {
  const textarea = textareaRef.value

  if (!textarea) return

  textarea.style.height = '20px'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 92)}px`
}

const handleInputChange = () => {
  resizeTextarea()
}

const setKeyboardHeight = (visible, height) => {
  console.log('键盘状态:', { visible, height })
  if (visible && height > 0) {
    keyboardHeight.value = height
    activePanel.value = ''
  } else {
    keyboardHeight.value = 0
  }
  console.log('设置键盘高度:', keyboardHeight.value)
  setTimeout(scrollToBottom, 50)
}

const initWebSocket = () => {
  // 进入聊天页时建立 WebSocket 连接
  if (userStore.token && userStore.id && !wsService.isConnected) {
    console.log('WebSocket未连接，尝试重新连接')
    const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_PROXY_WS || 'ws://localhost:1234/ws'
    const userInfo = {
      userId: Number(userStore.id),
      username: userStore.username,
      avatar: userStore.avatar
    }
    wsService.connect(wsUrl, userInfo)
  }
}

const messages = computed(() => {
  const currentUserId = Number(userStore.id)
  return wsService.messages
    .filter(msg => typeof msg?.message === 'string' && msg.message.trim())
    .sort((a, b) => {
      const timeA = a.rawTime ? new Date(a.rawTime).getTime() : (a.id || 0)
      const timeB = b.rawTime ? new Date(b.rawTime).getTime() : (b.id || 0)
      return timeA - timeB
    })
    .map(msg => {
      const isSelf = Number(msg.userId) === currentUserId
      return {
        id: msg.id,
        content: msg.message,
        type: msg.type,
        isSelf: isSelf,
        avatar: msg.avatar,
        time: msg.time,
        fromUsername: msg.fromUsername
      }
    })
})

const keyboardOffset = computed(() => (
  keyboardHeight.value > 0 ? keyboardHeight.value : 0
))

const chatContainerStyle = computed(() => ({
  paddingBottom: `${currentComposerHeight.value + keyboardOffset.value}px`
}))

const inputAreaStyle = computed(() => ({
  bottom: keyboardHeight.value > 0
    ? `${keyboardHeight.value}px`
    : 'var(--app-tabbar-height)'
}))

const onlineUsersOverlayStyle = computed(() => ({
  bottom: `${currentComposerHeight.value + keyboardOffset.value}px`
}))

const currentComposerHeight = computed(() => (
  BASE_COMPOSER_HEIGHT + ((showEmojiPanel.value || showMorePanel.value) ? BOTTOM_PANEL_HEIGHT : 0)
))

const scrollToBottom = () => {
  nextTick(() => {
    if (bottomAnchor.value) {
      bottomAnchor.value.scrollIntoView({ behavior: 'smooth' })
    } else if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

watch(() => wsService.messages.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    scrollToBottom()
  }
})

watch(keyboardHeight, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

watch(activePanel, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

const focusTextarea = () => {
  textareaRef.value?.focus()
}

const toggleEmojiPanel = () => {
  if (showEmojiPanel.value) {
    activePanel.value = ''
    return
  }

  activePanel.value = 'emoji'
  keyboardHeight.value = 0
  textareaRef.value?.blur()
  nextTick(() => {
    scrollToBottom()
  })
}

const toggleMorePanel = () => {
  if (showMorePanel.value) {
    activePanel.value = ''
    return
  }

  activePanel.value = 'more'
  keyboardHeight.value = 0
  textareaRef.value?.blur()
  nextTick(() => {
    scrollToBottom()
  })
}

const insertEmoji = (emoji) => {
  const textarea = textareaRef.value

  if (!textarea) {
    inputMessage.value += emoji
    return
  }

  const start = textarea.selectionStart ?? inputMessage.value.length
  const end = textarea.selectionEnd ?? inputMessage.value.length
  inputMessage.value = `${inputMessage.value.slice(0, start)}${emoji}${inputMessage.value.slice(end)}`

  nextTick(() => {
    resizeTextarea()
    const caret = start + emoji.length
    if (!showEmojiPanel.value) {
      textarea.focus()
    }
    textarea.setSelectionRange(caret, caret)
  })
}

const handleMoreAction = (action) => {
  if (action.title === '拍照') {
    openCamera()
    return
  }

  if (action.title === '相册') {
    openGallery()
  }
}

const callbackId = `chat_${Date.now()}`

const openCamera = () => {
  if (window.AndroidPhoto && window.AndroidPhoto.openCamera) {
    window.AndroidPhoto.openCamera(callbackId)
  } else {
    showToast('当前环境不支持相机')
  }
}

const openGallery = () => {
  if (window.AndroidPhoto && window.AndroidPhoto.openGallery) {
    window.AndroidPhoto.openGallery(callbackId)
  } else {
    showToast('当前环境不支持相册')
  }
}

const handlePhotoResult = async (data) => {
  try {
    const { callbackId: id, image: imageData } = data || {}
    if (id !== callbackId) return
    if (!imageData) {
      showToast('图片数据为空')
      return
    }

    let dataUrl = imageData
    if (!imageData.startsWith('data:')) {
      dataUrl = `data:image/jpeg;base64,${imageData}`
    }

    const message = {
      type: 'chat',
      payload: {
        userId: Number(userStore.id),
        fromUsername: userStore.username,
        avatar: userStore.avatar,
        message: '[图片]',
        content: '[图片]',
        time: new Date().toTimeString().slice(0, 5),
        image: dataUrl
      }
    }

    wsService.send(message)
    activePanel.value = ''
  } catch (error) {
    showToast('发送图片失败')
    console.error(error)
  }
}

const handlePhotoError = (data) => {
  const { callbackId: id, error } = data || {}
  if (id === callbackId) {
    showToast('获取图片失败: ' + error)
  }
}

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  
  if (!wsService.isConnected) {
    showToast('正在连接服务器...')
    return
  }
  
  if (!wsService.isReady) {
    showToast('正在建立连接，请稍后...')
    return
  }
  
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const time = `${hours}:${minutes}`
  
  const message = {
    type: 'chat',
    payload: {
      userId: Number(userStore.id),
      fromUsername: userStore.username,
      avatar: userStore.avatar,
      message: inputMessage.value,
      time: time
    }
  }
  
  wsService.send(message)
  
  inputMessage.value = ''
  activePanel.value = ''
  
  nextTick(() => {
    resizeTextarea()
    focusTextarea()
  })
}

const handleChatMessage = () => {
  scrollToBottom()
}

const handleOnlineUsers = (users) => {
  console.log('收到在线用户列表:', users)
  const currentUserId = Number(userStore.id)
  onlineUsers.value = (users || [])
    .filter(u => Number(u.userId) !== currentUserId)
    .map(u => {
      const avatarUrl = wsService.getAvatarUrl(u.avatar)
      console.log('处理在线用户头像:', { userId: u.userId, username: u.username, avatar: u.avatar, avatarUrl })
      return {
        ...u,
        avatar: avatarUrl
      }
    })
}

const handleUserOnline = (user) => {
  console.log('用户上线:', user)
  if (Number(user.userId) !== Number(userStore.id)) {
    const exists = onlineUsers.value.find(u => u.userId === user.userId)
    if (!exists) {
      const avatarUrl = wsService.getAvatarUrl(user.avatar)
      console.log('处理上线用户头像:', { userId: user.userId, username: user.username, avatar: user.avatar, avatarUrl })
      onlineUsers.value.push({
        ...user,
        avatar: avatarUrl
      })
    }
    showUserNotify(`${user.username} 上线了`, '#07c160')
  }
}

const handleUserOffline = (user) => {
  console.log('用户下线:', user)
  if (Number(user.userId) !== Number(userStore.id)) {
    const index = onlineUsers.value.findIndex(u => u.userId === user.userId)
    if (index !== -1) {
      onlineUsers.value.splice(index, 1)
    }
    showUserNotify(`${user.username} 下线了`, '#ff976a')
  }
}

const handleReady = () => {
  // 上线通知已经在WebSocket的onopen事件中发送了
  console.log('WebSocket已准备好')
}

const handleChatHistory = (historyMessages) => {
  console.log('收到聊天历史并已回显:', historyMessages)
  scrollToBottom()
}

const handleHeaderAction = (event) => {
  if (event.detail?.action === 'online-users') {
    showOnlineUsers.value = true
  }
}

onMounted(() => {
  scrollToBottom()
  nextTick(() => {
    resizeTextarea()
    initWebSocket()
  })
  
  wsService.on('ready', handleReady)
  wsService.on('chat', handleChatMessage)
  wsService.on('chatHistory', handleChatHistory)
  wsService.on('onlineUsers', handleOnlineUsers)
  wsService.on('userOnline', handleUserOnline)
  wsService.on('userOffline', handleUserOffline)
  window.addEventListener('app-header-action', handleHeaderAction)
  window.handlePhotoResult = handlePhotoResult
  window.handlePhotoError = handlePhotoError
  
  window.handleKeyboardStatus = function(visible, height) {
    console.log('输入法状态:', { visible, height })
    setKeyboardHeight(visible, height)
  }
})

onUnmounted(() => {
  wsService.off('ready', handleReady)
  wsService.off('chat', handleChatMessage)
  wsService.off('chatHistory', handleChatHistory)
  wsService.off('onlineUsers', handleOnlineUsers)
  wsService.off('userOnline', handleUserOnline)
  wsService.off('userOffline', handleUserOffline)
  window.removeEventListener('app-header-action', handleHeaderAction)
  window.handlePhotoResult = null
  window.handlePhotoError = null
  
  window.handleKeyboardStatus = null
})
</script>

<style scoped lang="less">
.public-chat {
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  padding-bottom: 20px;
  min-height: 0;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  
  &.self {
    flex-direction: row-reverse;
    
    .message-content {
      align-items: flex-end;
    }
    
    .bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
  }
  
  &.other {
    .bubble {
      background: #fff;
      color: #333;
    }
  }
}

.avatar {
  flex-shrink: 0;
  margin: 0 10px;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.username {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  padding: 0 5px;
}

.bubble {
  padding: 10px 15px;
  border-radius: 8px;
  word-wrap: break-word;
  word-break: break-all;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-bubble {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%) !important;
  color: #333 !important;
  border: 1px solid #ff9a9e;
  font-weight: 500;
}

.time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  padding: 0 5px;
}

.input-area {
  position: fixed;
  bottom: calc(var(--app-tabbar-height));
  left: 0;
  right: 0;
  background: #f3f4f6;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  z-index: 100;
  transition: bottom 0.15s ease-out;
}

.chat-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.tool-btn,
.send-btn,
.emoji-item {
  border: 0;
  outline: none;
  font: inherit;
}

.tool-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.active {
    color: #07c160;
  }
}

.message-input-shell {
  flex: 1;
  min-height: 40px;
  max-height: 112px;
  background: #ffffff;
  border-radius: 22px;
  padding: 10px 14px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.message-textarea {
  width: 100%;
  min-height: 20px;
  max-height: 92px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: #111827;
  font-size: 15px;
  line-height: 1.4;
  display: block;
}

.message-textarea::placeholder {
  color: #9ca3af;
}

.send-btn {
  display: none;
}

.send-text-btn {
  min-width: 64px;
  height: 40px;
  border-radius: 20px;
  padding: 0 18px;
  border: none;
  background: linear-gradient(135deg, #647cf0 0%, #7b52ba 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 10px 22px rgba(109, 94, 211, 0.22);
  transition: transform 0.18s ease, opacity 0.18s ease;

  &:active {
    transform: scale(0.96);
  }
}

.emoji-panel {
  margin-top: 10px;
  height: 220px;
  padding: 14px 6px 8px;
  border-radius: 22px 22px 0 0;
  background: linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
}

.emoji-item {
  height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05);
}

.emoji-panel-enter-active,
.emoji-panel-leave-active {
  transition: all 0.22s ease;
}

.emoji-panel-enter-from,
.emoji-panel-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.more-panel {
  margin-top: 10px;
  height: 220px;
  padding: 18px 10px 10px;
  border-radius: 22px 22px 0 0;
  background: linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 88px));
  justify-content: start;
  gap: 14px 10px;
  overflow: hidden;
}

.more-item {
  appearance: none;
  -webkit-appearance: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  padding: 0;

  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }
}

.more-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.more-title {
  font-size: 12px;
  color: #4b5563;
}

.online-users-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.online-users-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 70%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: opacity 0.22s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active .online-users-panel,
.drawer-slide-leave-active .online-users-panel {
  transition: transform 0.25s ease;
}

.drawer-slide-enter-from .online-users-panel,
.drawer-slide-leave-to .online-users-panel {
  transform: translateX(100%);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 600;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f7f8fa;
  
  &:active {
    background: #eee;
  }
}

.user-info {
  margin-left: 12px;
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.user-status {
  font-size: 12px;
  color: #07c160;
  margin-top: 2px;
}

.custom-notify {
  position: fixed;
  left: 0;
  right: 0;
  padding: 10px 16px;
  color: #fff;
  font-size: 14px;
  text-align: center;
  z-index: 9999;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.notify-fade-enter-active,
.notify-fade-leave-active {
  transition: all 0.3s ease;
}

.notify-fade-enter-from,
.notify-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
