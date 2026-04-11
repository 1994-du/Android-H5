<template>
  <DxxHeader :show-back="true" @click-back="handleBack">发卡</DxxHeader>
  <div class="issue-card dxx_wrap">
    <div class="content" :class="{ 'blur-content': showEnvelope }">
      <h2 class="page-title">{{ cardName }} - 选择卡片</h2>
      
      <!-- 二级卡片轮播 -->
      <div class="card-carousel">
        <Swipe autoplay="false" indicator-color="#1989fa">
          <SwipeItem v-for="card in subCards" :key="card.id">
            <div class="sub-card">
              <div class="sub-card-icon">{{ card.icon }}</div>
              <h3 class="sub-card-name">{{ card.name }}</h3>
              <p class="sub-card-desc">{{ card.description }}</p>
            </div>
          </SwipeItem>
        </Swipe>
      </div>
      
      <!-- 选择接收人 -->
      <div class="recipient-section">
        <div class="recipient-menu" @click="openUserSelect">
          <div class="menu-left">
            <Icon name="user" class="menu-icon" />
            <span class="menu-text">选择接收人</span>
          </div>
          <Icon name="arrow" class="menu-arrow" />
        </div>
        <div v-if="recipient" class="selected-recipient">
          已选择：{{ recipient }}
        </div>
      </div>
      
      <!-- 留言区域 -->
      <div class="message-section">
        <h3 class="section-title">留言</h3>
        <Field
          v-model="message"
          type="textarea"
          :rows="4"
          placeholder="请输入留言内容"
        />
      </div>
      
      <!-- 发卡按钮 -->
      <Button type="primary" block class="issue-btn" :loading="loading" @click="handleIssueCard">
        发送卡片
      </Button>
    </div>
    
    <!-- 信封动画 -->
    <div class="envelope-overlay" v-if="showEnvelope">
      <div class="envelope-animation">
        <div class="envelope" ref="envelopeRef">
          <div class="envelope-front"></div>
          <div class="envelope-back"></div>
          <div class="envelope-flap"></div>
          <div class="envelope-content">
            <div class="success-content">
              <!-- 成功图标 -->
              <div class="success-icon">
                <div class="check-circle">
                  <div class="checkmark"></div>
                </div>
              </div>
              
              <!-- 成功消息 -->
              <h1 class="success-title">发送成功！</h1>
              <p class="success-message">你的卡片已成功发送给 {{ recipient }}</p>
              
              <!-- 卡片预览 -->
              <div class="card-preview">
                <img :src="cardImageUrl" :alt="cardName" class="card-image" />
                <div class="card-name">{{ cardName }}</div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="action-buttons">
                <button class="primary-btn" @click="resetForm">再发一张</button>
                <button class="secondary-btn" @click="goHome">返回首页</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, Swipe, SwipeItem, Icon, Field, Button } from 'vant'
import gsap from 'gsap'
import DxxHeader from '@/components/DxxHeader.vue'
import { sendCard } from '@/api/card'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 卡片类型信息
const cardType = ref(route.query.cardType || '1')
const cardName = ref(route.query.cardName || '卡片')

// 卡片图片URL
const cardImageUrl = computed(() => {
  return 'https://via.placeholder.com/200x150?text=' + encodeURIComponent(cardName.value)
})

// 二级卡片数据
const subCards = ref([])

// 接收人和留言
const recipient = ref(route.query.recipient || '')
const message = ref('')
const selectedCardUser = ref(null)
const loading = ref(false)
const showEnvelope = ref(false)
const envelopeRef = ref(null)

// 模拟获取二级卡片数据
const fetchSubCards = async () => {
  // 模拟接口请求延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 根据一级卡片类型返回不同的二级卡片
  const subCardData = {
    '1': [ // 点赞卡
      {
        id: '1-1',
        name: '优秀表现',
        description: '表彰突出的工作表现',
        icon: '🌟'
      },
      {
        id: '1-2',
        name: '创新思维',
        description: '鼓励创新的想法和解决方案',
        icon: '💡'
      },
      {
        id: '1-3',
        name: '团队合作',
        description: '赞赏良好的团队协作精神',
        icon: '🤝'
      }
    ],
    '2': [ // 认可卡
      {
        id: '2-1',
        name: '贡献突出',
        description: '认可对团队的重大贡献',
        icon: '🏆'
      },
      {
        id: '2-2',
        name: '专业能力',
        description: '肯定专业技能和知识水平',
        icon: '🎯'
      },
      {
        id: '2-3',
        name: '领导力',
        description: '认可领导能力和管理水平',
        icon: '👑'
      }
    ],
    '3': [ // 吐槽卡
      {
        id: '3-1',
        name: '流程优化',
        description: '提出流程改进的建议',
        icon: '🔄'
      },
      {
        id: '3-2',
        name: '问题反馈',
        description: '反馈工作中遇到的问题',
        icon: '⚠️'
      },
      {
        id: '3-3',
        name: '改进建议',
        description: '提供改进产品或服务的建议',
        icon: '📝'
      }
    ]
  }
  
  subCards.value = subCardData[cardType.value] || []
}

// 打开选择接收人页面
const openUserSelect = () => {
  // 跳转到选人页面
  router.push({
    path: '/user-select',
    query: {
      from: 'issue-card',
      cardType: cardType.value,
      cardName: cardName.value
    }
  })
}

// 处理发卡
const handleIssueCard = async () => {
  if (!recipient.value) {
    showToast({
      message: '请选择接收人',
      type: 'warning'
    })
    return
  }
  
  loading.value = true
  try {
    await sendCard({
      title: cardName.value,
      content: message.value || '新活动开始了，快来参加！',
      userId: selectedCardUser.value?.id,
      senderId: userStore.id,
      buttonText: '立即参加',
      buttonUrl: 'https://example.com/activity'
    })
    
    showToast({
      message: `卡片发送成功！接收人：${recipient.value}`,
      type: 'success'
    })
    
    // 清除 sessionStorage 中的用户信息
    sessionStorage.removeItem('selectedCardUser')
    
    // 显示信封动画
    showEnvelope.value = true
    setTimeout(() => {
      initEnvelopeAnimation()
    }, 100)
  } catch (error) {
    showToast({
      message: error.message || '卡片发送失败，请重试',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 初始化信封动画
const initEnvelopeAnimation = () => {
  const envelope = envelopeRef.value
  if (!envelope) return
  
  const envelopeFlap = envelope.querySelector('.envelope-flap')
  const envelopeContent = envelope.querySelector('.envelope-content')
  
  if (!envelopeFlap || !envelopeContent) return
  
  // 创建 GSAP 时间线
  const tl = gsap.timeline({
    defaults: {
      duration: 1,
      ease: 'power3.out'
    }
  })
  
  // 初始状态
  gsap.set(envelope, {
    scale: 0.8,
    opacity: 0,
    rotationY: 0
  })
  
  gsap.set(envelopeFlap, {
    rotationX: 0,
    transformOrigin: 'top center'
  })
  
  gsap.set(envelopeContent, {
    y: 50,
    scale: 0.8,
    opacity: 0
  })
  
  // 动画序列
  tl
    // 信封出现
    .to(envelope, {
      scale: 1,
      opacity: 1,
      duration: 0.8
    })
    // 信封轻微旋转
    .to(envelope, {
      rotationY: 5,
      duration: 0.5
    })
    // 信封盖子打开
    .to(envelopeFlap, {
      rotationX: 180,
      duration: 1
    }, '+=0.5')
    // 内容滑出
    .to(envelopeContent, {
      y: 0,
      scale: 1,
      opacity: 1,
      duration: 0.8
    }, '-=0.5')
    // 内容元素依次出现
    .from('.success-icon', {
      scale: 0,
      opacity: 0,
      duration: 0.5
    }, '+=0.3')
    .from('.success-title', {
      y: 20,
      opacity: 0,
      duration: 0.5
    }, '+=0.2')
    .from('.success-message', {
      y: 20,
      opacity: 0,
      duration: 0.5
    }, '+=0.2')
    .from('.card-preview', {
      y: 20,
      opacity: 0,
      duration: 0.5
    }, '+=0.2')
    .from('.action-buttons', {
      y: 20,
      opacity: 0,
      duration: 0.5
    }, '+=0.2')
    // 信封盖子关闭
    .to(envelopeFlap, {
      rotationX: 0,
      duration: 1
    }, '+=1')
    // 最终状态
    .to(envelope, {
      rotationY: 0,
      duration: 0.5
    })
}

// 重置表单，再发一张
const resetForm = () => {
  showEnvelope.value = false
  message.value = ''
  recipient.value = ''
  selectedCardUser.value = null
}

// 返回首页
const goHome = () => {
  showEnvelope.value = false
  router.push('/public-chat')
}

// 处理返回
const handleBack = () => {
  router.back()
}

// 页面加载时获取二级卡片数据
onMounted(() => {
  fetchSubCards()
  
  // 从 sessionStorage 中读取用户信息
  const savedUser = sessionStorage.getItem('selectedCardUser')
  if (savedUser) {
    selectedCardUser.value = JSON.parse(savedUser)
  }
})
</script>

<style scoped lang="less">
.issue-card {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
  transition: filter 0.3s ease;
}

.blur-content {
  filter: blur(8px);
  pointer-events: none;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
}

.card-carousel {
  margin-bottom: 24px;
}

.sub-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 200px;
}

.sub-card-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.sub-card-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.sub-card-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
  text-align: center;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #333;
}

.recipient-section {
  margin-bottom: 20px;
}

.recipient-menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f7fa;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  font-size: 20px;
  color: #1989fa;
}

.menu-text {
  font-size: 16px;
  color: #333;
}

.menu-arrow {
  font-size: 16px;
  color: #c0c4cc;
}

.selected-recipient {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
  padding: 0 16px;
}

.message-section {
  margin-bottom: 24px;
}

.issue-btn {
  border-radius: 12px;
  height: 48px;
  font-size: 16px;
}

.envelope-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  perspective: 1000px;
}

.envelope-animation {
  position: relative;
  width: 100%;
  max-width: 450px;
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.envelope {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.envelope-front,
.envelope-back,
.envelope-flap {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #4A90E2;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.envelope-front {
  z-index: 3;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}

.envelope-back {
  z-index: 1;
  transform: translateZ(-10px);
}

.envelope-flap {
  z-index: 4;
  clip-path: polygon(0 0, 100% 0, 50% 50%, 0 0);
  transform-origin: top center;
}

.envelope-content {
  position: relative;
  z-index: 2;
  width: 90%;
  height: 80%;
  margin: 5% auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform-origin: center;
}

.success-content {
  background-color: white;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.success-icon {
  margin-bottom: 20px;
}

.check-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #50E3C2;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  animation: pulse 1s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.checkmark {
  width: 40px;
  height: 20px;
  border-left: 4px solid white;
  border-bottom: 4px solid white;
  transform: rotate(-45deg);
  animation: drawCheck 0.5s ease-in-out 0.5s forwards;
  opacity: 0;
}

@keyframes drawCheck {
  from {
    opacity: 0;
    transform: rotate(-45deg) scale(0);
  }
  to {
    opacity: 1;
    transform: rotate(-45deg) scale(1);
  }
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.success-message {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.card-preview {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.card-image {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
}

.card-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 300px;
}

.primary-btn {
  padding: 14px;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.primary-btn:hover {
  background-color: #357ABD;
}

.secondary-btn {
  padding: 14px;
  background-color: white;
  color: #4A90E2;
  border: 1px solid #4A90E2;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  background-color: #f0f7ff;
}
</style>