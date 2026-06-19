import request from './index'

const DEFAULT_UPLOAD_URL = import.meta.env.VITE_CHAT_IMAGE_UPLOAD_API || '/api/upload'

const dataUrlToFile = (dataUrl, filename = 'chat-image.jpg') => {
  const [header = '', base64 = ''] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], filename, { type: mime })
}

export const toImageUploadFile = (imageSource, filename = 'chat-image.jpg') => {
  if (typeof File !== 'undefined' && imageSource instanceof File) {
    return imageSource
  }

  if (typeof Blob !== 'undefined' && imageSource instanceof Blob) {
    return new File([imageSource], filename, {
      type: imageSource.type || 'image/jpeg'
    })
  }

  if (typeof imageSource === 'string') {
    const dataUrl = imageSource.startsWith('data:')
      ? imageSource
      : `data:image/jpeg;base64,${imageSource}`

    return dataUrlToFile(dataUrl, filename)
  }

  throw new Error('图片数据格式不支持')
}

export const getUploadFileUrl = (response) => {
  const data = response?.data
  const candidates = [
    data?.url,
    data?.imageUrl,
    data?.fileUrl,
    data?.path,
    data?.src,
    data?.avatarUrl,
    response?.url,
    response?.imageUrl,
    response?.fileUrl,
    response?.path,
    response?.src,
    response?.avatarUrl,
    typeof data === 'string' ? data : '',
    typeof response === 'string' ? response : ''
  ]

  return candidates.find((item) => typeof item === 'string' && item.trim())?.trim() || ''
}

export const uploadImage = (imageSource, options = {}) => {
  const file = toImageUploadFile(imageSource, options.filename)
  return uploadFile(file, options)
}

export const uploadFile = (file, options = {}) => {
  const formData = new FormData()
  if (options.filename) {
    formData.append(options.fieldName || 'file', file, options.filename)
  } else {
    formData.append(options.fieldName || 'file', file)
  }

  return request.post(options.url || DEFAULT_UPLOAD_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
