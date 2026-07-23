import { getUserInfo } from '@/api/auth'
import { setToken } from '@/utils/token'
import { resolveUserProfile } from '@/utils/userProfile'

const getDXCHATNative = () => {
  if (typeof window === 'undefined') {
    console.warn('[H5][Auth] window unavailable')
    return null
  }

  const dxchat = window.DXCHAT_NATIVE || null
  console.info('[H5][Auth] DXCHAT_NATIVE lookup:', {
    available: Boolean(dxchat),
    hasIsNative: Boolean(dxchat && typeof dxchat.isNative === 'function'),
    hasGetSecurity: Boolean(dxchat && typeof dxchat.getSecurity === 'function')
  })
  return dxchat
}

const waitForDXCHATNative = async (timeout = 5000) => {
  if (typeof window === 'undefined') {
    return null
  }

  const initialBridge = getDXCHATNative()
  if (typeof initialBridge?.getSecurity === 'function') {
    return initialBridge
  }

  if (!window.AndroidWebSocket && !initialBridge) {
    return null
  }

  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const dxchat = window.DXCHAT_NATIVE || null
    if (typeof dxchat?.getSecurity === 'function') {
      console.info('[H5][Auth] DXCHAT_NATIVE became available while waiting')
      return dxchat
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  console.warn('[H5][Auth] DXCHAT_NATIVE wait timed out')
  return typeof window.DXCHAT_NATIVE?.getSecurity === 'function'
    ? window.DXCHAT_NATIVE
    : null
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
    console.warn('[H5][Auth] syncUserStore skipped: missing userStore')
    return
  }

  const profile = resolveUserProfile(authData, userStore)

  userStore.$patch({
    token,
    id: profile.userId,
    username: profile.username,
    avatar: profile.avatar,
    gender: profile.gender,
    roleId: profile.roleId,
    roleName: profile.roleName,
    menus: profile.menus
  })

  console.info('[H5][Auth] user store synchronized:', {
    userId: profile.userId,
    username: profile.username,
    hasToken: Boolean(token),
    hasAvatar: Boolean(profile.avatar),
    roleId: profile.roleId ?? null,
    menuCount: Array.isArray(profile.menus) ? profile.menus.length : 0
  })
}

export const initAuth = async (options = {}) => {
  const { userStore } = options
  const dxchat = await waitForDXCHATNative()
  const isNative = typeof dxchat?.isNative === 'function'
    ? dxchat.isNative()
    : Boolean(dxchat?.isNative)

  console.info('[H5][Auth] native capability:', {
    isNative,
    hasBridge: Boolean(dxchat),
    hasGetSecurity: Boolean(dxchat && typeof dxchat.getSecurity === 'function')
  })

  if (!isNative || typeof dxchat?.getSecurity !== 'function') {
    console.warn('[H5][Auth] native auth skipped:', {
      reason: !dxchat
        ? 'DXCHAT_NATIVE missing'
        : !isNative
          ? 'isNative returned false'
          : 'getSecurity missing'
    })
    return null
  }

  return new Promise((resolve, reject) => {
    console.info('[H5][Auth] calling DXCHAT_NATIVE.getSecurity')
    dxchat.getSecurity(
      async (payload) => {
        try {
          const authData = parsePayload(payload)
          const token = extractToken(authData)
          console.info('[H5][Auth] getSecurity success:', {
            payloadType: typeof payload,
            payloadKeys: authData && typeof authData === 'object' ? Object.keys(authData) : [],
            hasToken: Boolean(token),
            hasExpire: Boolean(extractExpire(authData))
          })

          if (!token) {
            throw new Error('Native auth payload did not include a token')
          }

          const expire = extractExpire(authData)
          setToken(token, expire)
          syncUserStore(userStore, authData, token)
          console.info('[H5][Auth] native identity synchronized:', {
            userId: userStore?.id || null,
            username: userStore?.username || '',
            hasToken: Boolean(userStore?.token)
          })

          let userInfo = null
          try {
            console.info('[H5][Auth] token stored, calling getUserInfo')
            userInfo = await getUserInfo()
            console.info('[H5][Auth] getUserInfo success:', {
              responseKeys: userInfo && typeof userInfo === 'object' ? Object.keys(userInfo) : [],
              dataKeys: userInfo?.data && typeof userInfo.data === 'object'
                ? Object.keys(userInfo.data)
                : []
            })
            syncUserStore(userStore, userInfo, token)
          } catch (error) {
            console.error('[H5][Auth] getUserInfo failed after native auth:', error)
            if (!userStore?.id) {
              throw error
            }
            console.warn('[H5][Auth] continuing with native identity because userId is available')
          }

          resolve({
            token,
            expire,
            userInfo
          })
        } catch (error) {
          console.error('[H5][Auth] getSecurity success callback failed:', error)
          reject(error)
        }
      },
      (error) => {
        console.error('[H5][Auth] getSecurity error callback:', {
          payloadType: typeof error,
          payloadKeys: error && typeof error === 'object' ? Object.keys(error) : []
        })
        reject(parsePayload(error) || new Error('Native auth failed'))
      }
    )
  })
}

export default initAuth
