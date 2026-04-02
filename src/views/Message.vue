<template>
  <DxxHeader :show-back="false">消息</DxxHeader>
  <div class="message dxx_wrap">
    <div class="content">
      <van-cell-group inset title="系统消息">
        <van-cell 
          v-for="item in systemMessages" 
          :key="item.id" 
          :title="item.title"
          :value="item.time"
          :label="item.content"
          is-link
        />
      </van-cell-group>
      
      <van-cell-group inset title="通知消息">
        <van-cell 
          v-for="item in notificationMessages" 
          :key="item.id" 
          :title="item.title"
          :value="item.time"
          :label="item.content"
          is-link
        />
      </van-cell-group>
    </div>
    <DxxTabbar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DxxHeader from '@/components/DxxHeader.vue'
import DxxTabbar from '@/components/DxxTabbar.vue'

// 系统消息
const systemMessages = ref([
  {
    id: 1,
    title: '系统更新',
    content: '应用已更新到最新版本 v1.0.1',
    time: '2026-04-01 10:30'
  },
  {
    id: 2,
    title: '服务器维护',
    content: '服务器将于今晚 22:00 进行维护',
    time: '2026-03-31 15:45'
  }
])

// 通知消息
const notificationMessages = ref([
  {
    id: 1,
    title: '新消息',
    content: '您有一条新的消息',
    time: '2026-04-01 09:15'
  },
  {
    id: 2,
    title: '活动提醒',
    content: '新的活动已经开始，快来参与吧！',
    time: '2026-03-30 18:20'
  }
])

// 标记所有消息为已读
const markAllAsRead = () => {
  // 这里可以调用 API 标记消息为已读
  console.log('标记所有消息为已读')
}

onMounted(() => {
  markAllAsRead()
})
</script>

<style scoped lang="less">
.message {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
  padding-bottom: 60px;
}

.van-cell {
  padding: 12px 16px;
}

.van-cell__value {
  flex-shrink: 0;
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: #999;
}
</style>
