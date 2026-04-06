import request, { post } from './index'

export const updateAvatar = (base64Data) => {
  return new Promise((resolve, reject) => {
    try {
      let dataUrl = base64Data
      if (!base64Data.startsWith('data:')) {
        dataUrl = `data:image/jpeg;base64,${base64Data}`
      }
      
      const arr = dataUrl.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      
      const file = new File([u8arr], 'avatar.jpg', { type: mime })
      const formData = new FormData()
      formData.append('file', file)
      
      request.post('/api/users/updateAvatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(resolve)
        .catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

export const setUser = (data) => {
  return post('/api/users/setUser', data)
}
