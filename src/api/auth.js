import { get } from './index'

export const getUserInfo = () => {
  return get('/api/users/me')
}
