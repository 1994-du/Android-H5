<template>
  <div class="send-success-container">
    <!-- 信封动画 -->
    <div class="envelope-animation" v-if="showEnvelope">
      <div class="envelope">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import gsap from 'gsap';

const router = useRouter();
const selectedCard = ref({});
const selectedFriend = ref({});
const showEnvelope = ref(true);

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
  
  // 触发 GSAP 信封动画
  setTimeout(() => {
    initEnvelopeAnimation();
  }, 100);
});

const initEnvelopeAnimation = () => {
  const envelope = document.querySelector('.envelope');
  const envelopeFlap = document.querySelector('.envelope-flap');
  const envelopeContent = document.querySelector('.envelope-content');
  
  if (!envelope || !envelopeFlap || !envelopeContent) return;
  
  // 创建 GSAP 时间线
  const tl = gsap.timeline({
    defaults: {
      duration: 1,
      ease: 'power3.out'
    }
  });
  
  // 初始状态
  gsap.set(envelope, {
    scale: 0.8,
    opacity: 0,
    rotationY: 0
  });
  
  gsap.set(envelopeFlap, {
    rotationX: 0,
    transformOrigin: 'top center'
  });
  
  gsap.set(envelopeContent, {
    y: 50,
    scale: 0.8,
    opacity: 0
  });
  
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
    });
};

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
  perspective: 1000px;
}

.envelope-animation {
  position: relative;
  width: 100%;
  max-width: 450px;
  height: 300px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>