import VConsole from 'vconsole'
import Cookies from 'js-cookie'

let vConsole = null

export const initVConsole = () => {
  if (import.meta.env.MODE === 'development' || (Cookies.get('isVconsoleOn') && import.meta.env.MODE === 'production')) {
    if (vConsole) return vConsole
    vConsole = new VConsole()
    return vConsole
  }

  if (vConsole) {
    vConsole.destroy()
    vConsole = null
  }

  return null
}

export const vconsoleCheck = () => {
  if (import.meta.env.MODE === 'development' || (Cookies.get('isVconsoleOn') && import.meta.env.MODE === 'production')) {
    if (vConsole) return
    vConsole = new VConsole()
  } else {
    if (vConsole) {
      vConsole.destroy()
      vConsole = null
    }
  }
}

export default initVConsole
