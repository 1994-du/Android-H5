import { post } from './index'

/**
 * 发送好友请求
 * @param {Object} data - 请求数据
 * @param {string} data.friendId - 好友ID
 * @returns {Promise} - 返回发送结果
 */
export const addFriend = (data) => {
  return post('/api/friend/add', data)
}

/**
 * 接受好友请求
 * @param {Object} data - 请求数据
 * @param {string} data.friendshipId - 好友关系ID
 * @returns {Promise} - 返回接受结果
 */
export const acceptFriend = (data) => {
  return post('/api/friend/accept', data)
}

/**
 * 拒绝好友请求
 * @param {Object} data - 请求数据
 * @param {string} data.friendshipId - 好友关系ID
 * @returns {Promise} - 返回拒绝结果
 */
export const rejectFriend = (data) => {
  return post('/api/friend/reject', data)
}

/**
 * 删除好友
 * @param {Object} data - 请求数据
 * @param {string} data.friendId - 好友ID
 * @returns {Promise} - 返回删除结果
 */
export const deleteFriend = (data) => {
  return post('/api/friend/delete', data)
}

/**
 * 获取好友列表
 * @returns {Promise} - 返回好友列表
 */
export const getFriendList = () => {
  return post('/api/friend/list')
}

/**
 * 获取待处理请求
 * @returns {Promise} - 返回待处理请求列表
 */
export const getPendingRequests = () => {
  return post('/api/friend/requests/pending')
}

/**
 * 获取已发送请求
 * @returns {Promise} - 返回已发送请求列表
 */
export const getSentRequests = () => {
  return post('/api/friend/requests/sent')
}

/**
 * 检查好友关系
 * @param {Object} data - 请求数据
 * @param {string} data.friendId - 好友ID
 * @returns {Promise} - 返回检查结果
 */
export const checkFriendship = (data) => {
  return post('/api/friend/check', data)
}

/**
 * 搜索用户
 * @param {Object} data - 请求数据
 * @param {string} data.keyword - 搜索关键词（用户名/手机号）
 * @returns {Promise} - 返回搜索结果
 */
export const searchUser = (data) => {
  return post('/api/friend/search', data)
}

/**
 * 获取推荐好友
 * @returns {Promise} - 返回推荐好友列表
 */
export const getRecommendFriends = () => {
  return post('/api/friend/recommend')
}

/**
 * 获取聊天历史消息
 * @param {Object} data - 请求数据
 * @param {string} data.friendId - 好友ID
 * @param {number} data.page - 页码
 * @param {number} data.pageSize - 每页数量
 * @returns {Promise} - 返回聊天历史
 */
export const getChatHistory = (data) => {
  return post('/api/chat/history', data)
}

/**
 * 获取聊天列表
 * @returns {Promise} - 返回聊天列表
 */
export const getChatList = () => {
  return post('/api/chat/list')
}
