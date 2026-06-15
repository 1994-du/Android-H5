<template>
  <div class="app-shell" :style="layoutStyle">
    <DxxHeader
      v-if="showHeader"
      :show-back="showBack"
      :bg-color="headerBgColor"
      :custom-back="customBack"
      @back="handleBack"
    >
      {{ pageTitle }}
      <template #right>
        <van-icon
          v-if="headerAction === 'online-users'"
          name="friends-o"
          size="20"
          @click="openOnlineUsers"
        />
      </template>
    </DxxHeader>
    <router-view />
    <DxxTabbar v-if="showTabbar" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DxxHeader from '@/components/DxxHeader.vue'
import DxxTabbar from '@/components/DxxTabbar.vue'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => route.meta.title || '')
const showHeader = computed(() => route.meta.showHeader !== false)
const showBack = computed(() => route.meta.showBack !== false)
const customBack = computed(() => route.meta.customBack === true)
const showTabbar = computed(() => route.meta.showTabbar === true)
const headerBgColor = computed(() => route.meta.headerBgColor || '')
const headerAction = computed(() => route.meta.showHeaderAction || '')
const layoutStyle = computed(() => ({
  '--app-header-height': showHeader.value
    ? 'calc(46px + var(--status-bar-height))'
    : '0px',
  '--app-tabbar-height': showTabbar.value
    ? 'calc(50px + env(safe-area-inset-bottom))'
    : '0px'
}))

const handleBack = () => {
  if (customBack.value) {
    router.back()
  }
}

const openOnlineUsers = () => {
  window.dispatchEvent(new CustomEvent('app-header-action', {
    detail: {
      action: headerAction.value
    }
  }))
}
</script>

<style>
.app-shell {
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
