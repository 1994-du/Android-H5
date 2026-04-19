<template>
  <Vue3Lottie
    :animationData="animationData"
    :height="200"
    :width="200"
    :loop="true"
    :autoplay="true"
  />
</template>
<script setup>
import animationData from '@/json/contact-email.json'
</script>
