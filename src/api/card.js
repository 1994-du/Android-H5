import { post } from './index'

export const sendCard = (data) => {
  return post('/api/card/send', data)
}

export const getCardList = (data) => {
  return post('/api/card/list', data)
}
