<template>
  <div class="user-select-page">
    <DxxHeader :show-back="true" @click-back="handleBack">选择用户</DxxHeader>
    
    <div class="search-box">
      <van-search
        v-model="searchValue"
        placeholder="搜索用户"
        @search="handleSearch"
        @input="handleInput"
      />
    </div>
    
    <div class="content">
      <!-- 用户列表 -->
      <div class="user-list-section">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadMore"
        >
          <van-cell
            v-for="user in userList"
            :key="user.id"
            :title="user.name"
            :value="user.department"
            @click="selectUser(user)"
            :class="{ 'selected': selectedUser?.id === user.id }"
          >
            <template #left>
              <div class="user-avatar">
                <img :src="user.avatar || 'https://via.placeholder.com/50'" :alt="user.name" />
              </div>
            </template>
            <template #right>
              <van-checkbox 
                v-model="selectedUserId" 
                :name="user.id"
                @change="(value) => handleCheckboxChange(value, user)"
              />
            </template>
          </van-cell>
        </van-list>
      </div>
    </div>
    
    <div v-if="selectedUser" class="selected-section">
      <div class="selected-info">
        <span class="selected-label">已选择：</span>
        <span class="selected-name">{{ selectedUser.name }}</span>
      </div>
    </div>
    
    <div class="confirm-section">
      <van-button 
        type="primary" 
        block 
        :disabled="!selectedUser"
        @click="confirmSelection"
        class="confirm-btn"
      >
        确认选择
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { VanSearch, VanList, VanCell, VanCheckbox, VanButton } from 'vant';
import DxxHeader from '@/components/DxxHeader.vue';

const router = useRouter();
const route = useRoute();

const searchValue = ref('');
const userList = ref([]);
const selectedUser = ref(null);
const selectedUserId = ref(null);
const loading = ref(false);
const finished = ref(false);
const page = ref(1);

// 来源页面
const from = ref(route.query.from || '');

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
  loading.value = true;
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 实际项目中这里应该调用真实的用户列表API
  // const response = await api.getUsers({ page: page.value, search: searchValue.value });
  // userList.value = response.data;
  
  // 使用模拟数据
  userList.value = mockUserList;
  finished.value = true;
  loading.value = false;
};

// 加载更多
const loadMore = () => {
  if (finished.value) return;
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

// 处理输入
const handleInput = (value) => {
  searchValue.value = value;
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
    if (from.value === 'issue-card') {
      // 跳回发卡页面，并传递选择的用户信息
      router.push({
        path: '/issue-card',
        query: {
          cardType: route.query.cardType || '',
          cardName: route.query.cardName || '',
          recipient: selectedUser.value.name
        }
      });
    } else if (from.value === 'send-card') {
      // 跳回发送卡片页面
      sessionStorage.setItem('selectedFriend', JSON.stringify(selectedUser.value));
      router.push('/send-card/confirm');
    } else {
      // 其他来源，返回上一页
      router.back();
    }
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
  padding-bottom: 80px;
}

.search-box {
  margin: 16px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.content {
  flex: 1;
}

.user-list-section {
  background-color: white;
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selected {
  background-color: #f0f7ff;
}

.selected-section {
  margin: 16px;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-info {
  display: flex;
  align-items: center;
}

.selected-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.selected-name {
  font-size: 14px;
  font-weight: 500;
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
}

.confirm-btn {
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
}
</style>