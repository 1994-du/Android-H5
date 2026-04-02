<template>
  <DxxHeader :show-back="false" bgColor="#1989fa" :bgImage="bgImg">我的</DxxHeader>
  <div class="about dxx_wrap">
    <div class="content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-avatar">
          <van-image 
            round 
            :src="userInfo.avatar"
            :fit="'cover'"
            class="avatar"
          />
        </div>
        <div class="user-info">
          <h3 class="user-name">{{ userInfo.name }}</h3>
          <p class="user-email">{{ userInfo.email }}</p>
        </div>
        <van-button 
          type="default" 
          size="small" 
          class="modify-btn"
          to="/profile/edit"
        >
          修改资料
        </van-button>
      </div>
      
      <!-- 功能菜单 -->
      <van-cell-group class="menu-group">
        <van-cell 
          v-for="item in menuItems" 
          :key="item.id"
          :title="item.title"
          :icon="item.icon"
          is-link
          @click="handleMenuClick(item)"
        />
      </van-cell-group>
      
      <!-- 统计信息 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ stats.posts }}</div>
          <div class="stat-label">发布</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.followers }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.likes }}</div>
          <div class="stat-label">点赞</div>
        </div>
      </div>
      
      <!-- 其他功能 -->
      <van-cell-group class="other-group">
        <van-cell 
          title="设置" 
          icon="setting-o"
          is-link
        />
        <van-cell 
          title="帮助与反馈" 
          icon="question-o"
          is-link
        />
        <van-cell 
          title="关于我们" 
          icon="info-o"
          is-link
        />
      </van-cell-group>
      
      <!-- 退出登录按钮 -->
      <van-button 
        type="default" 
        class="logout-btn"
        @click="handleLogout"
      >
        退出登录
      </van-button>
    </div>
    <DxxTabbar />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import DxxTabbar from '@/components/DxxTabbar.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const preUrl = import.meta.env.VITE_PROXY.replace(/\/$/, '')
// 从Pinia store获取用户信息
const userInfo = computed(() => {
  console.log('userStore', userStore.avatar);
  
  return {
    name: userStore.username,
    email: 'user@example.com',
    avatar: `${preUrl}${userStore.avatar}`
  }
})

// 统计信息
const stats = ref({
  posts: 12,
  followers: 34,
  likes: 56
})

// 菜单选项
const menuItems = ref([
  { id: 1, title: '我的收藏', icon: 'star-o' },
  { id: 2, title: '我的历史', icon: 'clock-o' },
  { id: 3, title: '我的订单', icon: 'order-o' },
  { id: 4, title: '我的钱包', icon: 'wallet-o' }
])

// 背景图片
const bgImg = ref(`${import.meta.env.VITE_PROJECT_URL}img/qp_01.png`)

// 处理菜单点击
const handleMenuClick = (item) => {
  showToast({
    message: `点击了${item.title}`,
    duration: 1000
  })
}

// 处理退出登录
const handleLogout = () => {
  // 使用Pinia清除用户信息
  userStore.clearUserInfo()
  
  // 清除记住的用户名
  localStorage.removeItem('username')
  
  // 显示退出成功提示
  showToast({
    type: 'success',
    message: '退出登录成功'
  })
  
  // 跳转到登录页面
  setTimeout(() => {
    router.push('/login')
  }, 1000)
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

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1989fa 0%, #36cfc9 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  margin-right: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.user-email {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.edit-btn {
  color: white;
  border-color: white;
  margin-right: 8px;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.modify-btn {
  color: white;
  border-color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.modify-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 菜单组 */
.menu-group {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 统计卡片 */
.stats-card {
  display: flex;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 其他功能组 */
.other-group {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 退出按钮 */
.logout-btn {
  width: 100%;
  border-radius: 12px;
  margin-top: 10px;
}

/* 单元格样式 */
.van-cell {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.van-cell:last-child {
  border-bottom: none;
}

.van-cell__left-icon {
  font-size: 20px;
  color: #1989fa;
}
</style>
