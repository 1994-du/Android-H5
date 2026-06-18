import { reactive } from 'vue'
import {
  closeNativeWebSocket,
  connectNativeWebSocket,
  isNativeWebSocketAvailable,
  isNativeWebSocketConnected,
  registerNativeWebSocketHandlers,
  sendNativeWebSocket
} from '@/utils/nativeBridge'

const DEFAULT_AVATAR_URL = `${import.meta.env.BASE_URL}avatar-default.svg`
const getDefaultWsUrl = () => import.meta.env.VITE_WS_URL || import.meta.env.VITE_PROXY_WS || 'ws://localhost:1234/ws'
const CONNECTED_NATIVE_STATES = ['open', 'opened', 'connected', 'ready']
const CONNECTING_NATIVE_STATES = ['connecting', 'reconnecting']
const CLOSED_NATIVE_STATES = ['close', 'closed', 'closing', 'disconnect', 'disconnected']
const ERROR_NATIVE_STATES = ['error', 'failed', 'failure']
const IMAGE_MESSAGE_TYPES = ['image', 'img', 'picture', 'photo', 'pic', '图片']
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?(#.*)?$/i
const IMAGE_DATA_PATTERN = /^(data:image\/|blob:)/i
const IMAGE_RESOURCE_PATH_PATTERN = /^(https?:\/\/[^/]+)?\/?(uploads?|files?|images?|img|static)\//i
const DIRECT_IMAGE_FIELDS = [
  'image',
  'imageUrl',
  'imagePath',
  'picture',
  'pic',
  'photo',
  'mediaUrl',
  'thumbnail',
  'thumb',
  'originalUrl'
]
const GENERIC_IMAGE_FIELDS = ['fileUrl', 'filePath', 'uri', 'url', 'path', 'src']
const CONTENT_IMAGE_FIELDS = ['message', 'content', 'text', 'msg', 'body', 'messageText', 'chatContent']
const NESTED_IMAGE_FIELDS = ['file', 'media', 'attachment', 'attach', 'data', 'extra', 'payload']

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1'
  return false
}

const parseSocketPayload = (payload) => {
  if (typeof payload !== 'string') {
    return payload
  }

  try {
    return JSON.parse(payload)
  } catch (error) {
    return payload
  }
}

const parseJsonObject = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()
  if (!normalizedValue || !['{', '['].includes(normalizedValue[0])) {
    return null
  }

  try {
    const parsedValue = JSON.parse(normalizedValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null
  } catch (error) {
    return null
  }
}

class WebSocketService {
  constructor() {
    this.ws = null
    this.socketMode = 'browser'
    this.isConnected = false
    this.isReady = false
    this.isNativeConnecting = false
    this.reconnectTimer = null
    this.listeners = new Map()
    this.userInfo = null
    this.lastUrl = ''
    this.messages = reactive([])
    this.shouldReconnect = false
    this.messageSeq = 0
    this.avatarUrlCache = new Map()
    this.preloadedAvatars = new Set()
    this.cleanupNativeHandlers = registerNativeWebSocketHandlers({
      onMessage: (data) => this.handleNativeMessage(data),
      onStatus: (data) => this.handleNativeStatus(data)
    })
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

  isSameMessage(item, messageData) {
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
  }

  hasMessage(messageData) {
    return this.messages.some((item) => this.isSameMessage(item, messageData))
  }

  sortMessages() {
    this.messages.sort((a, b) => {
      const timeA = a.rawTime ? new Date(a.rawTime).getTime() : 0
      const timeB = b.rawTime ? new Date(b.rawTime).getTime() : 0
      return timeA - timeB
    })
  }

  preloadAvatar(avatarUrl) {
    if (!avatarUrl || this.preloadedAvatars.has(avatarUrl) || typeof Image === 'undefined') {
      return
    }

    this.preloadedAvatars.add(avatarUrl)
    const image = new Image()
    image.decoding = 'async'
    image.src = avatarUrl
  }

  appendMessage(payload, fallbackType = 'chat', index = 0, options = {}) {
    const messageData = this.normalizeChatMessage(payload, fallbackType, index)

    if (!messageData || this.hasMessage(messageData)) {
      return null
    }

    this.messages.push(messageData)
    this.preloadAvatar(messageData.avatar)

    if (!options.skipSort) {
      this.sortMessages()
    }

    return messageData
  }

  addHistoryMessages(payload) {
    const historyList = Array.isArray(payload)
      ? payload
      : payload?.list || payload?.messages || payload?.records || []

    if (!Array.isArray(historyList) || historyList.length === 0) {
      return []
    }

    const normalizedMessages = []

    historyList.forEach((item, index) => {
      const messageData = this.normalizeChatMessage(item, item?.type || 'chat', index)

      if (!messageData || this.hasMessage(messageData)) {
        return
      }

      if (messageData.type === 'image') {
        console.log('聊天历史图片归一化:', {
          imageField: messageData.imageField,
          sourceImage: messageData.sourceImage,
          displayImage: messageData.image,
          raw: item
        })
      }

      const existsInBatch = normalizedMessages.some((message) => this.isSameMessage(message, messageData))
      if (!existsInBatch) {
        normalizedMessages.push(messageData)
      }
    })

    if (normalizedMessages.length === 0) {
      return []
    }

    normalizedMessages.forEach((message) => this.preloadAvatar(message.avatar))
    this.messages.push(...normalizedMessages)
    this.sortMessages()

    return normalizedMessages
  }

  getAvatarUrl(avatar) {
    const normalizedAvatar = typeof avatar === 'string' ? avatar.trim() : ''

    if (!normalizedAvatar) {
      return DEFAULT_AVATAR_URL
    }

    if (this.avatarUrlCache.has(normalizedAvatar)) {
      return this.avatarUrlCache.get(normalizedAvatar)
    }

    if (
      normalizedAvatar.startsWith('http')
      || normalizedAvatar.startsWith('data:')
      || normalizedAvatar.startsWith('blob:')
    ) {
      this.avatarUrlCache.set(normalizedAvatar, normalizedAvatar)
      return normalizedAvatar
    }

    const baseUrl = (import.meta.env.VITE_PROXY || '').trim()
    let fullUrl = normalizedAvatar

    if (baseUrl) {
      try {
        fullUrl = new URL(
          normalizedAvatar.replace(/^\/+/, ''),
          baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
        ).toString()
      } catch (error) {
        fullUrl = `${baseUrl.replace(/\/$/, '')}/${normalizedAvatar.replace(/^\/+/, '')}`
      }
    }

    this.avatarUrlCache.set(normalizedAvatar, fullUrl)
    return fullUrl
  }

  isImageMessageType(type) {
    return IMAGE_MESSAGE_TYPES.includes(String(type || '').trim().toLowerCase())
  }

  isImagePath(value) {
    const normalizedValue = typeof value === 'string' ? value.trim() : ''

    if (!normalizedValue) {
      return false
    }

    return IMAGE_DATA_PATTERN.test(normalizedValue)
      || IMAGE_FILE_PATTERN.test(normalizedValue)
      || IMAGE_RESOURCE_PATH_PATTERN.test(normalizedValue)
  }

  getStringField(source, fields) {
    if (!source || typeof source !== 'object') {
      return null
    }

    for (const field of fields) {
      const value = source[field]

      if (typeof value === 'string' && value.trim()) {
        return {
          field,
          value: value.trim()
        }
      }
    }

    return null
  }

  extractImageSource(source, sourceType, seen = new WeakSet()) {
    if (!source || typeof source !== 'object') {
      return null
    }

    if (seen.has(source)) {
      return null
    }
    seen.add(source)

    const directImage = this.getStringField(source, DIRECT_IMAGE_FIELDS)
    if (directImage) {
      return directImage
    }

    const isImageType = this.isImageMessageType(sourceType)
    const genericImage = this.getStringField(source, GENERIC_IMAGE_FIELDS)
    if (genericImage && (isImageType || this.isImagePath(genericImage.value))) {
      return genericImage
    }

    for (const field of NESTED_IMAGE_FIELDS) {
      const value = source[field]
      const parsedValue = parseJsonObject(value)
      const nestedSource = parsedValue || (value && typeof value === 'object' ? value : null)

      if (!nestedSource) {
        continue
      }

      const nestedImage = this.extractImageSource(nestedSource, sourceType, seen)
      if (nestedImage) {
        return {
          field: `${field}.${nestedImage.field}`,
          value: nestedImage.value
        }
      }
    }

    const contentImage = this.getStringField(source, CONTENT_IMAGE_FIELDS)
    if (!contentImage) {
      return null
    }

    const parsedContent = parseJsonObject(contentImage.value)
    if (parsedContent) {
      const nestedImage = this.extractImageSource(parsedContent, sourceType, seen)
      if (nestedImage) {
        return {
          field: `${contentImage.field}.${nestedImage.field}`,
          value: nestedImage.value
        }
      }
    }

    if (isImageType || this.isImagePath(contentImage.value)) {
      return contentImage
    }

    return null
  }

  normalizeChatMessage(payload, fallbackType = 'chat', index = 0) {
    const source = payload?.payload && typeof payload.payload === 'object'
      ? { ...payload.payload, clientMessageId: payload.clientMessageId || payload.payload.clientMessageId }
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
        image: '',
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
    const sourceType = source.type || source.messageType || source.contentType || payload?.messageType || payload?.type
    const imageSource = this.extractImageSource(source, sourceType)
    const image = imageSource?.value || ''
    const type = sourceType === 'card'
      ? 'card'
      : this.isImageMessageType(sourceType) || image
        ? 'image'
        : fallbackType === 'card'
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
    const rawMessageText = typeof rawMessage === 'string'
      ? rawMessage
      : String(rawMessage || '')
    const message = type === 'image' && rawMessageText.trim() === image
      ? ''
      : rawMessageText

    if (!message && !image) {
      return null
    }

    const avatar = source.avatar || source.fromAvatar || source.headImg || source.userAvatar || ''
    const rawUserId = source.userId ?? source.fromUserId ?? source.senderId ?? source.id ?? null
    const userId = rawUserId !== null && rawUserId !== undefined && rawUserId !== ''
      ? Number(rawUserId)
      : null
    const sourceMessageId = source.id || source.messageId || source.msgId || source.uuid || source.clientMessageId || null

    return {
      id: sourceMessageId || `${normalizedRawTime}-${userId || 'unknown'}-${type}-${index}-${this.messageSeq++}`,
      type,
      messageType: sourceType || type,
      fromUsername: source.fromUsername
        || source.username
        || source.nickname
        || source.fromName
        || source.senderName
        || '未知用户',
      userId,
      message,
      image: image ? this.getAvatarUrl(image) : '',
      sourceImage: image,
      imageField: imageSource?.field || '',
      avatar: this.getAvatarUrl(avatar),
      time: this.formatTime(rawTime),
      rawTime: normalizedRawTime,
      sourceMessageId
    }
  }

  isBrowserSocketOpen() {
    return typeof WebSocket !== 'undefined'
      && this.ws
      && this.ws.readyState === WebSocket.OPEN
  }

  isBrowserSocketConnecting() {
    return typeof WebSocket !== 'undefined'
      && this.ws
      && this.ws.readyState === WebSocket.CONNECTING
  }

  isSocketReady() {
    if (this.socketMode === 'native') {
      return (this.isConnected && this.isReady) || isNativeWebSocketConnected()
    }

    return this.isBrowserSocketOpen() && this.isConnected && this.isReady
  }

  connect(url, userInfo, options = {}) {
    if (isNativeWebSocketAvailable()) {
      this.connectNative(url, userInfo, options)
      return
    }

    this.connectBrowser(url, userInfo)
  }

  connectNative(url, userInfo, { force = false } = {}) {
    if (this.socketMode === 'native' && this.isSocketReady()) {
      console.log('原生 WebSocket 已连接，跳过重复连接')
      return
    }

    if (this.socketMode === 'native' && this.isNativeConnecting && !force) {
      console.log('原生 WebSocket 正在连接，跳过重复连接')
      return
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socketMode === 'native' && force) {
      console.log('原生 WebSocket 强制重建连接')
      closeNativeWebSocket()
    }

    this.socketMode = 'native'
    this.shouldReconnect = true
    this.userInfo = userInfo
    this.lastUrl = url
    this.isNativeConnecting = true
    this.isConnected = false
    this.isReady = false
    console.log('开始连接原生 WebSocket:', url, '用户信息:', userInfo)

    if (isNativeWebSocketConnected()) {
      this.isNativeConnecting = false
      this.isConnected = true
      this.isReady = true
      this.emit('open')
      this.emit('ready')
      return
    }

    const started = connectNativeWebSocket(url, userInfo)
    if (!started) {
      this.socketMode = 'browser'
      this.isNativeConnecting = false
      this.connectBrowser(url, userInfo)
      return
    }

    setTimeout(() => {
      if (this.socketMode === 'native' && !this.isReady && isNativeWebSocketConnected()) {
        this.handleNativeStatus({ connected: true, ready: true, state: 'open' })
      }
    }, 0)
  }

  connectBrowser(url, userInfo) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isConnected) {
      console.log('WebSocket 已连接，跳过重复连接')
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket 正在连接，跳过重复连接')
      return
    }

    if (this.ws && (
      this.ws.readyState === WebSocket.CLOSING
      || this.ws.readyState === WebSocket.CLOSED
    )) {
      this.ws = null
      this.isConnected = false
      this.isReady = false
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.shouldReconnect = true
    this.userInfo = userInfo
    this.lastUrl = url
    this.socketMode = 'browser'
    this.isNativeConnecting = false
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

  handleNativeMessage(payload) {
    const data = parseSocketPayload(payload)

    if (!data || typeof data !== 'object') {
      console.warn('原生 WebSocket 消息格式异常:', payload)
      return
    }

    this.handleMessage(data)
  }

  handleNativeStatus(payload) {
    const status = parseSocketPayload(payload)
    const statusData = status && typeof status === 'object'
      ? status
      : { state: String(status || '') }
    const state = String(statusData.state || statusData.status || '').toLowerCase()
    const connected = normalizeBoolean(statusData.connected) || CONNECTED_NATIVE_STATES.includes(state)
    const ready = normalizeBoolean(statusData.ready) || connected
    const connecting = CONNECTING_NATIVE_STATES.includes(state)
    const failed = Boolean(statusData.error)
      || ERROR_NATIVE_STATES.includes(state)
      || CLOSED_NATIVE_STATES.includes(state)
      || (statusData.connected === false && statusData.ready === false && !connecting)

    if (connected || ready) {
      const wasReady = this.isReady
      this.socketMode = 'native'
      this.isNativeConnecting = false
      this.isConnected = true
      this.isReady = true
      this.emit('open')

      if (!wasReady) {
        this.emit('ready')
        if (this.userInfo) {
          this.sendOnline()
        }
      }
      return
    }

    if (connecting) {
      this.socketMode = 'native'
      this.isNativeConnecting = true
      this.isConnected = false
      this.isReady = false
      return
    }

    if (failed) {
      const error = statusData.error || new Error('原生 WebSocket 连接关闭')
      console.error('原生 WebSocket 状态异常:', statusData)
      this.isNativeConnecting = false
      this.isConnected = false
      this.isReady = false
      this.emit(ERROR_NATIVE_STATES.includes(state) || statusData.error ? 'error' : 'close', error)

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
    if (this.socketMode === 'native') {
      if (this.isSocketReady() || isNativeWebSocketConnected()) {
        sendNativeWebSocket(data)
        console.log('发送原生 WebSocket 消息:', data)
        return
      }

      console.error('原生 WebSocket 未连接，无法发送消息')
      throw new Error('WebSocket 未连接')
    }

    if (this.isBrowserSocketOpen() && this.isConnected) {
      this.ws.send(JSON.stringify(data))
      console.log('发送消息:', data)
    } else {
      console.error('WebSocket 未连接，无法发送消息')
      throw new Error('WebSocket 未连接')
    }
  }

  ensureConnected(url, userInfo, timeout = 8000) {
    if (this.isSocketReady()) {
      return Promise.resolve()
    }

    const connectUrl = url || this.lastUrl || getDefaultWsUrl()
    const connectUserInfo = userInfo || this.userInfo

    if (!connectUserInfo) {
      return Promise.reject(new Error('缺少 WebSocket 用户信息'))
    }

    return new Promise((resolve, reject) => {
      let timer = null
      let settled = false

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        this.off('ready', handleReady)
        this.off('error', handleError)
      }

      const handleReady = () => {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        resolve()
      }

      const handleError = (error) => {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        reject(error || new Error('WebSocket 连接失败'))
      }

      timer = setTimeout(() => {
        if (this.socketMode === 'native') {
          closeNativeWebSocket()
          this.isNativeConnecting = false
          this.isConnected = false
          this.isReady = false
        }
        cleanup()
        reject(new Error('WebSocket 连接超时'))
      }, timeout)

      this.on('ready', handleReady)
      this.on('error', handleError)

      this.connect(connectUrl, connectUserInfo, { force: true })

      if (this.isSocketReady()) {
        handleReady()
      }
    })
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
      const url = this.lastUrl || getDefaultWsUrl()

      if (this.socketMode === 'native' && isNativeWebSocketAvailable()) {
        this.connect(url, this.userInfo, { force: true })
        return
      }

      this.connect(url, this.userInfo)
    }, 5000)
  }

  close() {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    const shouldSendOffline = this.isConnected && this.isReady
    if (shouldSendOffline) {
      // 关闭连接前发送下线通知
      this.sendOffline()
    }

    // 等待一小段时间确保下线通知发送成功；未 ready 时也要清掉连接。
    setTimeout(() => {
      if (this.socketMode === 'native') {
        closeNativeWebSocket()
      }

      if (this.ws) {
        this.ws.close()
        this.ws = null
      }

      this.isNativeConnecting = false
      this.isConnected = false
      this.isReady = false
    }, shouldSendOffline ? 100 : 0)
  }

  clearMessages() {
    this.messages.length = 0
  }

  // 发送上线通知
  sendOnline() {
    if (this.isConnected && this.isReady && this.userInfo) {
      const onlineMsg = {
        type: 'userOnline',
        payload: {
          userId: this.userInfo.userId,
          username: this.userInfo.username,
          avatar: this.userInfo.avatar
        }
      }
      try {
        this.send(onlineMsg)
        console.log('发送上线通知:', onlineMsg)
      } catch (error) {
        console.error('发送上线通知失败:', error)
      }
    }
  }

  // 发送下线通知
  sendOffline() {
    if (this.isConnected && this.isReady && this.userInfo) {
      const offlineMsg = {
        type: 'userOffline',
        payload: {
          userId: this.userInfo.userId,
          username: this.userInfo.username
        }
      }
      try {
        this.send(offlineMsg)
        console.log('发送下线通知:', offlineMsg)
      } catch (error) {
        console.error('发送下线通知失败:', error)
      }
    }
  }
}

const wsService = new WebSocketService()

export default wsService
