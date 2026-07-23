import VConsole from 'vconsole'

let vConsole = null

export const initVConsole = () => {
  if (vConsole) return vConsole
  vConsole = new VConsole()
  return vConsole
}

export const vconsoleCheck = () => {
  if (vConsole) return vConsole
  vConsole = new VConsole()
  return vConsole
}

export default initVConsole
