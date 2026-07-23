<template>
  <van-tabbar :model-value="active" :route="true">
    <van-tabbar-item
      v-for="tab in tabItems"
      :key="tab.path"
      :name="tab.path"
      :icon="tab.icon"
      :to="tab.path"
    >
      {{ tab.title }}
      <van-badge
        v-if="tab.name === 'PublicChat' && unreadCount > 0"
        :content="unreadCount"
        class="message-badge"
      />
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { tabbarRoutes } from '@/router/routes'

const route = useRoute()

const unreadCount = ref(0)
const active = computed(() => route.path)

const tabItems = computed(() => [...tabbarRoutes]
  .sort((a, b) => (a.meta?.tabbarOrder || 0) - (b.meta?.tabbarOrder || 0))
  .map((item) => ({
    name: item.name,
    path: item.path,
    title: item.meta?.title || '',
    icon: item.meta?.tabbarIcon || 'apps-o'
  })))
</script>

<style scoped lang="less">
.message-badge {
  position: absolute;
  top: -5px;
  right: -10px;
}
</style>
