<template>
  <div class="about dxx_wrap">
    <div class="content">
      <div class="user-card">
        <div class="user-avatar">
          <van-image 
            round 
            :src="avatarUrl"
            class="avatar"
          />
        </div>
        <div class="user-info">
          <h3 class="user-name">{{ userStore.username || '未登录' }}</h3>
          <p class="user-id">ID: {{ userStore.id || '-' }}</p>
        </div>
      </div>
      
      <van-cell-group class="menu-group">
        <van-cell 
          title="编辑资料" 
          icon="edit"
          is-link
          to="/profile/edit"
        />
        <van-cell
          title="跳一跳"
          icon="fire-o"
          is-link
          to="/jump-game"
        />
      </van-cell-group>
      <van-button 
        type="danger" 
        class="logout-btn"
        @click="handleLogout"
        block
      >
        退出登录
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getUserInfo } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import wsService from '@/utils/websocket'

const router = useRouter()
const userStore = useUserStore()
const isProfileLoading = ref(false)

const avatarUrl = computed(() => wsService.getAvatarUrl(userStore.avatar))

const loadUserProfile = async () => {
  if (isProfileLoading.value) {
    return
  }

  if (!userStore.token) {
    console.info('[H5][About] skip /me request: missing token')
    return
  }

  isProfileLoading.value = true
  try {
    console.info('[H5][About] requesting /me')
    const profile = await getUserInfo()
    userStore.setUserInfo(profile)
    console.info('[H5][About] /me synchronized:', {
      userId: userStore.id || null,
      username: userStore.username || '',
      hasAvatar: Boolean(userStore.avatar)
    })
  } catch (error) {
    console.error('[H5][About] /me request failed:', error)
  } finally {
    isProfileLoading.value = false
  }
}

const logoutNative = async () => {
  const nativeBridge = window.DXCHAT_NATIVE

  if (typeof nativeBridge?.logout !== 'function') {
    console.info('[H5][Auth] native logout skipped: DXCHAT_NATIVE.logout missing')
    return
  }

  try {
    console.info('[H5][Auth] calling DXCHAT_NATIVE.logout')
    await Promise.resolve(nativeBridge.logout())
    console.info('[H5][Auth] DXCHAT_NATIVE.logout completed')
  } catch (error) {
    console.error('[H5][Auth] DXCHAT_NATIVE.logout failed:', error)
  }
}

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出当前账号吗？',
      confirmButtonColor: '#ee0a24',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      round: true,
      className: 'logout-dialog'
    })
    
    await logoutNative()
    userStore.clearUserInfo()
    localStorage.removeItem('username')
    
    showToast({
      type: 'success',
      message: '退出成功'
    })
    
    router.push('/public-chat')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  void loadUserProfile()
})

onActivated(() => {
  void loadUserProfile()
})
</script>

<style scoped lang="less">
.about {
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 15px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-avatar {
  margin-right: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.user-id {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.modify-btn {
  color: white;
  border-color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
}

.menu-group {
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.logout-btn {
  border-radius: 12px;
  height: 48px;
  font-size: 16px;
}
</style>
