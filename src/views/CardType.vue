<template>
  <DxxHeader :show-back="true" @click-back="handleBack">卡片类型</DxxHeader>
  <div class="card-type dxx_wrap">
    <div class="content">
      <h2 class="page-title">选择卡片类型</h2>
      <div class="card-container">
        <div
          v-for="card in cardTypes"
          :key="card.id"
          class="card-item"
          @click="handleCardSelect(card)"
        >
          <div class="card-icon">
            <span class="icon">{{ card.icon }}</span>
          </div>
          <div class="card-info">
            <h3 class="card-name">{{ card.name }}</h3>
            <p class="card-desc">{{ card.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DxxHeader from '@/components/DxxHeader.vue'

const router = useRouter()

// 卡片类型数据
const cardTypes = ref([
  {
    id: '1',
    name: '点赞卡',
    description: '用于对他人的优秀表现表示赞赏',
    icon: '👍'
  },
  {
    id: '2',
    name: '认可卡',
    description: '用于认可他人的贡献和努力',
    icon: '👏'
  },
  {
    id: '3',
    name: '吐槽卡',
    description: '用于提出改进建议或反馈问题',
    icon: '💬'
  }
])

// 处理卡片选择
const handleCardSelect = (card) => {
  // 跳转到发卡页面，并传递卡片类型信息
  router.push({
    path: '/issue-card',
    query: {
      cardType: card.id,
      cardName: card.name
    }
  })
}

// 处理返回
const handleBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.card-type {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.content {
  flex: 1;
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
}

.card-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  display: flex;
  align-items: center;
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

.card-icon {
  margin-right: 12px;
}

.icon {
  font-size: 24px;
}

.card-info {
  flex: 1;
}

.card-name {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #333;
}

.card-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
</style>