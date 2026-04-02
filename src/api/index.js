import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    const { data } = response
    
    // 如果返回的状态码不是 200，说明接口出错
    if (data.code !== 200) {
      // 可以在这里统一处理错误
      console.error('接口错误:', data.message)
      return Promise.reject(new Error(data.message))
    }
    
    return data
  },
  (error) => {
    // 对响应错误做点什么
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          // 未授权，跳转到登录页面
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error('网络错误')
      }
    } else {
      console.error('网络连接失败')
    }
    
    return Promise.reject(error)
  }
)

// 封装 GET 请求
export const get = (url, params = {}) => {
  return request.get(url, { params })
}

// 封装 POST 请求
export const post = (url, data = {}) => {
  return request.post(url, data)
}

// 封装 PUT 请求
export const put = (url, data = {}) => {
  return request.put(url, data)
}

// 封装 DELETE 请求
export const del = (url, params = {}) => {
  return request.delete(url, { params })
}

// 导出 axios 实例
export default request
