<template>
  <DxxHeader :show-back="true" bgColor="#1989fa">编辑资料</DxxHeader>
  <div class="profile-edit dxx_wrap">
    <div class="content">
      <!-- 头像编辑 -->
      <div class="avatar-section">
        <div class="avatar-preview">
          <van-image 
            round 
            :src="formData.avatar" 
            :fit="'cover'"
            class="avatar"
          />
          <div class="avatar-upload">
            <van-button type="primary" size="small" plain>
              更换头像
            </van-button>
          </div>
        </div>
      </div>
      
      <!-- 表单 -->
      <van-form @submit="onSubmit">
        <van-field
          v-model="formData.username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="formData.email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入正确的邮箱格式' }]"
        />
        <van-field
          v-model="formData.phone"
          label="手机号"
          placeholder="请输入手机号"
        />
        <van-field
          v-model="formData.bio"
          label="个人简介"
          type="textarea"
          placeholder="请输入个人简介"
          rows="3"
        />
        
        <!-- 提交按钮 -->
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const preUrl = import.meta.env.VITE_PROXY.replace(/\/$/, '')

// 表单数据
const formData = ref({
  avatar: '',
  username: '',
  email: '',
  phone: '',
  bio: ''
})

// 加载用户信息
const loadUserInfo = () => {
  formData.value.avatar = `${preUrl}${userStore.avatar}`
  formData.value.username = userStore.username
}

// 提交表单
const onSubmit = () => {
  // 模拟提交
  showToast({
    type: 'success',
    message: '保存成功'
  })
  
  // 提取头像的相对路径（移除 preUrl 前缀）
  let avatarPath = formData.value.avatar
  if (avatarPath && avatarPath.startsWith(preUrl)) {
    avatarPath = avatarPath.replace(preUrl, '')
  }
  
  // 更新 store 中的用户信息
  userStore.setUserInfo({
    data: {
      avatar: avatarPath,
      username: formData.value.username,
      token: userStore.token
    }
  })
  
  // 跳转回我的页面
  setTimeout(() => {
    router.push('/about')
  }, 1000)
}

// 取消
const onCancel = () => {
  router.push('/about')
}

// 页面加载时加载用户信息
onMounted(() => {
  loadUserInfo()
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

/* 头像编辑 */
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

/* 表单 */
.van-form {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.van-field {
  margin-bottom: 16px;
}

/* 表单操作按钮 */
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
