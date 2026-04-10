<template>
  <div class="confirm-send-container">
    <DxxHeader title="确认发送" />
    
    <div class="content">
      <!-- 卡片预览 -->
      <div class="card-preview">
        <img :src="selectedCard.image" :alt="selectedCard.name" class="card-image" />
        <div class="card-name">{{ selectedCard.name }}</div>
      </div>
      
      <!-- 好友信息 -->
      <div class="friend-info">
        <div class="friend-avatar">
          <img :src="selectedFriend.avatar" :alt="selectedFriend.name" />
        </div>
        <div class="friend-details">
          <div class="friend-name">{{ selectedFriend.name }}</div>
          <div class="send-text">将收到你的卡片</div>
        </div>
      </div>
      
      <!-- 消息输入 -->
      <div class="message-input">
        <textarea 
          v-model="message" 
          placeholder="添加消息（可选）"
          class="message-textarea"
        ></textarea>
      </div>
    </div>
    
    <!-- 发送按钮 -->
    <div class="send-section">
      <button 
        class="send-btn"
        :disabled="isSending"
        @click="sendCard"
      >
        <span v-if="!isSending">发送卡片</span>
        <span v-else class="loading">发送中...</span>
      </button>
    </div>
    
    <!-- 发送动画 -->
    <div v-if="showSendAnimation" class="send-animation">
      <div class="card-fly">
        <img :src="selectedCard.image" :alt="selectedCard.name" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DxxHeader from '@/components/DxxHeader.vue';

const router = useRouter();
const selectedCard = ref({});
const selectedFriend = ref({});
const message = ref('');
const isSending = ref(false);
const showSendAnimation = ref(false);

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

const sendCard = async () => {
  isSending.value = true;
  
  // 模拟发送请求
  setTimeout(() => {
    // 显示发送动画
    showSendAnimation.value = true;
    
    // 动画结束后跳转到成功页面
    setTimeout(() => {
      router.push('/send-card/success');
    }, 1500);
  }, 1000);
};
</script>

<style scoped>
.confirm-send-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
  position: relative;
  overflow: hidden;
}

.content {
  padding: 20px;
}

.card-preview {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-image {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
}

.friend-info {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.friend-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-details {
  flex: 1;
}

.friend-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.send-text {
  font-size: 14px;
  color: #666;
}

.message-input {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 14px;
  min-height: 80px;
  outline: none;
}

.send-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.send-btn {
  width: 100%;
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

.send-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  background-color: #357ABD;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading::after {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-left: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.send-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.card-fly {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 70px;
  animation: flyAway 1.5s ease-out forwards;
}

.card-fly img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@keyframes flyAway {
  0% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -100%) scale(0.8) rotate(10deg);
    opacity: 0.8;
  }
  100% {
    transform: translate(100%, -200%) scale(0.5) rotate(20deg);
    opacity: 0;
  }
}
</style>