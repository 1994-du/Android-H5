import { getUserInfo, login as loginApi } from '@/api/auth'
import { setToken } from '@/utils/token'

const getDXCHAT = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.DXCHAT || null
}

const parsePayload = (payload) => {
  if (typeof payload !== 'string') {
    return payload
  }

  try {
    return JSON.parse(payload)
  } catch (error) {
    return payload
  }
}

export const extractToken = (res) => {
  if (typeof res === 'string') {
    return res
  }

  return res?.data?.token
    || res?.token
    || res?.data?.accessToken
    || res?.accessToken
    || res?.security
    || res?.authorization
    || res?.data?.security
    || res?.data?.authorization
    || ''
}

export const extractExpire = (res) => {
  return res?.data?.expire
    || res?.data?.expiresAt
    || res?.expire
    || res?.expiresAt
    || res?.expires
    || res?.expireTime
    || res?.data?.expires
    || res?.data?.expireTime
    || null
}

const syncUserStore = (userStore, authData, token) => {
  if (!userStore) {
    return
  }

  const data = authData?.data || authData || {}

  userStore.$patch({
    token,
    id: data.id || data.userId || userStore.id || null,
    username: data.username || data.userName || userStore.username || '',
    avatar: data.avatar || userStore.avatar || '',
    gender: data.gender ?? userStore.gender ?? null,
    roleId: data.roleId ? Number(data.roleId) : (userStore.roleId || null),
    roleName: data.roleName || userStore.roleName || '',
    menus: Array.isArray(data.menus) ? data.menus : (userStore.menus || [])
  })
}

export const initAuth = async (options = {}) => {
  const { userStore } = options
  const dxchat = getDXCHAT()
  const isNative = typeof dxchat?.isNative === 'function'
    ? dxchat.isNative()
    : Boolean(dxchat?.isNative)

  if (!isNative || typeof dxchat?.getSecurity !== 'function') {
    return null
  }

  return new Promise((resolve, reject) => {
    dxchat.getSecurity(
      async (payload) => {
        try {
          const authData = parsePayload(payload)
          const token = extractToken(authData)

          if (!token) {
            throw new Error('原生未返回可用令牌')
          }

          const expire = extractExpire(authData)
          setToken(token, expire)
          const userInfo = await getUserInfo()
          syncUserStore(userStore, userInfo, token)
          resolve({
            token,
            expire,
            userInfo
          })
        } catch (error) {
          reject(error)
        }
      },
      (error) => {
        reject(parsePayload(error) || new Error('原生鉴权失败'))
      }
    )
  })
}

export const loginByPassword = async (data, options = {}) => {
  const { userStore } = options
  const res = await loginApi(data)

  const token = extractToken(res)

  if (!token) {
    throw new Error('登录成功但未获取到 token')
  }

  const expire = extractExpire(res)

  if (userStore?.setUserInfo) {
    userStore.setUserInfo(res)
  } else {
    setToken(token, expire)
  }

  return res
}

export default loginByPassword
