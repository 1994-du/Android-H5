<template>
  <div class="login-container">
    <div class="login-background">
      <div class="aurora aurora-one"></div>
      <div class="aurora aurora-two"></div>
      <div class="grid-overlay"></div>
    </div>
    <div class="login-card">
      <div class="card-topbar">
        <div class="brand-chip">APP H5</div>
        <div class="mode-switch">
          <button
            type="button"
            class="mode-pill"
            :class="{ active: isLogin }"
            @click="setMode(true)"
          >
            登录
          </button>
          <button
            type="button"
            class="mode-pill"
            :class="{ active: !isLogin }"
            @click="setMode(false)"
          >
            注册
          </button>
        </div>
      </div>

      <div class="logo-section">
        <div class="logo-shell">
          <div class="logo">
            <span class="logo-icon">{{ isLogin ? '01' : '02' }}</span>
          </div>
          <div class="logo-glow"></div>
        </div>
      </div>

      <div class="login-form">
        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">!</span>
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label class="form-label">用户名</label>
          <van-field
            v-model="username"
            placeholder="请输入用户名"
            class="form-input"
            clearable
            left-icon="contact-o"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <van-field
            v-model="password"
            placeholder="请输入密码"
            type="password"
            class="form-input"
            clearable
            left-icon="shield-o"
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label class="form-label">确认密码</label>
          <van-field
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            type="password"
            class="form-input"
            clearable
            left-icon="passed"
          />
        </div>

        <div v-if="isLogin" class="form-options">
          <van-checkbox v-model="rememberMe">记住我</van-checkbox>
          <span class="form-tip">登录后自动跳转聊天页</span>
        </div>

        <van-button
          type="primary"
          @click="handleSubmit"
          class="login-btn"
          :loading="loading"
          block
        >
          {{ isLogin ? '登录' : '注册' }}
        </van-button>

        <div class="switch-link">
          {{ isLogin ? '还没有账户？' : '已有账户？' }}
          <a href="#" class="switch-btn" @click.prevent="switchMode">
            {{ isLogin ? '立即注册' : '去登录' }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '@/api/auth'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { setToken } from '@/utils/token'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const rememberMe = ref(false)

const setMode = (loginMode) => {
  if (isLogin.value === loginMode) return
  switchMode()
}

const switchMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
  confirmPassword.value = ''
}

const validateForm = () => {
  if (!username.value) {
    errorMessage.value = '请输入用户名'
    return false
  }
  if (username.value.length < 2) {
    errorMessage.value = '用户名至少2个字符'
    return false
  }
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return false
  }
  if (!isLogin.value && password.value !== confirmPassword.value) {
    errorMessage.value = '两次密码输入不一致'
    return false
  }
  return true
}

const extractToken = (res) => {
  return res?.data?.token
    || res?.token
    || res?.data?.accessToken
    || res?.accessToken
    || ''
}

const extractExpire = (res) => {
  return res?.data?.expire
    || res?.data?.expiresAt
    || res?.expire
    || res?.expiresAt
    || null
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  errorMessage.value = ''

  try {
    const apiFunc = isLogin.value ? login : register
    const res = await apiFunc({
      username: username.value,
      password: password.value
    })

    console.log(isLogin.value ? '登录成功:' : '注册成功:', res)

    if (res.code === 200) {
      const token = extractToken(res)
      const expire = extractExpire(res)
      userStore.setUserInfo(res)
      setToken(token, expire)
      
      if (isLogin.value && rememberMe.value) {
        localStorage.setItem('username', username.value)
      } else {
        localStorage.removeItem('username')
      }
      
      showToast({
        type: 'success',
        message: isLogin.value ? '登录成功' : '注册成功'
      })
      setTimeout(() => {
        router.push('/public-chat')
      }, 2000)
      // await router.replace('/public-chat')
    } else {
      errorMessage.value = res.msg || res.message || (isLogin.value ? '登录失败' : '注册失败')
    }
  } catch (error) {
    console.error(isLogin.value ? '登录失败:' : '注册失败:', error)
    errorMessage.value = error.message || (isLogin.value ? '登录失败，请稍后重试' : '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const init = () => {
  const savedUsername = localStorage.getItem('username')
  if (savedUsername) {
    username.value = savedUsername
    rememberMe.value = true
  }
}

init()
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(241, 123, 76, 0.22), transparent 32%),
    radial-gradient(circle at 85% 15%, rgba(27, 143, 155, 0.22), transparent 30%),
    linear-gradient(145deg, #0d1726 0%, #101f34 42%, #152842 100%);
}

.login-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.aurora {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  opacity: 0.75;
}

.aurora-one {
  width: 280px;
  height: 280px;
  top: -80px;
  left: -60px;
  background: radial-gradient(circle, rgba(255, 141, 84, 0.52) 0%, rgba(255, 141, 84, 0) 72%);
}

.aurora-two {
  width: 340px;
  height: 340px;
  right: -100px;
  bottom: -90px;
  background: radial-gradient(circle, rgba(74, 183, 195, 0.45) 0%, rgba(74, 183, 195, 0) 72%);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.3));
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 26px 26px 30px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, rgba(10, 20, 34, 0.82) 0%, rgba(10, 20, 34, 0.92) 100%);
  box-shadow:
    0 28px 60px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  width: 100%;
  animation: slideUp 0.6s ease-out;
  backdrop-filter: blur(14px);
}

.card-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 12px;
}

.brand-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6d39b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.mode-switch {
  display: inline-flex;
  gap: 8px;
  padding: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.mode-pill {
  border: none;
  min-width: 68px;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: transparent;
  color: rgba(241, 246, 255, 0.72);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.mode-pill.active {
  background: linear-gradient(135deg, #f28755 0%, #f6c36d 100%);
  color: #132235;
  box-shadow: 0 10px 20px rgba(242, 135, 85, 0.28);
}

.logo-section {
  text-align: center;
  margin-bottom: 20px;
}

.logo-shell {
  position: relative;
  width: 108px;
  height: 108px;
  margin: 0 auto 18px;
}

.logo {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f28755 0%, #f6c36d 100%);
  border-radius: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow:
    0 18px 36px rgba(242, 135, 85, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transform: rotate(-8deg);
}

.logo-glow {
  position: absolute;
  inset: 16px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.14);
  filter: blur(18px);
}

.logo-icon {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #15253a;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.error-message {
  background: rgba(255, 117, 87, 0.14);
  border: 1px solid rgba(255, 117, 87, 0.28);
  border-radius: 16px;
  padding: 12px 14px;
  color: #ffd6cc;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(239, 244, 251, 0.78);
  letter-spacing: 0.04em;
}

.form-input {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 6px 16px rgba(7, 14, 24, 0.12);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease;
}

.form-input:focus-within {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(246, 195, 109, 0.7);
  box-shadow:
    0 0 0 4px rgba(246, 195, 109, 0.12),
    0 10px 24px rgba(7, 14, 24, 0.18);
}

.form-input :deep(.van-field) {
  background: transparent;
  min-height: 30px;
  padding: 0 !important;
  border-radius: 12px;
}

.form-input :deep(.van-cell::after) {
  display: none;
}

.form-input :deep(.van-cell),
.form-input :deep(.van-field__value),
.form-input :deep(.van-field__body),
.form-input :deep(.van-field__control),
.form-input :deep(.van-field__left-icon) {
  background: transparent !important;
}

.form-input :deep(.van-cell) {
  padding: 6px 12px !important;
}

.form-input :deep(.van-field__body) {
  min-height: 30px;
  padding: 0;
  border-radius: 12px;
}

.form-input :deep(.van-field__control) {
  min-height: 30px;
  padding: 0 8px 0 6px;
  font-size: 14px;
  line-height: 30px;
  color: #f6f8fb;
}

.form-input :deep(.van-field__control::placeholder) {
  color: rgba(214, 223, 236, 0.4);
}

.form-input :deep(input),
.form-input :deep(textarea) {
  background: transparent !important;
}

.form-input :deep(input:-webkit-autofill),
.form-input :deep(input:-webkit-autofill:hover),
.form-input :deep(input:-webkit-autofill:focus),
.form-input :deep(textarea:-webkit-autofill),
.form-input :deep(select:-webkit-autofill) {
  -webkit-text-fill-color: #f6f8fb !important;
  -webkit-box-shadow: 0 0 0 1000px #202b3a inset !important;
  box-shadow: 0 0 0 1000px #202b3a inset !important;
  transition: background-color 9999s ease-in-out 0s;
  caret-color: #f6f8fb;
  border-radius: 8px;
}

.form-input :deep(.van-field__clear) {
  color: rgba(214, 223, 236, 0.6);
}

.form-input :deep(.van-field__left-icon) {
  margin-right: 4px;
  color: rgba(246, 195, 109, 0.88);
  font-size: 15px;
  display: inline-flex;
  align-items: center;
}

.form-input :deep(.van-icon-clear) {
  font-size: 16px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: rgba(234, 240, 248, 0.74);
}

.form-options :deep(.van-checkbox__label) {
  color: rgba(234, 240, 248, 0.78);
}

.form-options :deep(.van-checkbox__icon--checked .van-icon) {
  background: #f28755;
  border-color: #f28755;
}

.form-tip {
  font-size: 12px;
  color: rgba(246, 195, 109, 0.78);
}

.login-btn {
  border-radius: 18px;
  height: 54px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #f28755 0%, #f6c36d 100%);
  border: none;
  transition: all 0.3s ease;
  color: #132235;
  box-shadow: 0 18px 36px rgba(242, 135, 85, 0.26);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 42px rgba(242, 135, 85, 0.34);
}

.switch-link {
  text-align: center;
  font-size: 14px;
  color: rgba(234, 240, 248, 0.68);
}

.switch-btn {
  color: #f6c36d;
  font-weight: 600;
  text-decoration: none;
}

.switch-btn:hover {
  opacity: 0.9;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 22px 18px 24px;
    border-radius: 24px;
  }

  .card-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .mode-switch {
    width: 100%;
  }

  .mode-pill {
    flex: 1;
  }

  .logo-shell {
    width: 90px;
    height: 90px;
  }

  .logo-icon {
    font-size: 28px;
  }

  .brand-name {
    font-size: 24px;
  }
}
</style>
