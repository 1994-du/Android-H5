<template>
  <div class="send-success-container">
    <div class="success-content">
      <!-- 成功图标 -->
      <div class="success-icon">
        <div class="check-circle">
          <div class="checkmark"></div>
        </div>
      </div>
      
      <!-- 成功消息 -->
      <h1 class="success-title">发送成功！</h1>
      <p class="success-message">你的卡片已成功发送给 {{ selectedFriend.name }}</p>
      
      <!-- 卡片预览 -->
      <div class="card-preview">
        <img :src="selectedCard.image" :alt="selectedCard.name" class="card-image" />
        <div class="card-name">{{ selectedCard.name }}</div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="primary-btn" @click="sendAnother">再发一张</button>
        <button class="secondary-btn" @click="goHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const selectedCard = ref({});
const selectedFriend = ref({});

onMounted(() => {
  // 从会话存储中获取选中的卡片和好友信息
  const cardData = sessionStorage.getItem('selectedCard');
  const friendData = sessionStorage.getItem('selectedFriend');
  
  if (cardData && friendData) {
    selectedCard.value = JSON.parse(cardData);
    selectedFriend.value = JSON.parse(friendData);
  } else {
    // 如果没有数据，重定向到卡片选择页面
    router.push('/send-card');
  }
});

const sendAnother = () => {
  // 清除会话存储中的数据，准备重新发送
  sessionStorage.removeItem('selectedCard');
  sessionStorage.removeItem('selectedFriend');
  router.push('/send-card');
};

const goHome = () => {
  // 清除会话存储中的数据
  sessionStorage.removeItem('selectedCard');
  sessionStorage.removeItem('selectedFriend');
  router.push('/public-chat');
};
</script>

<style scoped>
.send-success-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.success-content {
  background-color: white;
  border-radius: 20px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-icon {
  margin-bottom: 30px;
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
  animation: fadeIn 0.5s ease-in-out 0.8s forwards;
  opacity: 0;
}

.success-message {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  animation: fadeIn 0.5s ease-in-out 1s forwards;
  opacity: 0;
}

.card-preview {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 30px;
  animation: fadeIn 0.5s ease-in-out 1.2s forwards;
  opacity: 0;
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
  animation: fadeIn 0.5s ease-in-out 1.4s forwards;
  opacity: 0;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>