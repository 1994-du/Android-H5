<template>
  <DxxHeader bgColor="green" :bgImage="bgImg">我的</DxxHeader>
  <div class="about dxx_wrap" :style="{'background-image':bgImgContent,'background-position':'0 46px'}">
    <div class="content">
      <van-cell-group inset>
        <van-cell title="项目名称" value="H5 App" />
        <van-cell title="技术栈" value="Vue 3 + Vite" />
        <van-cell title="UI 框架" value="Vant 4" />
        <van-cell title="状态管理" value="Pinia" />
        <van-cell title="路由" value="Vue Router 4" />
      </van-cell-group>
      
      <van-cell-group inset title="功能演示">
        <van-field
          v-model="message"
          rows="2"
          autosize
          label="留言"
          type="textarea"
          placeholder="请输入留言"
        />
        <van-cell title="开关">
          <van-switch v-model="checked" />
        </van-cell>
        <van-cell title="滑块">
          <van-slider v-model="sliderValue" style="width: 100px;" />
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DxxHeader from '@/components/DxxHeader.vue'
const message = ref('')
const checked = ref(false)
const sliderValue = ref(50)
const bgImg = ref(`${import.meta.env.VITE_PROJECT_URL}img/qp_01.png`)
const bgImgContent = ref(`url(${import.meta.env.VITE_PROJECT_URL}img/qp_02.png)`)

const style = window.getComputedStyle(document.documentElement)
const statusBarHeight = style.getPropertyValue('--status-bar-height')

console.log('----',statusBarHeight.toString().split('px')[0], 46);

</script>

<style scoped lang="less">
.about {
  min-height: 100vh;
  background-color: #f7f8fa;
  background-size: auto;
  background-repeat: no-repeat;
}

.content {
  height: 100%;
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
}

.van-cell-group {
  margin: 0;
}
</style>
