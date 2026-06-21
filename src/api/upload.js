import request from './index'

const DEFAULT_UPLOAD_URL = (
  import.meta.env.VITE_UPLOAD_API
  || import.meta.env.VITE_CHAT_UPLOAD_API
  || import.meta.env.VITE_CHAT_IMAGE_UPLOAD_API
  || '/api/upload'
)
const IMAGE_UPLOAD_URL_FIELDS = ['url', 'imageUrl', 'fileUrl', 'path', 'src', 'avatarUrl']
const VOICE_UPLOAD_URL_FIELDS = ['voiceUrl', 'audioUrl', 'recordUrl', 'mediaUrl', 'soundUrl']

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

const pickUploadUrl = (source, fields = []) => (
  fields
    .map((field) => source?.[field])
    .find((item) => typeof item === 'string' && item.trim())
    ?.trim() || ''
)

const getUploadResponseData = (response) => {
  if (response?.data !== undefined) {
    return response.data
  }

  return response
}

export const getUploadFileUrl = (response) => {
  const data = getUploadResponseData(response)
  const candidates = [
    pickUploadUrl(data, [...IMAGE_UPLOAD_URL_FIELDS, ...VOICE_UPLOAD_URL_FIELDS]),
    pickUploadUrl(response, [...IMAGE_UPLOAD_URL_FIELDS, ...VOICE_UPLOAD_URL_FIELDS]),
    typeof data === 'string' ? data : '',
    typeof response === 'string' ? response : ''
  ]

  return candidates.find((item) => typeof item === 'string' && item.trim())?.trim() || ''
}

export const getUploadVoiceUrl = (response) => {
  const data = getUploadResponseData(response)
  const candidates = [
    pickUploadUrl(data, [...VOICE_UPLOAD_URL_FIELDS, ...IMAGE_UPLOAD_URL_FIELDS]),
    pickUploadUrl(response, [...VOICE_UPLOAD_URL_FIELDS, ...IMAGE_UPLOAD_URL_FIELDS]),
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

  if (options.text !== undefined && options.text !== null) {
    formData.append('text', String(options.text))
  }

  return request.post(options.url || DEFAULT_UPLOAD_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
