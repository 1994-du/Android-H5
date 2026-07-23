import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import App from './App.vue'
import { useUserStore } from '@/stores/user'
import { initAuth } from '@/utils/login'
import { initVConsole } from '@/utils/vconsoleControll'

import Vant from 'vant'
import 'vant/lib/index.css'
import './style.less'


initVConsole()
window.addEventListener('statusBarReady', () => {
  console.log('拿到了:', window.STATUS_BAR_HEIGHT)

  document.documentElement.style.setProperty(
    '--status-bar-height',
    window.STATUS_BAR_HEIGHT + 'px'
  )
})
const bootstrap = async () => {
  const app = createApp(App)

  // 创建 Pinia 实例
  const pinia = createPinia()

  // 添加持久化插件
  pinia.use(piniaPluginPersistedstate)

  const userStore = useUserStore(pinia)

  try {
    await initAuth({ userStore })
  } catch (error) {
    console.error('初始化原生鉴权失败:', error)
  }

  app.use(Vant)
  app.use(pinia)
  app.use(router)
  app.mount('#app')
}

bootstrap()
