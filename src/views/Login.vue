<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <div class="logo">
          <span class="logo-icon">{{ isLogin ? '🔐' : '📝' }}</span>
        </div>
        <h1 class="brand-name">{{ isLogin ? '用户登录' : '用户注册' }}</h1>
        <p class="brand-desc">{{ isLogin ? '欢迎回来，请登录您的账户' : '创建新账户，开始聊天' }}</p>
      </div>

      <div class="login-form">
        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label class="form-label">用户名</label>
          <van-field
            v-model="username"
            placeholder="请输入用户名"
            class="form-input"
            clearable
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
          />
        </div>

        <div v-if="isLogin" class="form-options">
          <van-checkbox v-model="rememberMe">记住我</van-checkbox>
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

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const rememberMe = ref(false)

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
  if (password.value.length < 6) {
    errorMessage.value = '密码至少6个字符'
    return false
  }
  if (!isLogin.value && password.value !== confirmPassword.value) {
    errorMessage.value = '两次密码输入不一致'
    return false
  }
  return true
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
      userStore.setUserInfo(res)
      
      if (isLogin.value && rememberMe.value) {
        localStorage.setItem('username', username.value)
      } else {
        localStorage.removeItem('username')
      }
      
      showToast({
        type: 'success',
        message: isLogin.value ? '登录成功' : '注册成功'
      })
      
      router.push('/public-chat')
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.6s ease-out;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 15px;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.logo-icon {
  font-size: 32px;
}

.brand-name {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.brand-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-message {
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 12px;
  color: #f5222d;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.form-input {
  border-radius: 12px;
  overflow: hidden;
}

.form-input :deep(.van-field__control) {
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input :deep(.van-field__control:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-btn {
  border-radius: 12px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.switch-link {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.switch-btn {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
}

.switch-btn:hover {
  text-decoration: underline;
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
  .login-card {
    padding: 30px 20px;
  }

  .logo {
    width: 60px;
    height: 60px;
  }

  .logo-icon {
    font-size: 24px;
  }

  .brand-name {
    font-size: 20px;
  }
}
</style>
