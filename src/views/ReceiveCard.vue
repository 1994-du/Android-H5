<template>
  <DxxHeader :show-back="true" @click-back="handleBack">收卡</DxxHeader>
  <div class="receive-card dxx_wrap">
    <div class="content">
      <h2 class="page-title">收到的卡片</h2>
      
      <!-- 卡片列表 -->
      <div class="card-list" v-if="cardList.length > 0">
        <div 
          v-for="card in cardList" 
          :key="card.id"
          class="card-item"
          @click="viewCardDetail(card)"
        >
          <div class="card-header">
            <div class="sender-info">
              <div class="sender-avatar">
                <VanImage 
                  round 
                  :src="getAvatarUrl(card.senderAvatar)"
                  class="avatar"
                />
              </div>
              <div class="sender-details">
                <div class="sender-name">{{ card.senderName }}</div>
                <div class="send-time">{{ formatTime(card.sendTime) }}</div>
              </div>
            </div>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-desc">{{ card.content }}</p>
          </div>
          <div class="card-footer">
            <van-button 
              size="small" 
              type="primary" 
              plain
              :url="card.buttonUrl"
              v-if="card.buttonText"
            >
              {{ card.buttonText }}
            </van-button>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <Icon name="gift-o" size="64" color="#ccc" />
        <p class="empty-text">暂无收到的卡片</p>
      </div>
      
      <!-- 加载状态 -->
      <Loading v-if="loading" type="spinner" class="loading" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, Icon, Image as VanImage, Button, Loading } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import { useUserStore } from '@/stores/user'
import { getCardList } from '@/api/card'

const router = useRouter()
const userStore = useUserStore()

const cardList = ref([])
const loading = ref(false)

const getAvatarUrl = (avatar) => {
  if (!avatar) return 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
  if (avatar.startsWith('http')) return avatar
  const baseUrl = import.meta.env.VITE_PROXY || ''
  return baseUrl.replace(/\/$/, '') + avatar
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString()
}

const loadCardList = async () => {
  if (!userStore.id) {
    showToast({ message: '请先登录', type: 'warning' })
    router.push('/login')
    return
  }
  
  loading.value = true
  try {
    const response = await getCardList({
      userId: userStore.id
    })
    
    console.log('获取卡片列表成功:', response)
    cardList.value = response.data || []
  } catch (error) {
    console.error('获取卡片列表失败:', error)
    showToast({ message: '获取卡片列表失败', type: 'error' })
  } finally {
    loading.value = false
  }
}

const viewCardDetail = (card) => {
  // 这里可以跳转到卡片详情页面，或者显示卡片详情弹窗
  console.log('查看卡片详情:', card)
  showToast({ message: `查看卡片: ${card.title}`, type: 'info' })
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadCardList()
})
</script>

<style scoped lang="less">
.receive-card {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
  padding-bottom: 15px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-item {
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  margin-bottom: 12px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
}

.sender-details {
  flex: 1;
}

.sender-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.send-time {
  font-size: 12px;
  color: #999;
}

.card-content {
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.card-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
}
</style>
