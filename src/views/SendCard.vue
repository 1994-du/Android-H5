<template>
  <div class="send-card-container">
    <DxxHeader title="选择卡片" />
    
    <div class="card-list">
      <div 
        v-for="card in cards" 
        :key="card.id"
        class="card-item"
        @click="selectCard(card)"
      >
        <img :src="card.image" :alt="card.name" class="card-image" />
        <div class="card-name">{{ card.name }}</div>
      </div>
    </div>
    
    <!-- 卡片预览模态框 -->
    <div v-if="selectedCard" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <button class="close-btn" @click="closePreview">×</button>
        <img :src="selectedCard.image" :alt="selectedCard.name" class="preview-image" />
        <h3 class="preview-name">{{ selectedCard.name }}</h3>
        <p class="preview-description">{{ selectedCard.description }}</p>
        <button class="confirm-btn" @click="confirmCard">选择此卡片</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DxxHeader from '@/components/DxxHeader.vue';

const router = useRouter();
const cards = ref([]);
const selectedCard = ref(null);

// 模拟卡片数据
const mockCards = [
  { id: 1, name: '生日卡片', image: '/img/qp_01.png', description: '祝你生日快乐！' },
  { id: 2, name: '感谢卡片', image: '/img/qp_02.png', description: '谢谢你的帮助！' },
  { id: 3, name: '节日卡片', image: '/img/qp_01.png', description: '节日快乐！' },
  { id: 4, name: '祝福卡片', image: '/img/qp_02.png', description: '送上最美好的祝福！' }
];

onMounted(() => {
  // 实际项目中这里应该调用 API 获取卡片列表
  cards.value = mockCards;
});

const selectCard = (card) => {
  selectedCard.value = card;
};

const closePreview = () => {
  selectedCard.value = null;
};

const confirmCard = () => {
  if (selectedCard.value) {
    // 存储选中的卡片信息到会话存储
    sessionStorage.setItem('selectedCard', JSON.stringify(selectedCard.value));
    router.push('/send-card/friends');
  }
};
</script>

<style scoped>
.send-card-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

.card-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
}

.card-item {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.card-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.card-name {
  padding: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.preview-content {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  position: relative;
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.preview-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.preview-description {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
}

.confirm-btn {
  width: 100%;
  padding: 12px;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.confirm-btn:hover {
  background-color: #357ABD;
}
</style>