import Cookies from 'js-cookie'

const TOKEN_KEY = 'user-token'
const DEFAULT_EXPIRE_DAYS = 7

const normalizeTokenRecord = (tokenOrRecord, expire) => {
  if (!tokenOrRecord) {
    return null
  }

  if (typeof tokenOrRecord === 'object') {
    const token = tokenOrRecord.value || tokenOrRecord.token || ''
    const expires = tokenOrRecord.expires || tokenOrRecord.expire || expire
    return token ? { token, expires } : null
  }

  return {
    token: String(tokenOrRecord),
    expires: expire
  }
}

export const setToken = (tokenOrRecord, expire) => {
  const record = normalizeTokenRecord(tokenOrRecord, expire)
  if (!record?.token) {
    return
  }

  const cookieOptions = {}
  if (record.expires) {
    cookieOptions.expires = new Date(record.expires)
  } else {
    cookieOptions.expires = DEFAULT_EXPIRE_DAYS
  }

  Cookies.set(TOKEN_KEY, record.token, cookieOptions)
}

export const getToken = () => Cookies.get(TOKEN_KEY) || null

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY)
}

export { TOKEN_KEY }
