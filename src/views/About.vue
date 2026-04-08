<template>
  <DxxHeader :show-back="false">我的</DxxHeader>
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
          title="九球计分" 
          icon="todo-list-o"
          is-link
          to="/nine-ball"
        />
        <van-cell 
          title="发卡" 
          icon="credit-card"
          is-link
          to="/card-type"
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
    <DxxTabbar />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import DxxTabbar from '@/components/DxxTabbar.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const getAvatarUrl = (avatar) => {
  if (!avatar) return 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
  if (avatar.startsWith('http')) return avatar
  const baseUrl = import.meta.env.VITE_PROXY || ''
  return baseUrl.replace(/\/$/, '') + avatar
}

const avatarUrl = computed(() => getAvatarUrl(userStore.avatar))

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
    
    userStore.clearUserInfo()
    localStorage.removeItem('username')
    
    showToast({
      type: 'success',
      message: '退出成功'
    })
    
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="less">
.about {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
  padding-bottom: 60px;
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
