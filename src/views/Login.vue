<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo">
          <span class="logo-icon">🔐</span>
        </div>
        <h1 class="brand-name">用户登录</h1>
        <p class="brand-desc">欢迎回来，请登录您的账户</p>
      </div>

      <!-- 登录表单 -->
      <div class="login-form">
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ errorMessage }}
        </div>

        <!-- 用户名输入 -->
        <div class="form-group">
          <label class="form-label">用户名</label>
          <van-field
            v-model="username"
            placeholder="请输入用户名或邮箱"
            class="form-input"
            clearable
          />
        </div>

        <!-- 密码输入 -->
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

        <!-- 记住我和忘记密码 -->
        <div class="form-options">
          <van-checkbox v-model="rememberMe">记住我</van-checkbox>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <!-- 登录按钮 -->
        <van-button
          type="primary"
          @click="login"
          class="login-btn"
          :loading="loading"
          block
        >
          登录
        </van-button>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账户？
          <a href="#" class="register-btn">立即注册</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as loginApi } from '@/api/auth'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const rememberMe = ref(false)

const login = async () => {
  // 表单验证
  if (!username.value) {
    errorMessage.value = '请输入用户名'
    return
  }
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    // 调用登录接口
    const res = await loginApi({
      username: username.value,
      password: password.value
    })

    // 登录成功处理
    console.log('登录成功:', res)
    
    // 保存用户信息到Pinia store
    if (res.code === 200) {
      // 使用Pinia保存用户信息
      userStore.setUserInfo(res)
      
      // 记住我功能
      if (rememberMe.value) {
        localStorage.setItem('username', username.value)
      } else {
        localStorage.removeItem('username')
      }
      
      // 显示成功提示
      showToast({
        type: 'success',
        message: '登录成功'
      })
      
      // 跳转到首页
      router.push('/home')
    } else {
      errorMessage.value = res.msg || '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = error.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

// 页面加载时，检查是否有记住的用户名
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
/* 页面容器 */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 登录卡片 */
.login-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.6s ease-out;
}

/* Logo区域 */
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

/* 登录表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 错误消息 */
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

/* 表单组 */
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

/* 输入框样式 */
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

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  font-size: 14px;
  color: #667eea;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

/* 登录按钮 */
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

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-btn {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
}

.register-btn:hover {
  text-decoration: underline;
}

/* 动画 */
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

/* 响应式设计 */
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
