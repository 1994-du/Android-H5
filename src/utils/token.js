export const TOKEN_STORAGE_KEY = 'user-token'

const DEFAULT_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000

const parseTokenRecord = () => {
  const rawValue = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!rawValue) return null

  try {
    const record = JSON.parse(rawValue)
    if (!record || typeof record !== 'object') {
      removeToken()
      return null
    }

    return record
  } catch (error) {
    console.error('解析 token 失败:', error)
    removeToken()
    return null
  }
}

export const getToken = () => {
  const record = parseTokenRecord()
  if (!record) return ''

  const { token, expire } = record
  if (!token || !expire) {
    removeToken()
    return ''
  }

  if (Date.now() >= Number(expire)) {
    removeToken()
    return ''
  }

  return token
}

export const setToken = (token, expire) => {
  if (!token) return

  const tokenRecord = {
    token,
    expire: expire || Date.now() + DEFAULT_EXPIRE_MS
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenRecord))
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
