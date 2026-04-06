<template>
  <van-tabbar v-model="active" :route="true">
    <van-tabbar-item icon="chat-o" to="/public-chat">
      公共聊天
      <van-badge v-if="unreadCount > 0" :content="unreadCount" class="message-badge" />
    </van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/about">
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const active = ref(0)
const unreadCount = ref(0)

const updateActiveTab = () => {
  const path = route.path
  if (path === '/public-chat') {
    active.value = 0
  } else if (path === '/about') {
    active.value = 1
  }
}

onMounted(() => {
  updateActiveTab()
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
