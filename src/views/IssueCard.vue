<template>
  <DxxHeader :show-back="true" @click-back="handleBack">发卡</DxxHeader>
  <div class="issue-card dxx_wrap">
    <div class="content" :class="{ 'blur-content': showSuccess }">
      <h2 class="page-title">{{ cardName }} - 选择卡片</h2>

      <div class="card-carousel">
        <Swipe
          :autoplay="0"
          :loop="false"
          indicator-color="#1989fa"
          @change="onSwipeChange"
        >
          <SwipeItem v-for="(card, index) in subCards" :key="card.id">
            <div
              class="sub-card"
              :ref="el => { if (el) cardRefs[index] = el }"
              :style="{ background: card.color }"
            >
              <div class="sub-card-icon">{{ card.icon }}</div>
              <h3 class="sub-card-name">{{ card.name }}</h3>
              <p class="sub-card-desc">{{ card.description }}</p>
            </div>
          </SwipeItem>
        </Swipe>
      </div>

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

      <div class="message-section">
        <h3 class="section-title">留言</h3>
        <Field
          v-model="message"
          type="textarea"
          :rows="4"
          placeholder="请输入留言内容"
        />
      </div>

      <Button
        type="primary"
        block
        class="issue-btn"
        :loading="loading"
        @click="handleIssueCard"
      >
        发送卡片
      </Button>
    </div>

    <!-- 发送动画组件 -->
    <SendCardAnimation v-if="showSendAnimation" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, Swipe, SwipeItem, Icon, Field, Button } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'
import SendCardAnimation from '@/components/SendCardAnimation.vue'
import { sendCard } from '@/api/card'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const cardType = ref(route.query.cardType || '1')
const cardName = ref(route.query.cardName || '卡片')

const cardRefs = ref([])

const subCards = ref([])
const selectedCard = ref(null)
const currentIndex = ref(0)

const recipient = ref(route.query.recipient || '')
const message = ref('')
const selectedCardUser = ref(null)
const loading = ref(false)
const showSuccess = ref(false)
const showSendAnimation = ref(false)

const fetchSubCards = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))

  const subCardData = {
    '1': [
      { id: '1-1', name: '优秀表现', description: '表彰突出的工作表现', icon: '🌟', color: 'linear-gradient(135deg, #ffd700 0%, #ffed4a 100%)' },
      { id: '1-2', name: '创新思维', description: '鼓励创新的想法和解决方案', icon: '💡', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: '1-3', name: '团队合作', description: '赞赏良好的团队协作精神', icon: '🤝', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }
    ],
    '2': [
      { id: '2-1', name: '贡献突出', description: '认可对团队的重大贡献', icon: '🏆', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { id: '2-2', name: '专业能力', description: '肯定专业技能和知识水平', icon: '🎯', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { id: '2-3', name: '领导力', description: '认可领导能力和管理水平', icon: '👑', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
    ],
    '3': [
      { id: '3-1', name: '流程优化', description: '提出流程改进的建议', icon: '🔄', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
      { id: '3-2', name: '问题反馈', description: '反馈工作中遇到的问题', icon: '⚠️', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
      { id: '3-3', name: '改进建议', description: '提供改进产品或服务的建议', icon: '📝', color: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' }
    ]
  }

  subCards.value = subCardData[cardType.value] || []

  if (subCards.value.length > 0) {
    selectedCard.value = subCards.value[0]
    currentIndex.value = 0
  }
}

const onSwipeChange = (index) => {
  if (subCards.value[index]) {
    selectedCard.value = subCards.value[index]
    currentIndex.value = index
  }
}

const openUserSelect = () => {
  router.push({
    path: '/user-select',
    query: {
      from: 'issue-card',
      cardType: cardType.value,
      cardName: cardName.value
    }
  })
}

const handleIssueCard = async () => {
  if (!recipient.value) {
    showToast({
      message: '请选择接收人',
      type: 'warning'
    })
    return
  }
  // 按钮loading状态
  loading.value = true
  try {
    const res = await sendCard({
      cardId:'1',
      receiverId: selectedCardUser.value?.id,
      senderId: userStore.id
    })
    console.log('发送卡片',res);
    
    sessionStorage.removeItem('selectedCardUser')

    // 显示发送动画
    showSendAnimation.value = true
    
    // 动画结束后返回选卡页面
    setTimeout(() => {
      showSendAnimation.value = false
      // 重置表单
      message.value = ''
      recipient.value = ''
      selectedCardUser.value = null
      selectedCard.value = subCards.value[0] || null
      currentIndex.value = 0
    }, 2000) // 假设动画持续2秒
  } catch (error) {
    showToast({
      message: error.message || '卡片发送失败，请重试',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  showSuccess.value = false
  message.value = ''
  recipient.value = ''
  selectedCardUser.value = null
  selectedCard.value = subCards.value[0] || null
  currentIndex.value = 0
}

const goHome = () => {
  showSuccess.value = false
  router.push('/public-chat')
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  fetchSubCards()

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
  position: relative;
}

.sub-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 200px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.sub-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.sub-card:hover .sub-card-desc {
  color: rgba(0, 0, 0, 0.8);
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
  color: #333;
  margin: 0;
  text-align: center;
  transition: color 0.3s ease;
}

.sub-card:hover .sub-card-desc {
  color: #000;
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
  transition: all 0.3s;
}

.flying-card {
  width: 100%;
  height: 100%;
  padding: 14px;
  box-sizing: border-box;
}

.flying-card__paper {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 16px 16px 14px;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #142033;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.05) 38%, rgba(0, 0, 0, 0.08) 100%),
    var(--flying-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.52);
  box-shadow:
    0 18px 34px rgba(11, 21, 38, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.flying-card__paper::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  pointer-events: none;
}

.flying-card__shine {
  position: absolute;
  inset: -20% -60%;
  background: linear-gradient(110deg, transparent 32%, rgba(255, 255, 255, 0.2) 44%, rgba(255, 255, 255, 0.58) 50%, rgba(255, 255, 255, 0.12) 56%, transparent 68%);
  transform: rotate(8deg);
  opacity: 0.82;
}

.flying-card__header,
.flying-card__body,
.flying-card__footer {
  position: relative;
  z-index: 1;
}

.flying-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flying-card__badge,
.flying-card__stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 10px rgba(17, 24, 39, 0.08);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.flying-card__emoji {
  font-size: 34px;
  filter: drop-shadow(0 8px 12px rgba(17, 24, 39, 0.15));
}

.flying-card__body {
  margin: 10px 0;
}

.flying-card__title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.flying-card__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(20, 32, 51, 0.8);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.flying-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.flying-card__recipient {
  max-width: 70%;
  font-size: 12px;
  font-weight: 600;
  color: rgba(20, 32, 51, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.envelope-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at top, rgba(87, 167, 255, 0.22), transparent 34%),
    radial-gradient(circle at 80% 80%, rgba(82, 196, 26, 0.16), transparent 26%),
    rgba(8, 18, 38, 0.58);
  backdrop-filter: blur(18px) saturate(130%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  overflow: hidden;
  animation: overlayFadeIn 0.35s ease both;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.success-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.success-particle {
  --tx: 0px;
  --ty: 0px;
  --size: 10px;
  --delay: 0s;
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--size);
  height: var(--size);
  border-radius: 999px;
  opacity: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(255, 214, 102, 0.7) 48%, rgba(255, 214, 102, 0) 72%);
  box-shadow: 0 0 16px rgba(255, 214, 102, 0.55);
  animation: particleBurst 1.35s cubic-bezier(0.22, 1, 0.36, 1) var(--delay) forwards;
}

.success-particle:nth-child(1) { --tx: -150px; --ty: -110px; --size: 12px; --delay: 0.08s; }
.success-particle:nth-child(2) { --tx: -90px; --ty: -136px; --size: 8px; --delay: 0.12s; }
.success-particle:nth-child(3) { --tx: 22px; --ty: -152px; --size: 9px; --delay: 0.18s; }
.success-particle:nth-child(4) { --tx: 126px; --ty: -112px; --size: 12px; --delay: 0.1s; }
.success-particle:nth-child(5) { --tx: 162px; --ty: -22px; --size: 7px; --delay: 0.22s; }
.success-particle:nth-child(6) { --tx: 138px; --ty: 94px; --size: 10px; --delay: 0.16s; }
.success-particle:nth-child(7) { --tx: 38px; --ty: 146px; --size: 11px; --delay: 0.28s; }
.success-particle:nth-child(8) { --tx: -74px; --ty: 132px; --size: 8px; --delay: 0.2s; }
.success-particle:nth-child(9) { --tx: -154px; --ty: 58px; --size: 9px; --delay: 0.24s; }
.success-particle:nth-child(10) { --tx: -126px; --ty: -10px; --size: 6px; --delay: 0.14s; }

@keyframes particleBurst {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
  22% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1);
  }
}

.success-glow {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0;
  animation: glowDrift 1.2s ease forwards;
}

.success-glow-left {
  top: 8%;
  left: 8%;
  background: rgba(96, 165, 250, 0.28);
}

.success-glow-right {
  right: 4%;
  bottom: 16%;
  background: rgba(82, 196, 26, 0.22);
  animation-delay: 0.14s;
}

@keyframes glowDrift {
  0% {
    opacity: 0;
    transform: scale(0.7) translateY(24px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.success-content {
  position: relative;
  z-index: 1;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(247, 250, 255, 0.94));
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 28px;
  padding: 28px 24px 24px;
  text-align: center;
  width: 100%;
  max-width: 356px;
  overflow: hidden;
  box-shadow:
    0 26px 64px rgba(8, 18, 38, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  transform-origin: center bottom;
  animation: successPop 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.success-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.36) 0%, transparent 38%, rgba(89, 165, 255, 0.08) 100%);
  pointer-events: none;
}

.success-content::after {
  content: '';
  position: absolute;
  top: -30%;
  left: -45%;
  width: 40%;
  height: 180%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0));
  transform: rotate(18deg);
  opacity: 0;
  animation: panelSweep 1.3s ease 0.24s forwards;
}

@keyframes successPop {
  0% {
    transform: translateY(42px) scale(0.84) rotateX(-18deg);
    opacity: 0;
  }
  72% {
    transform: translateY(-5px) scale(1.02) rotateX(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1) rotateX(0deg);
    opacity: 1;
  }
}

.success-status {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  padding: 7px 14px;
  margin-bottom: 14px;
  border-radius: 999px;
  color: #166534;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, rgba(220, 252, 231, 0.96), rgba(187, 247, 208, 0.92));
  box-shadow:
    0 8px 18px rgba(22, 101, 52, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  animation: riseFade 0.5s ease 0.12s both;
}

.success-icon {
  position: relative;
  z-index: 1;
  width: 110px;
  height: 110px;
  margin: 0 auto 18px;
}

.check-circle {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, #8bf06b 0%, #52c41a 48%, #2c8f0d 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  box-shadow:
    0 18px 34px rgba(56, 158, 13, 0.34),
    inset 0 3px 6px rgba(255, 255, 255, 0.38);
  animation: checkPulse 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.12s both;
}

.check-halo {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 1px solid rgba(82, 196, 26, 0.24);
  animation: haloRipple 1.5s ease-out 0.08s both;
}

.check-halo-delayed {
  animation-delay: 0.32s;
}

@keyframes checkPulse {
  0% {
    transform: scale(0.32) translateY(12px);
  }
  58% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes haloRipple {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }
  22% {
    opacity: 0.45;
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

.checkmark {
  width: 38px;
  height: 20px;
  border-left: 5px solid white;
  border-bottom: 5px solid white;
  transform: rotate(-45deg) scale(0);
  transform-origin: center;
  animation: drawCheck 0.45s ease-out 0.34s forwards;
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
  position: relative;
  z-index: 1;
  font-size: 24px;
  font-weight: 700;
  color: #1b2230;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
  animation: riseFade 0.5s ease 0.18s both;
}

.success-message {
  position: relative;
  z-index: 1;
  font-size: 15px;
  color: #5d6678;
  margin-bottom: 20px;
  line-height: 1.5;
  animation: riseFade 0.5s ease 0.26s both;
}

.recipient-highlight {
  color: #1d4ed8;
  font-weight: 600;
}

.card-preview-shell {
  position: relative;
  z-index: 1;
  margin-bottom: 24px;
  animation: cardLift 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both;
}

.preview-shadow {
  position: absolute;
  left: 13%;
  right: 13%;
  bottom: -16px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(17, 24, 39, 0.24) 0%, transparent 72%);
  filter: blur(8px);
  opacity: 0;
  animation: shadowSettle 0.75s ease 0.3s forwards;
}

@keyframes shadowSettle {
  from {
    opacity: 0;
    transform: scaleX(0.56);
  }
  to {
    opacity: 1;
    transform: scaleX(0.9);
  }
}

.card-preview {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  padding: 22px 20px;
  min-height: 132px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 18px 38px rgba(18, 38, 63, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.34);
  transform-style: preserve-3d;
}

.card-preview::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.02) 48%, rgba(0, 0, 0, 0.08) 100%);
}

.preview-shine {
  position: absolute;
  inset: -20% -60%;
  background: linear-gradient(105deg, transparent 24%, rgba(255, 255, 255, 0.22) 38%, rgba(255, 255, 255, 0.58) 48%, rgba(255, 255, 255, 0.12) 60%, transparent 72%);
  transform: translateX(-72%) rotate(10deg);
  animation: shineSweep 1.5s ease 0.54s forwards;
}

@keyframes shineSweep {
  0% {
    transform: translateX(-72%) rotate(10deg);
    opacity: 0;
  }
  28% {
    opacity: 1;
  }
  100% {
    transform: translateX(72%) rotate(10deg);
    opacity: 0;
  }
}

.preview-icon {
  position: relative;
  z-index: 1;
  font-size: 44px;
  margin-bottom: 10px;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.14));
  animation: iconFloat 2.4s ease-in-out 0.9s infinite;
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.preview-name {
  position: relative;
  z-index: 1;
  font-size: 17px;
  font-weight: 700;
  color: #1b2230;
}

.preview-recipient {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  font-size: 13px;
  color: #5d6678;
  letter-spacing: 0.02em;
  animation: riseFade 0.5s ease 0.34s both;
}

@keyframes cardLift {
  0% {
    opacity: 0;
    transform: translateY(34px) scale(0.78) rotateX(-22deg) rotateZ(-6deg);
  }
  65% {
    opacity: 1;
    transform: translateY(-4px) scale(1.02) rotateX(0deg) rotateZ(1deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg) rotateZ(0deg);
  }
}

@keyframes riseFade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes panelSweep {
  0% {
    opacity: 0;
    transform: translateX(-120%) rotate(18deg);
  }
  30% {
    opacity: 0.58;
  }
  100% {
    opacity: 0;
    transform: translateX(250%) rotate(18deg);
  }
}

.action-buttons {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: riseFade 0.5s ease 0.42s both;
}

.primary-btn {
  padding: 14px;
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
  }
}

.secondary-btn {
  padding: 14px;
  background-color: white;
  color: #666;
  border: 1px solid #dcdee0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f5f5;
    border-color: #c0c4cc;
  }
}

@media (max-width: 375px) {
  .success-content {
    padding: 24px 18px 20px;
  }

  .success-title {
    font-size: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .envelope-overlay,
  .success-content,
  .success-content::after,
  .success-status,
  .success-title,
  .success-message,
  .card-preview-shell,
  .preview-shadow,
  .preview-shine,
  .preview-icon,
  .preview-recipient,
  .action-buttons,
  .check-circle,
  .checkmark,
  .check-halo,
  .success-glow,
  .success-particle {
    animation: none !important;
  }
}
</style>
