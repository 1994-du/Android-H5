<template>
  <div class="user-select-page">
    <DxxHeader :show-back="true" @click-back="handleBack">选择用户</DxxHeader>
    
    <div class="container">
      <!-- 搜索框 -->
      <div class="search-section">
        <Search
          v-model="searchValue"
          placeholder="搜索用户"
          @input="handleInput"
          class="search-input"
        />
      </div>
      
      <!-- 用户列表 -->
      <div class="list-section">
        <List
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadMore"
          class="user-list"
        >
          <Cell
            v-for="user in userList"
            :key="user.id"
            :title="user.username"
            :value="user.roleName"
            @click="selectUser(user)"
            :class="{ 'selected': selectedUser?.id === user.id }"
            class="user-item"
          >
            <template #left>
              <div class="user-avatar">
                <img :src="user.avatar || 'https://via.placeholder.com/50'" :alt="user.username" />
              </div>
            </template>
            <template #right>
              <Checkbox 
                v-model="selectedUserId" 
                :name="user.id"
                @change="(value) => handleCheckboxChange(value, user)"
                class="user-checkbox"
              />
            </template>
          </Cell>
        </List>
      </div>
      
      <!-- 已选择信息 -->
      <div v-if="selectedUser" class="selected-section">
        <div class="selected-info">
          <div class="selected-icon">✓</div>
          <div class="selected-details">
            <div class="selected-label">已选择</div>
            <div class="selected-name">{{ selectedUser.username }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 确认按钮 -->
    <div class="confirm-section">
      <Button 
        type="primary" 
        block 
        :disabled="!selectedUser"
        @click="confirmSelection"
        class="confirm-btn"
      >
        确认选择
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Search, List, Cell, Checkbox, Button, showToast } from 'vant';
import DxxHeader from '@/components/DxxHeader.vue';
import { getUsers } from '@/api/user';

const router = useRouter();
const route = useRoute();

const searchValue = ref('');
const userList = ref([]);
const selectedUser = ref(null);
const selectedUserId = ref(null);
const loading = ref(false);
const finished = ref(false);
const page = ref(1);
const isApiCalling = ref(false);

// 来源页面
const from = ref('');

// 监听路由参数变化
watch(() => route.query.from, (newFrom) => {
  from.value = newFrom || '';
}, { immediate: true });

// 处理返回
const handleBack = () => {
  router.back();
};

// 模拟用户列表数据
const mockUserList = [
  { id: 1, name: '张三', department: '技术部', avatar: 'https://via.placeholder.com/50' },
  { id: 2, name: '李四', department: '市场部', avatar: 'https://via.placeholder.com/50' },
  { id: 3, name: '王五', department: '产品部', avatar: 'https://via.placeholder.com/50' },
  { id: 4, name: '赵六', department: '设计部', avatar: 'https://via.placeholder.com/50' },
  { id: 5, name: '钱七', department: '财务部', avatar: 'https://via.placeholder.com/50' },
  { id: 6, name: '孙八', department: '人力资源部', avatar: 'https://via.placeholder.com/50' },
  { id: 7, name: '周九', department: '技术部', avatar: 'https://via.placeholder.com/50' },
  { id: 8, name: '吴十', department: '市场部', avatar: 'https://via.placeholder.com/50' }
];

// 加载用户列表
const loadUsers = async () => {
  // 防止重复调用
  if (isApiCalling.value) return;
  
  loading.value = true;
  isApiCalling.value = true;
  try {
    const response = await getUsers({
      page: page.value,
      pageSize: 10,
      keyword: searchValue.value
    });
    
    // 响应拦截器返回的是整个data对象，API返回的数据结构是{code: 200, msg: "获取用户列表成功", data: {total: 5, pageSize: 10, page: 1, list: [用户列表]}, total: null}
    // 所以需要访问response.data.list来获取用户列表
    const userData = response.data?.list || [];
    // 打印用户数据结构，以便了解正确的字段名
    console.log('用户数据:', userData);
    
    if (page.value === 1) {
      userList.value = userData;
    } else {
      userList.value = [...userList.value, ...userData];
    }
    
    // 如果返回的数据少于pageSize，说明没有更多数据了
    if (userData.length < 10) {
      finished.value = true;
    } else {
      finished.value = false;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    showToast({
      message: '获取用户列表失败，请重试',
      type: 'error'
    });
    // 发生错误时使用模拟数据作为 fallback
    if (page.value === 1) {
      userList.value = mockUserList;
      finished.value = true;
    }
  } finally {
    loading.value = false;
    isApiCalling.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (finished.value || loading.value) return;
  page.value++;
  loadUsers();
};

// 处理搜索
const handleSearch = (value) => {
  searchValue.value = value;
  page.value = 1;
  finished.value = false;
  loadUsers();
};

// 防抖定时器
let debounceTimer = null;

// 处理输入
const handleInput = (value) => {
  searchValue.value = value;
  
  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // 设置新的定时器，300毫秒后执行搜索
  debounceTimer = setTimeout(() => {
    page.value = 1;
    finished.value = false;
    loadUsers();
  }, 300);
};

// 选择用户
const selectUser = (user) => {
  selectedUser.value = user;
  selectedUserId.value = user.id;
};

// 处理复选框变化
const handleCheckboxChange = (value, user) => {
  if (value) {
    selectedUser.value = user;
  } else {
    selectedUser.value = null;
  }
};

// 确认选择
const confirmSelection = () => {
  if (selectedUser.value) {
    // 返回上一页
    router.back();
  }
};

// 页面加载时获取用户列表
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-select-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
  padding: 16px;
  padding-top: 60px;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.list-section {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.user-list {
  height: 100%;
}

.user-item {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: #f9f9f9;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-checkbox {
  --van-checkbox-size: 20px;
}

.selected {
  background-color: #f0f7ff;
}

.selected-section {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 80px;
}

.selected-info {
  display: flex;
  align-items: center;
}

.selected-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #50E3C2;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.selected-details {
  flex: 1;
}

.selected-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.selected-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.confirm-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.confirm-btn {
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

/* 适配不同屏幕尺寸 */
@media (max-width: 768px) {
  .container {
    padding: 12px;
    padding-top: 60px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .selected-section {
    margin-bottom: 70px;
  }
  
  .confirm-btn {
    height: 44px;
  }
}
</style>