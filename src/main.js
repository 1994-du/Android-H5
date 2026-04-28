import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import App from './App.vue'
import VConsole from 'vconsole'

import Vant from 'vant'
import 'vant/lib/index.css'
import './style.less'


new VConsole()
window.addEventListener('statusBarReady', () => {
  console.log('拿到了:', window.STATUS_BAR_HEIGHT)

  document.documentElement.style.setProperty(
    '--status-bar-height',
    window.STATUS_BAR_HEIGHT + 'px'
  )
})
const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()

// 添加持久化插件
pinia.use(piniaPluginPersistedstate)

app.use(Vant)
app.use(pinia)
app.use(router)
app.mount('#app')
