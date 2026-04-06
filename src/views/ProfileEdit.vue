<template>
  <DxxHeader :show-back="true" bgColor="#1989fa">编辑资料</DxxHeader>
  <div class="profile-edit dxx_wrap">
    <div class="content">
      <div class="avatar-section">
        <div class="avatar-preview">
          <van-image 
            round 
            :src="formData.avatar" 
            :fit="'cover'"
            class="avatar"
          />
          <div class="avatar-upload">
            <van-button type="primary" size="small" plain @click="showAvatarActions = true">
              更换头像
            </van-button>
          </div>
        </div>
      </div>
      
      <van-action-sheet
        v-model:show="showAvatarActions"
        :actions="avatarActions"
        cancel-text="取消"
        close-on-click-action
        @select="onAvatarActionSelect"
      />
      
      <van-form @submit="onSubmit">
        <van-field
          v-model="formData.username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        
        <div class="form-actions">
          <van-button 
            type="default" 
            class="cancel-btn"
            @click="onCancel"
          >
            取消
          </van-button>
          <van-button 
            type="primary" 
            class="submit-btn"
            native-type="submit"
          >
            保存
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import { useUserStore } from '@/stores/user'
import { updateAvatar, setUser } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()
const preUrl = import.meta.env.VITE_PROXY.replace(/\/$/, '')

const formData = ref({
  avatar: '',
  username: ''
})

const showAvatarActions = ref(false)
const avatarActions = [
  { name: '拍照', value: 'camera' },
  { name: '从相册选择', value: 'gallery' }
]

const callbackId = `avatar_${Date.now()}`

const onAvatarActionSelect = (action) => {
  if (action.value === 'camera') {
    openCamera()
  } else if (action.value === 'gallery') {
    openGallery()
  }
}

const openCamera = () => {
  if (window.AndroidPhoto && window.AndroidPhoto.openCamera) {
    window.AndroidPhoto.openCamera(callbackId)
  } else {
    showToast('当前环境不支持相机')
  }
}

const openGallery = () => {
  if (window.AndroidPhoto && window.AndroidPhoto.openGallery) {
    window.AndroidPhoto.openGallery(callbackId)
  } else {
    showToast('当前环境不支持相册')
  }
}

const handlePhotoResult = async (data) => {
  console.log('handlePhotoResult 被调用:', data)
  
  try {
    const { callbackId: id, image: imageData, type } = data || {}
    
    if (id !== callbackId) {
      console.log('callbackId 不匹配', { id, callbackId })
      return
    }
    
    if (!imageData) {
      showToast('图片数据为空')
      return
    }
    
    console.log('图片类型:', type, '数据长度:', imageData.length)
    
    let dataUrl = imageData
    if (!imageData.startsWith('data:')) {
      dataUrl = `data:image/jpeg;base64,${imageData}`
    }
    
    formData.value.avatar = dataUrl
    
    showLoadingToast({
      message: '上传中...',
      forbidClick: true,
      duration: 0
    })
    
    const res = await updateAvatar(imageData)
    console.log('上传头像结果:', res)
    
    if (res.data && res.data.avatarUrl) {
      const avatarUrl = res.data.avatarUrl
      
      await setUser({
        gender: userStore.gender,
        roleId: userStore.roleId,
        roleName: userStore.roleName,
        id: userStore.id,
        avatar: avatarUrl,
        username: formData.value.username
      })
      
      userStore.setUserInfo({
        data: {
          id: userStore.id,
          avatar: avatarUrl,
          username: formData.value.username,
          token: userStore.token,
          gender: userStore.gender,
          roleId: userStore.roleId,
          roleName: userStore.roleName
        }
      })
      
      formData.value.avatar = preUrl + avatarUrl
      
      closeToast()
      showToast('头像已更新')
    } else {
      closeToast()
      showToast('上传失败，请重试')
    }
  } catch (error) {
    closeToast()
    console.error('上传头像失败:', error)
    showToast('上传头像失败: ' + (error.message || '未知错误'))
  }
}

const handlePhotoError = (data) => {
  console.error('图片错误:', data)
  const { callbackId: id, error } = data || {}
  if (id === callbackId) {
    showToast('获取图片失败: ' + error)
  }
}

const loadUserInfo = () => {
  formData.value.avatar = `${preUrl}${userStore.avatar}`
  formData.value.username = userStore.username
}

const onSubmit = async () => {
  showLoadingToast({
    message: '保存中...',
    forbidClick: true,
    duration: 0
  })
  
  try {
    let avatarPath = formData.value.avatar
    if (avatarPath && avatarPath.startsWith(preUrl)) {
      avatarPath = avatarPath.replace(preUrl, '')
    }
    
    await setUser({
      gender: userStore.gender,
      roleId: userStore.roleId,
      roleName: userStore.roleName,
      id: userStore.id,
      avatar: avatarPath,
      username: formData.value.username
    })
    
    userStore.setUserInfo({
      data: {
        id: userStore.id,
        avatar: avatarPath,
        username: formData.value.username,
        token: userStore.token,
        gender: userStore.gender,
        roleId: userStore.roleId,
        roleName: userStore.roleName
      }
    })
    
    closeToast()
    showToast({
      type: 'success',
      message: '保存成功'
    })
    
    setTimeout(() => {
      router.push('/about')
    }, 1000)
  } catch (error) {
    closeToast()
    console.error('保存失败:', error)
    showToast('保存失败')
  }
}

const onCancel = () => {
  router.push('/about')
}

onMounted(() => {
  loadUserInfo()
  
  window.handlePhotoResult = handlePhotoResult
  window.handlePhotoError = handlePhotoError
})

onUnmounted(() => {
  window.handlePhotoResult = null
  window.handlePhotoError = null
})
</script>

<style scoped lang="less">
.profile-edit {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  margin-bottom: 12px;
  border: 2px solid #1989fa;
}

.avatar-upload .van-button {
  border-radius: 16px;
  font-size: 12px;
}

.van-form {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.van-field {
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  border-radius: 12px;
  height: 44px;
}

.submit-btn {
  background: linear-gradient(135deg, #1989fa 0%, #36cfc9 100%);
  border: none;
}
</style>
