import { createRouter, createWebHistory } from 'vue-router'
import {
  baseRoutes,
  buildDynamicRoutesFromMenus,
  getDynamicRouteByPath
} from './routes'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/token'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PROJECT_URL),
  routes: baseRoutes
})

const dynamicRouteNames = new Set()
let dynamicRoutesReady = false
let dynamicRoutesKey = ''

const getMenusKey = (menus) => {
  try {
    return JSON.stringify(Array.isArray(menus) ? menus : [])
  } catch (error) {
    return String(Date.now())
  }
}

const addDynamicRoute = (route) => {
  if (!route?.name || router.hasRoute(route.name)) {
    return false
  }

  router.addRoute(route)
  dynamicRouteNames.add(route.name)
  return true
}

const removeDynamicRoutes = () => {
  dynamicRouteNames.forEach((routeName) => {
    if (router.hasRoute(routeName)) {
      router.removeRoute(routeName)
    }
  })
  dynamicRouteNames.clear()
  dynamicRoutesReady = false
  dynamicRoutesKey = ''
}

const ensureDynamicRoutes = (menus) => {
  const nextKey = getMenusKey(menus)

  if (dynamicRoutesReady && dynamicRoutesKey === nextKey) {
    return false
  }

  removeDynamicRoutes()
  buildDynamicRoutesFromMenus(menus).forEach(addDynamicRoute)
  dynamicRoutesReady = true
  dynamicRoutesKey = nextKey
  return true
}

const ensureTargetRoute = (path) => {
  const route = getDynamicRouteByPath(path)
  return addDynamicRoute(route)
}

const replaceCurrentRoute = (to) => ({
  path: to.path,
  query: to.query,
  hash: to.hash,
  replace: true
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }

  const hasToken = getToken()

  if (!hasToken) {
    removeDynamicRoutes()

    if (to.meta.public) {
      return true
    }

    return {
      path: '/login',
      replace: true
    }
  }

  const userStore = useUserStore()
  ensureDynamicRoutes(userStore.menus)

  if (to.path === '/login') {
    return {
      path: '/public-chat',
      replace: true
    }
  }

  if (!to.matched.length) {
    const targetAdded = ensureTargetRoute(to.path)

    if (targetAdded || router.resolve(to.fullPath).matched.length) {
      return replaceCurrentRoute(to)
    }

    return {
      path: '/public-chat',
      replace: true
    }
  }

  return true
})

export default router
