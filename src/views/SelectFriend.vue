<template>
  <div class="select-friend-container">
    <DxxHeader title="选择好友" />
    
    <div class="content">
      <div class="intro-text">
        请选择要发送卡片的好友
      </div>
      
      <div class="action-button">
        <van-button 
          type="primary" 
          block 
          @click="goToUserSelect"
          class="select-btn"
        >
          选择好友
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { VanButton } from 'vant';
import DxxHeader from '@/components/DxxHeader.vue';

const router = useRouter();

const goToUserSelect = () => {
  // 跳转到用户选择页面
  router.push({
    path: '/user-select',
    query: {
      from: 'send-card'
    }
  });
};
</script>

<style scoped>
.select-friend-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 32px;
}

.intro-text {
  font-size: 18px;
  color: #333;
  margin-bottom: 40px;
  text-align: center;
  line-height: 1.5;
}

.action-button {
  width: 100%;
}

.select-btn {
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
}
</style>