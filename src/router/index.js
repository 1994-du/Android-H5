import { createRouter, createWebHistory } from 'vue-router'
import { appRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PROJECT_URL),
  routes: appRoutes
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }

  return true
})

export default router
