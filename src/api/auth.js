import { post } from './index'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} - 返回登录结果
 */
export const login = (data) => {
  return post('/api/auth/login', data)
}

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} - 返回注册结果
 */
export const register = (data) => {
  return post('/api/auth/register', data)
}

/**
 * 用户登出
 * @returns {Promise} - 返回登出结果
 */
export const logout = () => {
  return post('/api/auth/logout')
}

/**
 * 获取用户信息
 * @returns {Promise} - 返回用户信息
 */
export const getUserInfo = () => {
  return post('/api/auth/userInfo')
}

/**
 * 刷新 token
 * @returns {Promise} - 返回新的 token
 */
export const refreshToken = () => {
  return post('/api/auth/refresh')
}
