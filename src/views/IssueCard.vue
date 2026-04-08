<template>
  <DxxHeader :show-back="true" @click-back="handleBack">发卡</DxxHeader>
  <div class="issue-card dxx_wrap">
    <div class="content">
      <h2 class="page-title">{{ cardName }} - 选择卡片</h2>
      
      <!-- 二级卡片轮播 -->
      <div class="card-carousel">
        <van-swipe :autoplay="false" indicator-color="#1989fa">
          <van-swipe-item v-for="card in subCards" :key="card.id">
            <div class="sub-card">
              <div class="sub-card-icon">{{ card.icon }}</div>
              <h3 class="sub-card-name">{{ card.name }}</h3>
              <p class="sub-card-desc">{{ card.description }}</p>
            </div>
          </van-swipe-item>
        </van-swipe>
      </div>
      
      <!-- 选择接收人 -->
      <div class="recipient-section">
        <div class="recipient-menu" @click="openUserSelect">
          <div class="menu-left">
            <van-icon name="user" class="menu-icon" />
            <span class="menu-text">选择接收人</span>
          </div>
          <van-icon name="arrow" class="menu-arrow" />
        </div>
        <div v-if="recipient" class="selected-recipient">
          已选择：{{ recipient }}
        </div>
      </div>
      
      <!-- 留言区域 -->
      <div class="message-section">
        <h3 class="section-title">留言</h3>
        <van-field
          v-model="message"
          type="textarea"
          :rows="4"
          placeholder="请输入留言内容"
        />
      </div>
      
      <!-- 发卡按钮 -->
      <van-button type="primary" block class="issue-btn" @click="handleIssueCard">
        发送卡片
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'

const router = useRouter()
const route = useRoute()

// 卡片类型信息
const cardType = ref(route.query.cardType || '1')
const cardName = ref(route.query.cardName || '卡片')

// 二级卡片数据
const subCards = ref([])

// 接收人和留言
const recipient = ref(route.query.recipient || '')
const message = ref('')

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
      from: 'issue-card'
    }
  })
}

// 处理发卡
const handleIssueCard = () => {
  if (!recipient.value) {
    showToast({
      message: '请选择接收人',
      type: 'warning'
    })
    return
  }
  
  showToast({
    message: `卡片发送成功！接收人：${recipient.value}`,
    type: 'success'
  })
  
  // 发送成功后返回上一页
  setTimeout(() => {
    router.back()
  }, 1500)
}

// 处理返回
const handleBack = () => {
  router.back()
}

// 页面加载时获取二级卡片数据
onMounted(() => {
  fetchSubCards()
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
</style>