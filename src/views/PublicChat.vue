<template>
  <DxxHeader :show-back="false">
    公共聊天
    <template #right>
      <van-icon name="friends-o" size="20" @click="showOnlineUsers = true" />
    </template>
  </DxxHeader>
  <div class="public-chat dxx_wrap">
    <Transition name="notify-fade">
      <div 
        v-if="notifyMessage.show" 
        class="custom-notify"
        :style="{ 
          top: `calc(var(--status-bar-height) + 46px)`,
          background: notifyMessage.background 
        }"
      >
        {{ notifyMessage.text }}
      </div>
    </Transition>
    <div class="chat-container" :style="{ paddingBottom: keyboardHeight > 0 ? (keyboardHeight + 60) + 'px' : '110px' }">
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
            <div class="bubble">{{ msg.content }}</div>
            <div class="time">{{ msg.time }}</div>
          </div>
        </div>
        <div ref="bottomAnchor"></div>
      </div>
      
      <div class="input-area" :style="{ bottom: keyboardHeight > 0 ? keyboardHeight + 'px' : '50px' }">
        <van-field
          ref="inputRef"
          v-model="inputMessage"
          placeholder="输入消息..."
          class="message-input"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @keyup.enter="sendMessage"
        >
          <template #button>
            <van-button 
              size="small" 
              type="primary"
              @click="sendMessage"
              :disabled="!inputMessage.trim()"
            >
              发送
            </van-button>
          </template>
        </van-field>
      </div>
    </div>
    
    <DxxTabbar />
    
    <van-popup 
      v-model:show="showOnlineUsers" 
      position="right" 
      :style="{ width: '70%', height: '100%' }"
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
    </van-popup>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { showToast } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import DxxTabbar from '@/components/DxxTabbar.vue'
import { useUserStore } from '@/stores/user'
import wsService from '@/utils/websocket'

const userStore = useUserStore()

const inputMessage = ref('')
const messageList = ref(null)
const bottomAnchor = ref(null)
const showOnlineUsers = ref(false)
const onlineUsers = ref([])
const keyboardHeight = ref(0)
const defaultBottom = 50
const inputRef = ref(null)

const notifyMessage = ref({
  show: false,
  text: '',
  background: '#07c160'
})

let notifyTimer = null

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
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

const handleInputBlur = () => {
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

const setKeyboardHeight = (visible, height) => {
  console.log('键盘状态:', { visible, height })
  if (visible && height > 0) {
    keyboardHeight.value = height
  } else {
    keyboardHeight.value = 0
  }
  console.log('设置键盘高度:', keyboardHeight.value)
  setTimeout(scrollToBottom, 50)
}

const initWebSocket = () => {
  if (userStore.token && userStore.id) {
    if (wsService.isConnected && wsService.isReady) {
      console.log('WebSocket 已连接且已准备好，跳过初始化')
      return
    }
    const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_PROXY_WS || 'ws://localhost:1234/ws'
    const userInfo = {
      userId: Number(userStore.id),
      username: userStore.username
    }
    wsService.connect(wsUrl, userInfo)
  } else {
    console.log('用户未登录或缺少用户ID，跳过WebSocket初始化')
  }
}

const messages = computed(() => {
  const currentUserId = Number(userStore.id)
  return wsService.messages
    .filter(msg => msg.type === 'chat')
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
        isSelf: isSelf,
        avatar: msg.avatar,
        time: msg.time,
        fromUsername: msg.fromUsername
      }
    })
})

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
  
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
    }
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
  wsService.send({
    type: 'userOnline',
    payload: {
      userId: Number(userStore.id),
      username: userStore.username,
      avatar: userStore.avatar
    }
  })
}

watch(() => userStore.token, (newToken, oldToken) => {
  if (newToken && !oldToken) {
    nextTick(() => {
      initWebSocket()
    })
  } else if (!newToken) {
    wsService.close()
  }
})

onMounted(() => {
  scrollToBottom()
  nextTick(() => {
    initWebSocket()
  })
  
  wsService.on('ready', handleReady)
  wsService.on('chat', handleChatMessage)
  wsService.on('onlineUsers', handleOnlineUsers)
  wsService.on('userOnline', handleUserOnline)
  wsService.on('userOffline', handleUserOffline)
  
  window.handleKeyboardStatus = function(visible, height) {
    console.log('输入法状态:', { visible, height })
    setKeyboardHeight(visible, height)
  }
})

onUnmounted(() => {
  if (wsService.isConnected) {
    wsService.send({
      type: 'userOffline',
      payload: {
        userId: Number(userStore.id),
        username: userStore.username
      }
    })
  }
  
  wsService.off('ready', handleReady)
  wsService.off('chat', handleChatMessage)
  wsService.off('onlineUsers', handleOnlineUsers)
  wsService.off('userOnline', handleUserOnline)
  wsService.off('userOffline', handleUserOffline)
  wsService.close()
  
  window.handleKeyboardStatus = null
})
</script>

<style scoped lang="less">
.public-chat {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: calc(46px + var(--status-bar-height));
  padding-bottom: 110px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  padding-bottom: 20px;
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

.time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  padding: 0 5px;
}

.input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 10px 15px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid #eee;
  z-index: 100;
  transition: bottom 0.15s ease-out;
}

.message-input {
  background: #f7f8fa;
  border-radius: 20px;
  padding: 5px 15px;
}

.online-users-panel {
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-top: var(--status-bar-height);
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
