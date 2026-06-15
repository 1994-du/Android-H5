import { reactive } from 'vue'

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
    this.messageSeq = 0
  }

  formatTime(timeValue) {
    if (!timeValue) {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }

    const date = new Date(timeValue)
    if (Number.isNaN(date.getTime())) {
      return typeof timeValue === 'string' ? timeValue : this.formatTime()
    }

    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  normalizeChatMessage(payload, fallbackType = 'chat', index = 0) {
    const source = payload?.payload && typeof payload.payload === 'object'
      ? payload.payload
      : payload

    if (!source) {
      return null
    }

    if (typeof source !== 'object') {
      const rawTime = new Date().toISOString()
      return {
        id: `${rawTime}-unknown-chat-${index}`,
        type: fallbackType === 'card' ? 'card' : 'chat',
        fromUsername: '未知用户',
        userId: null,
        message: String(source),
        avatar: this.getAvatarUrl(''),
        time: this.formatTime(rawTime),
        rawTime
      }
    }

    const rawTime = source.rawTime
      || source.createdAt
      || source.createTime
      || source.sendTime
      || source.timestamp
      || source.time
      || new Date().toISOString()
    const parsedRawTime = new Date(rawTime)
    const normalizedRawTime = Number.isNaN(parsedRawTime.getTime())
      ? new Date().toISOString()
      : parsedRawTime.toISOString()
    const sourceType = source.type || source.messageType || source.contentType || payload?.type
    const type = sourceType === 'card' || fallbackType === 'card'
      ? 'card'
      : 'chat'
    const rawMessage = source.message
      ?? source.content
      ?? source.text
      ?? source.msg
      ?? source.body
      ?? source.messageText
      ?? source.chatContent
      ?? ''
    const message = typeof rawMessage === 'string'
      ? rawMessage
      : String(rawMessage || '')

    if (!message) {
      return null
    }

    const avatar = source.avatar || source.fromAvatar || source.headImg || source.userAvatar || ''
    const rawUserId = source.userId ?? source.fromUserId ?? source.senderId ?? source.id ?? null
    const userId = rawUserId !== null && rawUserId !== undefined && rawUserId !== ''
      ? Number(rawUserId)
      : null
    const sourceMessageId = source.id || source.messageId || source.msgId || source.uuid || null

    return {
      id: sourceMessageId || `${normalizedRawTime}-${userId || 'unknown'}-${type}-${index}-${this.messageSeq++}`,
      type,
      fromUsername: source.fromUsername
        || source.username
        || source.nickname
        || source.fromName
        || source.senderName
        || '未知用户',
      userId,
      message,
      avatar: this.getAvatarUrl(avatar),
      time: this.formatTime(rawTime),
      rawTime: normalizedRawTime,
      sourceMessageId
    }
  }

  hasMessage(messageData) {
    return this.messages.some((item) => {
      if (item.sourceMessageId && messageData.sourceMessageId && item.sourceMessageId === messageData.sourceMessageId) {
        return true
      }

      if (item.id && messageData.id && item.id === messageData.id) {
        return true
      }

      return item.userId === messageData.userId
        && item.message === messageData.message
        && item.rawTime === messageData.rawTime
        && item.type === messageData.type
    })
  }

  appendMessage(payload, fallbackType = 'chat', index = 0) {
    const messageData = this.normalizeChatMessage(payload, fallbackType, index)

    if (!messageData || this.hasMessage(messageData)) {
      return null
    }

    console.log('添加聊天消息:', messageData)
    this.messages.push(messageData)
    this.messages.sort((a, b) => {
      const timeA = a.rawTime ? new Date(a.rawTime).getTime() : 0
      const timeB = b.rawTime ? new Date(b.rawTime).getTime() : 0
      return timeA - timeB
    })
    return messageData
  }

  addHistoryMessages(payload) {
    const historyList = Array.isArray(payload)
      ? payload
      : payload?.list || payload?.messages || payload?.records || []

    if (!Array.isArray(historyList) || historyList.length === 0) {
      return []
    }

    const normalizedMessages = historyList
      .map((item, index) => this.appendMessage(item, item?.type || 'chat', index))
      .filter(Boolean)

    this.messages.sort((a, b) => {
      const timeA = a.rawTime ? new Date(a.rawTime).getTime() : 0
      const timeB = b.rawTime ? new Date(b.rawTime).getTime() : 0
      return timeA - timeB
    })

    return normalizedMessages
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
        this.appendMessage(data.payload, data.type)
        this.emit('chat', data.payload)
        break
      case 'chatHistory':
        console.log('收到聊天历史消息:', data)
        console.log('聊天历史消息参数:', data.payload)

        this.emit('chatHistory', this.addHistoryMessages(data.payload))
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
