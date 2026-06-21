const viewLoaders = {
  Login: () => import('@/views/Login.vue'),
  PublicChat: () => import('@/views/PublicChat.vue'),
  About: () => import('@/views/About.vue'),
  ProfileEdit: () => import('@/views/ProfileEdit.vue'),
  NineBall: () => import('@/views/NineBall.vue'),
  JumpGame: () => import('@/views/JumpGame.vue'),
  UserSelect: () => import('@/views/UserSelect.vue')
}

const appBase = (import.meta.env.VITE_PROJECT_URL || '').replace(/\/$/, '')

const normalizeRoutePath = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  let path = value.trim()

  try {
    if (/^https?:\/\//i.test(path)) {
      path = new URL(path).pathname
    }
  } catch (error) {
    path = value.trim()
  }

  path = path.split('?')[0].split('#')[0]

  if (appBase && path.startsWith(appBase)) {
    path = path.slice(appBase.length) || '/'
  }

  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  return path.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
}

const normalizeComponentName = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value
    .trim()
    .replace(/^@\/views\//, '')
    .replace(/^\/?src\/views\//, '')
    .replace(/^\/?views\//, '')
    .replace(/\.vue$/i, '')

  return normalizedValue.split('/').filter(Boolean).pop() || normalizedValue
}

const cloneRoute = (route) => ({
  ...route,
  meta: {
    ...(route.meta || {})
  }
})

export const baseRoutes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: viewLoaders.Login,
    meta: {
      title: '登录',
      showHeader: false,
      showTabbar: false,
      public: true
    }
  },
  {
    path: '/user-select',
    name: 'UserSelect',
    component: viewLoaders.UserSelect,
    meta: {
      title: '选人页面',
      customBack: true,
      public: true
    }
  }
]

export const dynamicRouteRecords = [
  {
    path: '/public-chat',
    name: 'PublicChat',
    component: viewLoaders.PublicChat,
    meta: {
      title: '公共聊天',
      showBack: false,
      showTabbar: true,
      tabbarIcon: 'chat-o',
      tabbarOrder: 10,
      showHeaderAction: 'online-users',
      requiresAuth: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: viewLoaders.About,
    meta: {
      title: '我的',
      showBack: false,
      showTabbar: true,
      tabbarIcon: 'user-o',
      tabbarOrder: 30,
      keepAlive: true,
      requiresAuth: true
    }
  },
  {
    path: '/profile/edit',
    name: 'ProfileEdit',
    component: viewLoaders.ProfileEdit,
    meta: {
      title: '编辑资料',
      headerBgColor: '#1989fa',
      requiresAuth: true
    }
  },
  {
    path: '/nine-ball',
    name: 'NineBall',
    component: viewLoaders.NineBall,
    meta: {
      title: '九球计分',
      showBack: false,
      showTabbar: true,
      tabbarIcon: 'records-o',
      tabbarOrder: 20,
      requiresAuth: true
    }
  },
  {
    path: '/jump-game',
    name: 'JumpGame',
    component: viewLoaders.JumpGame,
    meta: {
      title: '跳一跳',
      requiresAuth: true
    }
  }
]

const routeByName = new Map(dynamicRouteRecords.map((route) => [route.name, route]))
const routeByPath = new Map(dynamicRouteRecords.map((route) => [normalizeRoutePath(route.path), route]))

const pickString = (source, fields) => {
  if (!source || typeof source !== 'object') {
    return ''
  }

  for (const field of fields) {
    const value = source[field]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const getMenuChildren = (menu) => {
  if (!menu || typeof menu !== 'object') {
    return []
  }

  return menu.children
    || menu.childList
    || menu.routes
    || menu.menus
    || menu.menuList
    || []
}

const getRouteFromMenu = (menu) => {
  const routeName = pickString(menu, ['routeName', 'routerName', 'componentName'])
  const componentName = normalizeComponentName(pickString(menu, ['component', 'componentPath', 'view', 'viewPath', 'filePath']))
  const routePath = normalizeRoutePath(pickString(menu, ['path', 'routePath', 'url', 'menuUrl', 'href']))

  const baseRoute = routeByName.get(routeName)
    || routeByName.get(componentName)
    || routeByPath.get(routePath)

  if (!baseRoute) {
    return null
  }

  const route = cloneRoute(baseRoute)
  const title = pickString(menu, ['title', 'menuName', 'label', 'name'])

  if (title) {
    route.meta.title = title
  }

  return route
}

export const getDefaultDynamicRoutes = () => dynamicRouteRecords.map(cloneRoute)

export const getDynamicRouteByPath = (path) => {
  const route = routeByPath.get(normalizeRoutePath(path))
  return route ? cloneRoute(route) : null
}

export const buildDynamicRoutesFromMenus = (menus = []) => {
  const menuList = Array.isArray(menus) ? menus : []
  const routes = []
  const seenNames = new Set()

  const collectRoute = (menu) => {
    const route = getRouteFromMenu(menu)

    if (route?.name && !seenNames.has(route.name)) {
      seenNames.add(route.name)
      routes.push(route)
    }

    const children = getMenuChildren(menu)
    if (Array.isArray(children)) {
      children.forEach(collectRoute)
    }
  }

  menuList.forEach(collectRoute)

  return routes.length > 0 ? routes : getDefaultDynamicRoutes()
}

export { normalizeRoutePath }

export default baseRoutes
