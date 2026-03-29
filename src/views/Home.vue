<template>
  <DxxHeader :show-back="false">首页</DxxHeader>
  <div class="home dxx_wrap">
    <div class="content">
      <van-cell-group inset>
        <van-cell title="计数器示例" :value="count" />
        <van-cell title="双倍计数" :value="doubleCount" />
      </van-cell-group>
      
      <div class="button-group">
        <van-button type="primary" @click="increment">增加</van-button>
        <van-button type="default" @click="decrement">减少</van-button>
      </div>
      
      <van-cell-group inset title="导航">
        <van-cell title="关于页面" is-link to="/about" />
      </van-cell-group>
    </div>
    <van-tabbar v-model="active">
      <van-tabbar-item icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/about">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
import DxxHeader from '@/components/DxxHeader.vue'

const active = ref(0)
const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, decrement } = counterStore
</script>

<style scoped lang="less">
.home {
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

.button-group {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.button-group .van-button {
  flex: 1;
}
</style>
