const NESTED_OBJECT_KEYS = ['data', 'user', 'profile', 'account', 'info', 'payload', 'result']

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const collectCandidateObjects = (source) => {
  const candidates = []
  const queue = [source]
  const seen = new Set()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!isPlainObject(current) || seen.has(current)) {
      continue
    }

    seen.add(current)
    candidates.push(current)

    NESTED_OBJECT_KEYS.forEach((key) => {
      if (isPlainObject(current[key])) {
        queue.push(current[key])
      }
    })
  }

  return candidates
}

const readFirstValue = (source, keys) => {
  for (const candidate of collectCandidateObjects(source)) {
    for (const key of keys) {
      const value = candidate[key]
      if (value === null || value === undefined) {
        continue
      }

      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed) {
          return trimmed
        }
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      } else if (typeof value === 'boolean') {
        return value
      }
    }
  }

  return null
}

const readArrayValue = (source, keys) => {
  for (const candidate of collectCandidateObjects(source)) {
    for (const key of keys) {
      const value = candidate[key]
      if (Array.isArray(value)) {
        return value
      }
    }
  }

  return null
}

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export const resolveUserProfile = (source, fallback = {}) => {
  const userId = toNumberOrNull(readFirstValue(source, ['id', 'userId', 'uid', 'user_id', 'userID']))
    ?? toNumberOrNull(fallback.id)
    ?? null
  const username = readFirstValue(source, ['username', 'userName', 'name', 'nickname', 'realName'])
    || fallback.username
    || ''
  const avatar = readFirstValue(source, ['avatar', 'avatarUrl', 'headImg', 'headImage', 'photo'])
    || fallback.avatar
    || ''
  const genderValue = readFirstValue(source, ['gender'])
  const gender = genderValue === null || genderValue === undefined || genderValue === ''
    ? (fallback.gender ?? null)
    : (typeof genderValue === 'number' ? genderValue : Number.isFinite(Number(genderValue)) ? Number(genderValue) : genderValue)
  const roleIdValue = readFirstValue(source, ['roleId', 'role_id'])
  const roleId = toNumberOrNull(roleIdValue) ?? (fallback.roleId ?? null)
  const roleName = readFirstValue(source, ['roleName', 'role_name']) || fallback.roleName || ''
  const menus = readArrayValue(source, ['menus', 'menuList', 'permissions']) ?? fallback.menus ?? []

  return {
    userId,
    username,
    avatar,
    gender,
    roleId,
    roleName,
    menus
  }
}
