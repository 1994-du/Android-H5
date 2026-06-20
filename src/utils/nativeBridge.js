const getBridgeWindow = () => (typeof window === 'undefined' ? null : window)

const listenerMap = {
  photoResult: new Set(),
  photoError: new Set(),
  voiceResult: new Set(),
  voiceError: new Set(),
  keyboard: new Set(),
  nativeWebSocketMessage: new Set(),
  nativeWebSocketStatus: new Set()
}

const globalCallbacks = new Map()

export const NATIVE_BRIDGE_API = {
  h5ToNative: {
    AndroidPhoto: [
      {
        method: 'window.AndroidPhoto.openCamera(callbackId)',
        params: 'callbackId: string',
        description: 'H5 调起原生拍照，原生完成后回调 window.handlePhotoResult 或 window.handlePhotoError'
      },
      {
        method: 'window.AndroidPhoto.openGallery(callbackId)',
        params: 'callbackId: string',
        description: 'H5 调起原生相册，原生完成后回调 window.handlePhotoResult 或 window.handlePhotoError'
      }
    ],
    AndroidVoice: [
      {
        method: 'window.AndroidVoice.startRecord(callbackId)',
        params: 'callbackId: string',
        description: 'H5 调起原生语音录制，结束后回调 window.handleVoiceResult 或 window.handleVoiceError'
      },
      {
        method: 'window.AndroidVoice.stopRecord()',
        params: '无',
        description: 'H5 通知原生结束语音录制'
      },
      {
        method: 'window.AndroidVoice.cancelRecord()',
        params: '无',
        description: 'H5 通知原生取消语音录制'
      },
      {
        method: 'window.AndroidVoice.isRecording()',
        params: '无',
        description: 'H5 查询原生是否正在录音，可返回 boolean 或 "true"/"false"'
      }
    ],
    AndroidWebSocket: [
      {
        method: 'window.AndroidWebSocket.connect(wsUrl, userInfoJson)',
        params: 'wsUrl: string, userInfoJson: string',
        description: 'H5 通知原生建立 WebSocket 连接，userInfoJson 为 JSON 字符串'
      },
      {
        method: 'window.AndroidWebSocket.send(messageJson)',
        params: 'messageJson: string',
        description: 'H5 通过原生 WebSocket 发送消息，messageJson 为 JSON 字符串'
      },
      {
        method: 'window.AndroidWebSocket.close()',
        params: '无',
        description: 'H5 通知原生主动关闭 WebSocket'
      },
      {
        method: 'window.AndroidWebSocket.reconnect()',
        params: '无',
        description: 'H5 通知原生主动重连 WebSocket，可选实现'
      },
      {
        method: 'window.AndroidWebSocket.isConnected()',
        params: '无',
        description: 'H5 查询原生 WebSocket 是否已连接，可返回 boolean 或 "true"/"false"'
      }
    ]
  },
  nativeToH5: [
    {
      callback: 'window.handlePhotoResult(data)',
      payload: '{ callbackId, image | imageBase64 | imageUrl, originalUrl, type }',
      description: '原生拍照/相册成功后回传图片数据；拍照建议优先回传原图 file/content URI 或未压缩原图 base64，不要回传缩略图'
    },
    {
      callback: 'window.handlePhotoError(data)',
      payload: '{ callbackId, error }',
      description: '原生拍照/相册失败或取消后回传错误信息'
    },
    {
      callback: 'window.handleVoiceResult(data)',
      payload: '{ callbackId, audio | audioBase64 | audioUrl, type, mimeType, fileName, durationMs }',
      description: '原生语音录制成功后回传音频数据，H5 再上传到服务器后发送 WebSocket'
    },
    {
      callback: 'window.handleVoiceError(data)',
      payload: '{ callbackId, error }',
      description: '原生语音录制失败或取消后回传错误信息'
    },
    {
      callback: 'window.handleKeyboardStatus(visible, height)',
      payload: 'visible: boolean, height: number',
      description: '原生输入法弹出/收起状态通知，height 单位建议使用 px'
    },
    {
      callback: 'window.handleNativeWebSocketMessage(messageJson)',
      payload: 'messageJson: string | object',
      description: '原生 WebSocket 收到服务端消息后回传给 H5'
    },
    {
      callback: 'window.handleNativeWebSocketStatus(statusJson)',
      payload: '{ connected, ready, state, error }',
      description: '原生 WebSocket 连接状态变化通知 H5'
    }
  ]
}

const parseNativePayload = (payload) => {
  if (typeof payload !== 'string') {
    return payload
  }

  try {
    return JSON.parse(payload)
  } catch (error) {
    return payload
  }
}

const stringifyNativePayload = (payload) => {
  if (typeof payload === 'string') {
    return payload
  }

  return JSON.stringify(payload || {})
}

const normalizeNativeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }

  return false
}

const emitBridgeEvent = (eventName, ...args) => {
  listenerMap[eventName]?.forEach((listener) => {
    try {
      listener(...args)
    } catch (error) {
      console.error(`[nativeBridge] ${eventName} listener error:`, error)
    }
  })
}

const ensureGlobalCallback = (callbackName, handler) => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow) {
    return
  }

  const currentRecord = globalCallbacks.get(callbackName)
  if (currentRecord && bridgeWindow[callbackName] === currentRecord.callback) {
    return
  }

  const previousCallback = typeof bridgeWindow[callbackName] === 'function'
    && (!currentRecord || bridgeWindow[callbackName] !== currentRecord.callback)
    ? bridgeWindow[callbackName]
    : currentRecord?.previousCallback || null

  const callback = (...args) => {
    handler(...args)

    if (previousCallback && previousCallback !== callback) {
      try {
        previousCallback(...args)
      } catch (error) {
        console.error(`[nativeBridge] previous ${callbackName} callback error:`, error)
      }
    }
  }

  globalCallbacks.set(callbackName, {
    callback,
    previousCallback
  })
  bridgeWindow[callbackName] = callback
}

const addBridgeListener = (eventName, listener) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  listenerMap[eventName].add(listener)

  return () => {
    listenerMap[eventName].delete(listener)
  }
}

const ensurePhotoCallbacks = () => {
  ensureGlobalCallback('handlePhotoResult', (data) => {
    emitBridgeEvent('photoResult', parseNativePayload(data))
  })
  ensureGlobalCallback('handlePhotoError', (data) => {
    emitBridgeEvent('photoError', parseNativePayload(data))
  })
}

const ensureVoiceCallbacks = () => {
  ensureGlobalCallback('handleVoiceResult', (data) => {
    emitBridgeEvent('voiceResult', parseNativePayload(data))
  })
  ensureGlobalCallback('handleVoiceError', (data) => {
    emitBridgeEvent('voiceError', parseNativePayload(data))
  })
}

const ensureKeyboardCallback = () => {
  ensureGlobalCallback('handleKeyboardStatus', (visible, height) => {
    emitBridgeEvent('keyboard', normalizeNativeBoolean(visible), Number(height) || 0)
  })
}

const ensureNativeWebSocketCallbacks = () => {
  ensureGlobalCallback('handleNativeWebSocketMessage', (data) => {
    emitBridgeEvent('nativeWebSocketMessage', parseNativePayload(data))
  })
  ensureGlobalCallback('handleNativeWebSocketStatus', (data) => {
    emitBridgeEvent('nativeWebSocketStatus', parseNativePayload(data))
  })
}

export const isAndroidPhotoAvailable = () => {
  const bridgeWindow = getBridgeWindow()
  return Boolean(
    bridgeWindow?.AndroidPhoto
    && typeof bridgeWindow.AndroidPhoto.openCamera === 'function'
    && typeof bridgeWindow.AndroidPhoto.openGallery === 'function'
  )
}

export const openCamera = (callbackId) => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidPhoto || typeof bridgeWindow.AndroidPhoto.openCamera !== 'function') {
    return false
  }

  ensurePhotoCallbacks()
  bridgeWindow.AndroidPhoto.openCamera(callbackId)
  return true
}

export const openGallery = (callbackId) => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidPhoto || typeof bridgeWindow.AndroidPhoto.openGallery !== 'function') {
    return false
  }

  ensurePhotoCallbacks()
  bridgeWindow.AndroidPhoto.openGallery(callbackId)
  return true
}

export const isAndroidVoiceAvailable = () => {
  const bridgeWindow = getBridgeWindow()
  return Boolean(
    bridgeWindow?.AndroidVoice
    && typeof bridgeWindow.AndroidVoice.startRecord === 'function'
    && typeof bridgeWindow.AndroidVoice.stopRecord === 'function'
    && typeof bridgeWindow.AndroidVoice.cancelRecord === 'function'
  )
}

export const startNativeVoiceRecord = (callbackId) => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidVoice || typeof bridgeWindow.AndroidVoice.startRecord !== 'function') {
    return false
  }

  ensureVoiceCallbacks()
  bridgeWindow.AndroidVoice.startRecord(callbackId)
  return true
}

export const stopNativeVoiceRecord = () => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidVoice || typeof bridgeWindow.AndroidVoice.stopRecord !== 'function') {
    return false
  }

  ensureVoiceCallbacks()
  bridgeWindow.AndroidVoice.stopRecord()
  return true
}

export const cancelNativeVoiceRecord = () => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidVoice || typeof bridgeWindow.AndroidVoice.cancelRecord !== 'function') {
    return false
  }

  ensureVoiceCallbacks()
  bridgeWindow.AndroidVoice.cancelRecord()
  return true
}

export const isNativeVoiceRecording = () => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidVoice || typeof bridgeWindow.AndroidVoice.isRecording !== 'function') {
    return false
  }

  return normalizeNativeBoolean(bridgeWindow.AndroidVoice.isRecording())
}

export const isNativeWebSocketAvailable = () => {
  const bridgeWindow = getBridgeWindow()
  return Boolean(
    bridgeWindow?.AndroidWebSocket
    && typeof bridgeWindow.AndroidWebSocket.connect === 'function'
    && typeof bridgeWindow.AndroidWebSocket.send === 'function'
  )
}

export const connectNativeWebSocket = (wsUrl, userInfo) => {
  const bridgeWindow = getBridgeWindow()
  if (!isNativeWebSocketAvailable()) {
    return false
  }

  ensureNativeWebSocketCallbacks()
  bridgeWindow.AndroidWebSocket.connect(wsUrl, stringifyNativePayload(userInfo))
  return true
}

export const sendNativeWebSocket = (message) => {
  const bridgeWindow = getBridgeWindow()
  if (!isNativeWebSocketAvailable()) {
    return false
  }

  bridgeWindow.AndroidWebSocket.send(stringifyNativePayload(message))
  return true
}

export const closeNativeWebSocket = () => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidWebSocket || typeof bridgeWindow.AndroidWebSocket.close !== 'function') {
    return false
  }

  bridgeWindow.AndroidWebSocket.close()
  return true
}

export const reconnectNativeWebSocket = () => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidWebSocket || typeof bridgeWindow.AndroidWebSocket.reconnect !== 'function') {
    return false
  }

  ensureNativeWebSocketCallbacks()
  bridgeWindow.AndroidWebSocket.reconnect()
  return true
}

export const isNativeWebSocketConnected = () => {
  const bridgeWindow = getBridgeWindow()
  if (!bridgeWindow?.AndroidWebSocket || typeof bridgeWindow.AndroidWebSocket.isConnected !== 'function') {
    return false
  }

  return normalizeNativeBoolean(bridgeWindow.AndroidWebSocket.isConnected())
}

export const registerPhotoHandlers = ({ onResult, onError } = {}) => {
  ensurePhotoCallbacks()

  const cleanups = [
    addBridgeListener('photoResult', onResult),
    addBridgeListener('photoError', onError)
  ]

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}

export const registerVoiceHandlers = ({ onResult, onError } = {}) => {
  ensureVoiceCallbacks()

  const cleanups = [
    addBridgeListener('voiceResult', onResult),
    addBridgeListener('voiceError', onError)
  ]

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}

export const registerKeyboardHandler = (handler) => {
  ensureKeyboardCallback()
  return addBridgeListener('keyboard', handler)
}

export const registerNativeWebSocketHandlers = ({ onMessage, onStatus } = {}) => {
  ensureNativeWebSocketCallbacks()

  const cleanups = [
    addBridgeListener('nativeWebSocketMessage', onMessage),
    addBridgeListener('nativeWebSocketStatus', onStatus)
  ]

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}

const nativeBridge = {
  NATIVE_BRIDGE_API,
  isAndroidPhotoAvailable,
  openCamera,
  openGallery,
  isAndroidVoiceAvailable,
  startNativeVoiceRecord,
  stopNativeVoiceRecord,
  cancelNativeVoiceRecord,
  isNativeVoiceRecording,
  isNativeWebSocketAvailable,
  connectNativeWebSocket,
  sendNativeWebSocket,
  closeNativeWebSocket,
  reconnectNativeWebSocket,
  isNativeWebSocketConnected,
  registerPhotoHandlers,
  registerVoiceHandlers,
  registerKeyboardHandler,
  registerNativeWebSocketHandlers
}

export default nativeBridge
