import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import VConsole from 'vconsole'

import 'vant/lib/index.css'
import './style.less'
import Vant from 'vant'
import 'vant/lib/index.css'

new VConsole()
window.addEventListener('statusBarReady', () => {
  console.log('拿到了:', window.STATUS_BAR_HEIGHT)

  document.documentElement.style.setProperty(
    '--status-bar-height',
    window.STATUS_BAR_HEIGHT + 'px'
  )
})
const app = createApp(App)

app.use(Vant)
app.use(createPinia())
app.use(router)

app.mount('#app')
