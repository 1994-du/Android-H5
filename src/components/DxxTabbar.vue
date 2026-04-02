<template>
  <van-tabbar v-model="active" :route="true">
    <van-tabbar-item icon="home-o" to="/home">
      首页
    </van-tabbar-item>
    <van-tabbar-item icon="chat-o" to="/message">
      消息
      <van-badge v-if="showBadge" :content="badgeContent" class="message-badge" />
    </van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/about">
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 激活的标签索引
const active = ref(0)

// 消息徽章
const showBadge = ref(false)
const badgeContent = ref(0)

// 监听路由变化，更新激活的标签
const updateActiveTab = () => {
  const path = route.path
  if (path === '/home') {
    active.value = 0
  } else if (path === '/message') {
    active.value = 1
  } else if (path === '/about') {
    active.value = 2
  }
}

// 模拟获取未读消息数
const fetchUnreadCount = () => {
  // 这里可以从 API 获取未读消息数
  // 模拟有 2 条未读消息
  showBadge.value = true
  badgeContent.value = 2
}

onMounted(() => {
  updateActiveTab()
  fetchUnreadCount()
  
  // 监听路由变化
  router.afterEach(updateActiveTab)
})
</script>

<style scoped lang="less">
.message-badge {
  position: absolute;
  top: -5px;
  right: -10px;
}
</style>
