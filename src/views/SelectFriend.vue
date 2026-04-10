<template>
  <div class="select-friend-container">
    <DxxHeader title="选择好友" />
    
    <!-- 搜索框 -->
    <van-search
      v-model="searchQuery"
      placeholder="搜索好友"
      class="search-bar"
    />
    
    <!-- 好友列表 - 使用折叠面板 -->
    <div class="friend-list">
      <van-collapse v-model="activeNames">
        <van-collapse-item 
          v-for="(group, key) in groupedFriends" 
          :key="key"
          :name="key"
        >
          <template #title>
            <div class="group-title">{{ key }}</div>
          </template>
          <div class="group-content">
            <div 
              v-for="friend in group" 
              :key="friend.id"
              class="friend-item"
              @click="selectFriend(friend)"
            >
              <div class="friend-avatar">
                <img :src="friend.avatar" :alt="friend.name" />
              </div>
              <div class="friend-info">
                <div class="friend-name">{{ friend.name }}</div>
              </div>
              <van-checkbox 
                v-model="selectedFriendId" 
                :name="friend.id"
                @change="(value) => handleCheckboxChange(value, friend)"
                class="friend-checkbox"
              />
            </div>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>
    
    <!-- 确认按钮 -->
    <div class="confirm-section">
      <van-button 
        type="primary" 
        block 
        :disabled="!selectedFriend"
        @click="confirmFriend"
        class="confirm-btn"
      >
        确认选择
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { VanSearch, VanCollapse, VanCollapseItem, VanCheckbox, VanButton } from 'vant';
import DxxHeader from '@/components/DxxHeader.vue';

const router = useRouter();
const friends = ref([]);
const selectedFriend = ref(null);
const selectedFriendId = ref(null);
const searchQuery = ref('');
const activeNames = ref([]);

// 模拟好友数据
const mockFriends = [
  { id: 1, name: '张三', avatar: 'https://via.placeholder.com/50' },
  { id: 2, name: '李四', avatar: 'https://via.placeholder.com/50' },
  { id: 3, name: '王五', avatar: 'https://via.placeholder.com/50' },
  { id: 4, name: '赵六', avatar: 'https://via.placeholder.com/50' },
  { id: 5, name: '钱七', avatar: 'https://via.placeholder.com/50' },
  { id: 6, name: '孙八', avatar: 'https://via.placeholder.com/50' },
  { id: 7, name: '周九', avatar: 'https://via.placeholder.com/50' },
  { id: 8, name: '吴十', avatar: 'https://via.placeholder.com/50' }
];

onMounted(() => {
  // 实际项目中这里应该调用 API 获取好友列表
  friends.value = mockFriends;
  // 默认展开所有分组
  activeNames.value = Object.keys(groupedFriends.value);
});

// 过滤好友列表
const filteredFriends = computed(() => {
  if (!searchQuery.value) {
    return friends.value;
  }
  return friends.value.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 按首字母分组好友
const groupedFriends = computed(() => {
  const groups = {};
  filteredFriends.value.forEach(friend => {
    // 获取首字母
    const firstLetter = friend.name.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(friend);
  });
  return groups;
});

const selectFriend = (friend) => {
  selectedFriend.value = friend;
  selectedFriendId.value = friend.id;
};

const handleCheckboxChange = (value, friend) => {
  if (value) {
    selectedFriend.value = friend;
  } else {
    selectedFriend.value = null;
  }
};

const confirmFriend = () => {
  if (selectedFriend.value) {
    // 存储选中的好友信息到会话存储
    sessionStorage.setItem('selectedFriend', JSON.stringify(selectedFriend.value));
    router.push('/send-card/confirm');
  }
};
</script>

<style scoped>
.select-friend-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.search-bar {
  margin: 16px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.friend-list {
  margin: 0 16px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.group-content {
  padding: 8px 0;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.friend-item:hover {
  background-color: #f9f9f9;
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.friend-checkbox {
  --van-checkbox-size: 20px;
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