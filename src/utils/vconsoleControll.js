import VConsole from 'vconsole'

const VCONSOLE_INSTANCE_KEY = '__APP_VCONSOLE__'
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off'])

const normalizeValue = (value) => String(value || '').trim().toLowerCase()

export const getVConsoleWhiteList = (whiteList = import.meta.env.VITE_VCONSOLE_WHITELIST || '') => {
  if (Array.isArray(whiteList)) {
    return whiteList.map(normalizeValue).filter(Boolean)
  }

  return String(whiteList)
    .split(',')
    .map(normalizeValue)
    .filter(Boolean)
}

export const shouldShowVConsole = (identity = '', whiteList) => {
  if (typeof window === 'undefined') {
    return false
  }

  const switchValue = normalizeValue(new URLSearchParams(window.location.search).get('vconsole'))
  if (TRUE_VALUES.has(switchValue)) {
    return true
  }
  if (FALSE_VALUES.has(switchValue)) {
    return false
  }

  const normalizedWhiteList = getVConsoleWhiteList(whiteList)
  if (!normalizedWhiteList.length) {
    return false
  }

  if (normalizedWhiteList.includes('*')) {
    return true
  }

  const candidates = [
    identity,
    window.location.hostname,
    window.location.host,
    window.location.origin
  ]
    .map(normalizeValue)
    .filter(Boolean)

  return candidates.some((candidate) => normalizedWhiteList.includes(candidate))
}

export const initVConsole = (identity = '', whiteList) => {
  if (!shouldShowVConsole(identity, whiteList)) {
    return null
  }

  if (!window[VCONSOLE_INSTANCE_KEY]) {
    window[VCONSOLE_INSTANCE_KEY] = new VConsole()
  }

  return window[VCONSOLE_INSTANCE_KEY]
}

export default shouldShowVConsole
