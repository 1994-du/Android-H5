<template>
  <div class="send_animation">

  
    <Vue3Lottie
      :animationData="animationData"
      :height="200"
      :width="200"
      :loop="true"
      :autoplay="true"
    />
  </div>
</template>
<script setup>
import animationData from '@/json/contact-email.json'
</script>
<style lang="less" scoped>
.send_animation{
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background-color: rgba(0,0,0,0.5);
  .lottie-animation-container{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
