import { reactive } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

class WebSocketService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.isReady = false
    this.reconnectTimer = null
    this.listeners = new Map()
    this.userInfo = null
    this.messages = reactive([])
    this.shouldReconnect = false
  }

  getAvatarUrl(avatar) {
    console.log('getAvatarUrl 输入:', avatar)
    if (!avatar) {
      const defaultUrl = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
      console.log('getAvatarUrl 输出(默认):', defaultUrl)
      return defaultUrl
    }
    if (avatar.startsWith('http')) {
      console.log('getAvatarUrl 输出(完整URL):', avatar)
      return avatar
    }
    const baseUrl = import.meta.env.VITE_PROXY || ''
    const fullUrl = baseUrl.replace(/\/$/, '') + avatar
    console.log('getAvatarUrl 输出(拼接):', { baseUrl, avatar, fullUrl })
    return fullUrl
  }

  connect(url, userInfo) {
    if (this.ws && this.isConnected) {
      console.log('WebSocket 已连接，跳过重复连接')
      return
    }

    this.shouldReconnect = true
    this.userInfo = userInfo
    console.log('开始连接 WebSocket:', url, '用户信息:', userInfo)
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket 连接成功')
      this.isConnected = true
      this.isReady = true
      this.emit('open')
      this.emit('ready')
      
      // 连接成功后发送上线通知
      if (this.userInfo) {
        this.sendOnline()
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket 连接错误:', error)
      this.emit('error', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket 连接关闭')
      this.isConnected = false
      this.isReady = false
      this.emit('close')
      if (this.shouldReconnect) {
        this.reconnect()
      }
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'chat':
        console.log('收到聊天消息:', data.payload)
        this.addChatMessage(data.payload)
        this.emit('chat', data.payload)
        break
      case 'card':
        console.log('收到卡片消息:', data)
        console.log('卡片消息参数:', data.payload)
        
        // 添加卡片消息到历史记录
        this.addCardMessage(data.payload)
        
        // 检查是否是给当前用户发送的
        const userStore = useUserStore()
        const currentUserId = userStore.id
        const messageUserId = data.payload.userId
        
        // 将两者都转换为数字进行比较
        const currentUserIdNum = Number(currentUserId)
        const messageUserIdNum = Number(messageUserId)
        
        console.log('当前用户ID:', currentUserId, '(数字:', currentUserIdNum, ') 消息目标用户ID:', messageUserId, '(数字:', messageUserIdNum, ')')
        
        if (currentUserIdNum && messageUserIdNum === currentUserIdNum) {
          console.log('收到卡片消息')
          showToast({
            message: '收到新卡片！',
            type: 'success'
          })
        }
        
        this.emit('card', data.payload)
        break
      case 'chatHistory':
        console.log('收到聊天历史消息:', data)
        console.log('聊天历史消息参数:', data.payload)
        
        // 处理聊天历史消息
        if (Array.isArray(data.payload)) {
          data.payload.forEach(msg => {
            if (msg.type === 'chat') {
              this.addChatMessage(msg)
            } else if (msg.type === 'card') {
              this.addCardMessage(msg)
            }
          })
        }
        
        this.emit('chatHistory', data.payload)
        break
      case 'onlineUsers':
        console.log('收到在线用户列表:', data.payload)
        this.emit('onlineUsers', data.payload)
        break
      case 'userOnline':
        this.emit('userOnline', data.payload)
        break
      case 'userOffline':
        this.emit('userOffline', data.payload)
        break
      default:
        console.log('未知消息类型:', data.type)
    }
  }

  addChatMessage(payload) {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const time = `${hours}:${minutes}`
    const rawTime = now.toISOString()
    
    const avatar = payload.avatar || payload.fromAvatar || ''
    const avatarUrl = this.getAvatarUrl(avatar)
    
    const messageData = {
      id: payload.id || Date.now(),
      type: 'chat',
      fromUsername: payload.fromUsername || payload.username,
      userId: Number(payload.userId),
      message: payload.message || payload.content,
      avatar: avatarUrl,
      time: time,
      rawTime: rawTime
    }
    
    console.log('添加聊天消息:', messageData)
    this.messages.push(messageData)
  }
  
  addCardMessage(payload) {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const time = `${hours}:${minutes}`
    const rawTime = now.toISOString()
    
    const avatar = payload.avatar || payload.fromAvatar || ''
    const avatarUrl = this.getAvatarUrl(avatar)
    
    const messageData = {
      id: payload.id || Date.now(),
      type: 'card',
      fromUsername: payload.fromUsername || payload.username,
      userId: Number(payload.userId),
      message: `收到一张卡片: ${payload.title || '卡片'}`,
      content: payload.content || '',
      title: payload.title || '卡片',
      avatar: avatarUrl,
      time: time,
      rawTime: rawTime
    }
    
    console.log('添加卡片消息到历史记录:', messageData)
    this.messages.push(messageData)
  }

  send(data) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data))
      console.log('发送消息:', data)
    } else {
      console.error('WebSocket 未连接，无法发送消息')
      throw new Error('WebSocket 未连接')
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data)
      })
    }
  }

  reconnect() {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('尝试重新连接 WebSocket...')
      this.reconnectTimer = null
      const url = import.meta.env.VITE_WS_URL || import.meta.env.VITE_PROXY_WS || 'ws://localhost:1234/ws'
      this.connect(url, this.userInfo)
    }, 5000)
  }

  close() {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws && this.isConnected) {
      // 关闭连接前发送下线通知
      this.sendOffline()
      // 等待一小段时间确保通知发送成功
      setTimeout(() => {
        if (this.ws) {
          this.ws.close()
          this.ws = null
          this.isConnected = false
          this.isReady = false
        }
      }, 100)
    }
  }

  clearMessages() {
    this.messages.length = 0
  }

  // 发送上线通知
  sendOnline() {
    if (this.ws && this.isConnected && this.userInfo) {
      const onlineMsg = {
        type: 'userOnline',
        payload: {
          userId: this.userInfo.userId,
          username: this.userInfo.username,
          avatar: this.userInfo.avatar
        }
      }
      this.send(onlineMsg)
      console.log('发送上线通知:', onlineMsg)
    }
  }

  // 发送下线通知
  sendOffline() {
    if (this.ws && this.isConnected && this.userInfo) {
      const offlineMsg = {
        type: 'userOffline',
        payload: {
          userId: this.userInfo.userId,
          username: this.userInfo.username
        }
      }
      this.send(offlineMsg)
      console.log('发送下线通知:', offlineMsg)
    }
  }
}

const wsService = new WebSocketService()

export default wsService
