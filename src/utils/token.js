import Cookies from 'js-cookie'

export const TOKEN_COOKIE_KEY = 'user-token'

export const getToken = () => Cookies.get(TOKEN_COOKIE_KEY) || ''

export const setToken = (token) => {
  if (!token) return
  Cookies.set(TOKEN_COOKIE_KEY, token)
}

export const removeToken = () => {
  Cookies.remove(TOKEN_COOKIE_KEY)
}
