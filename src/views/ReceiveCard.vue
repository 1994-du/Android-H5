<template>
  <div class="receive-card-container">
    <!-- 信封动画 -->
    <div v-if="showEnvelope" class="envelope-container" @click="openEnvelope">
      <div class="envelope">
        <div class="envelope-front"></div>
        <div class="envelope-back"></div>
        <div class="envelope-top"></div>
        <div class="envelope-content">
          <div class="card-preview">
            <img :src="receivedCard.cardImage" :alt="receivedCard.cardName" />
          </div>
        </div>
      </div>
      <div class="tap-hint">点击打开信封</div>
    </div>
    
    <!-- 卡片内容 -->
    <div v-else class="card-content-container">
      <DxxHeader title="收到卡片" />
      
      <div class="card-content">
        <!-- 发送者信息 -->
        <div class="sender-info">
          <div class="sender-avatar">
            <img :src="receivedCard.senderAvatar" :alt="receivedCard.senderName" />
          </div>
          <div class="sender-details">
            <div class="sender-name">{{ receivedCard.senderName }}</div>
            <div class="send-time">刚刚</div>
          </div>
        </div>
        
        <!-- 卡片展示 -->
        <div class="card-showcase">
          <img :src="receivedCard.cardImage" :alt="receivedCard.cardName" class="card-image" />
          <div class="card-name">{{ receivedCard.cardName }}</div>
        </div>
        
        <!-- 消息内容 -->
        <div v-if="receivedCard.message" class="message-content">
          <div class="message-label">附言：</div>
          <div class="message-text">{{ receivedCard.message }}</div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="reply-btn" @click="reply">回复</button>
          <button class="back-btn" @click="goBack">返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DxxHeader from '@/components/DxxHeader.vue';

const router = useRouter();
const route = useRoute();
const showEnvelope = ref(true);
const receivedCard = ref({
  cardImage: '/img/qp_01.png',
  cardName: '生日卡片',
  senderName: '张三',
  senderAvatar: 'https://via.placeholder.com/50',
  message: '祝你生日快乐！'
});

onMounted(() => {
  // 模拟从 API 获取卡片数据
  const cardId = route.params.id;
  // 实际项目中这里应该调用 API 获取卡片详情
  console.log('接收卡片 ID:', cardId);
});

const openEnvelope = () => {
  if (showEnvelope.value) {
    showEnvelope.value = false;
  }
};

const reply = () => {
  // 清除会话存储中的数据
  sessionStorage.removeItem('selectedCard');
  sessionStorage.removeItem('selectedFriend');
  router.push('/send-card');
};

const goBack = () => {
  router.push('/public-chat');
};
</script>

<style scoped>
.receive-card-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
}

/* 信封样式 */
.envelope-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  cursor: pointer;
}

.envelope {
  position: relative;
  width: 280px;
  height: 200px;
  cursor: pointer;
  animation: envelopeFloat 3s ease-in-out infinite;
}

@keyframes envelopeFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.envelope-back {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #D0021B;
  border-radius: 0 0 8px 8px;
  z-index: 1;
}

.envelope-front {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 140px solid transparent;
  border-right: 140px solid transparent;
  border-bottom: 120px solid #D0021B;
  top: 40px;
  z-index: 3;
}

.envelope-top {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 140px solid transparent;
  border-right: 140px solid transparent;
  border-bottom: 80px solid #B80217;
  top: 0;
  z-index: 4;
  transform-origin: top center;
  transition: transform 1s ease-in-out;
}

.envelope:hover .envelope-top {
  transform: rotateX(180deg);
}

.envelope-content {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  overflow: hidden;
  transition: transform 1s ease-in-out;
}

.envelope:hover .envelope-content {
  transform: translateY(-40px);
}

.card-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-preview img {
  width: 80%;
  height: 80%;
  object-fit: cover;
  border-radius: 4px;
}

.tap-hint {
  margin-top: 30px;
  font-size: 16px;
  color: #666;
  animation: tapHint 2s ease-in-out infinite;
}

@keyframes tapHint {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 卡片内容样式 */
.card-content-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

.card-content {
  padding: 20px;
  animation: cardSlideIn 0.8s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sender-info {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sender-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.sender-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-details {
  flex: 1;
}

.sender-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.send-time {
  font-size: 12px;
  color: #999;
}

.card-showcase {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: cardShowcase 1s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes cardShowcase {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.card-image {
  width: 200px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

.card-name {
  font-size: 18px;
  font-weight: 600;
}

.message-content {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: messageFadeIn 1s ease-out 0.6s forwards;
  opacity: 0;
}

@keyframes messageFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.message-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.message-text {
  font-size: 16px;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  gap: 12px;
  animation: buttonsFadeIn 1s ease-out 0.9s forwards;
  opacity: 0;
}

@keyframes buttonsFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.reply-btn {
  flex: 1;
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

.reply-btn:hover {
  background-color: #357ABD;
}

.back-btn {
  flex: 1;
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

.back-btn:hover {
  background-color: #f0f7ff;
}
</style>