import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PROJECT_URL),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  const userInfo = localStorage.getItem('user-info')
  const hasToken = userInfo ? JSON.parse(userInfo)?.token : null
  
  // 让选人页面不需要登录就能访问
  if (to.path === '/user-select') {
    next()
    return
  }
  
  if (to.path === '/login') {
    if (hasToken) {
      next('/public-chat')
    } else {
      next()
    }
  } else {
    if (hasToken) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
