import { login as loginApi } from '@/api/auth'
import { setToken } from '@/utils/token'

export const extractToken = (res) => {
  return res?.data?.token
    || res?.token
    || res?.data?.accessToken
    || res?.accessToken
    || ''
}

export const extractExpire = (res) => {
  return res?.data?.expire
    || res?.data?.expiresAt
    || res?.expire
    || res?.expiresAt
    || null
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
