<template>
  <div class="dxx-header" :style="headerStyle">
    <div class="header-content">
      <div class="left" v-if="showBack" @click="handleBack">
        <van-icon name="arrow-left" size="18" />
      </div>
      <div class="title">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  bgColor: {
    type: String,
    default: '#ffffff'
  },
  bgImage: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()

const headerStyle = computed(() => {
  if (props.bgImage) {
    return {
      backgroundImage: `url(${props.bgImage})`,
      backgroundSize: 'auto',
      backgroundPosition: 'cover',
      backgroundRepeat: 'no-repeat'
    }
  }
  return {
    backgroundColor: props.bgColor
  }
})

const handleBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.dxx-header {
  position: fixed;
  top: -calc(var(--status-bar-height));
  left: 0;
  right: 0;
  z-index: 100;
  .header-content {
    height: calc(46px + var(--status-bar-height));
    display: flex;
    align-items: center;
    padding: 0 16px;
    
    .left {
      width: 40px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    
    .title {
      flex: 1;
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .right {
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }
}
</style>
