<template>
  <div class="dxx-header" :style="headerStyle">
    <div class="header-bg"></div>
    <div class="header-content">
      <div class="left" v-if="showBack" @click="handleBack">
        <div class="back-btn">
          <van-icon name="arrow-left" size="18" />
        </div>
      </div>
      <div class="title">
        <slot></slot>
      </div>
      <div class="right">
        <slot name="right"></slot>
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
  },
  customBack: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back'])

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
  return {}
})

const handleBack = () => {
  emit('back')
  if (!props.customBack) {
    router.back()
  }
}
</script>

<style scoped lang="less">
.dxx-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: calc(46px + var(--status-bar-height));
  
  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: -1;
  }
  
  .header-content {
    height: 100%;
    display: flex;
    align-items: center;
    padding: var(--status-bar-height) 16px 0;
    color: #fff;
    
    .left {
      width: 40px;
      display: flex;
      align-items: center;
      
      .back-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.95);
        }
      }
    }
    
    .title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: 18px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-width: 200px;
    }
    
    .right {
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-left: auto;
    }
  }
}
</style>
