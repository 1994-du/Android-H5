<template>
  <div class="user-select-page">
    <div class="page-header">
      <h1>选人页面</h1>
    </div>
    
    <div class="search-box">
      <van-search
        v-model="searchValue"
        placeholder="搜索"
        @search="handleSearch"
        @input="handleInput"
      />
    </div>
    
    <div class="tabs">
      <van-button
        v-for="tab in tabs"
        :key="tab.value"
        :type="activeTab === tab.value ? 'primary' : 'default'"
        @click="handleTabChange(tab.value)"
        class="tab-button"
      >
        {{ tab.label }}
      </van-button>
    </div>
    
    <div class="content">
      <!-- 树形组件 -->
      <div v-if="!isSearching && !isOfficeSelected" class="tree-section">
        <h3>树形组件</h3>
        <TreeSelect
          :multiple="multiple"
          :treeData="treeData"
          @select="handleTreeSelect"
        />
      </div>
      
      <!-- 列表组件 -->
      <div v-else class="list-section">
        <h3>列表组件</h3>
        <ListSelect
          :multiple="multiple"
          :listData="filteredListData"
          @select="handleListSelect"
        />
      </div>
    </div>
    
    <div class="control-section">
      <van-switch v-model="multiple" @change="handleMultipleChange">
        {{ multiple ? '多选' : '单选' }}
      </van-switch>
    </div>
    
    <div class="selected-section">
      <h3>已选择</h3>
      <div v-if="selectedItems.length > 0" class="selected-list">
        <van-tag
          v-for="item in selectedItems"
          :key="item"
          closable
          @close="handleRemove(item)"
        >
          {{ getItemName(item) }}
        </van-tag>
      </div>
      <div v-else class="empty-selected">
        暂无选择
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import TreeSelect from '../components/TreeSelect.vue';
import ListSelect from '../components/ListSelect.vue';

const router = useRouter();
const route = useRoute();

const activeTab = ref('org');
const searchValue = ref('');
const multiple = ref(false);
const selectedItems = ref([]);
const isSearching = ref(false);
const isOfficeSelected = ref(false);

// 来源页面
const from = ref(route.query.from || '');

// 处理选择完成
const handleSelectComplete = () => {
  if (from.value === 'issue-card' && selectedItems.value.length > 0) {
    // 跳回发卡页面，并传递选择的用户信息
    router.push({
      path: '/issue-card',
      query: {
        cardType: route.query.cardType || '',
        cardName: route.query.cardName || '',
        recipient: selectedItems.value[0]
      }
    });
  }
};

// 标签数据
const tabs = [
  { value: 'org', label: '组织架构' },
  { value: 'dept', label: '部门' },
  { value: 'office', label: '科室' }
];

// 模拟树形数据
const treeData = ref([
  {
    id: '1',
    orgId: '1',
    name: '总公司',
    isLeaf: 0,
    children: []
  },
  {
    id: '2',
    orgId: '2',
    name: '分公司',
    isLeaf: 0,
    children: []
  },
  {
    id: '3',
    orgId: '3',
    name: '子公司',
    isLeaf: 0,
    children: []
  }
]);

// 模拟列表数据
const listData = ref([
  { id: 'user1', name: '用户1' },
  { id: 'user2', name: '用户2' },
  { id: 'user3', name: '用户3' },
  { id: 'user4', name: '用户4' },
  { id: 'user5', name: '用户5' },
  { id: 'user6', name: '用户6' },
  { id: 'user7', name: '用户7' },
  { id: 'user8', name: '用户8' },
  { id: 'user9', name: '用户9' },
  { id: 'user10', name: '用户10' }
]);

// 过滤后的列表数据
const filteredListData = computed(() => {
  if (!searchValue.value) {
    return listData.value;
  }
  return listData.value.filter(item => 
    item.name.toLowerCase().includes(searchValue.value.toLowerCase())
  );
});

// 获取用户名称
const getItemName = (id) => {
  const user = listData.value.find(item => item.id === id);
  return user ? user.name : id;
};

// 处理标签切换
const handleTabChange = (value) => {
  activeTab.value = value;
  isSearching.value = false;
  searchValue.value = '';
  // 切换到科室标签时显示列表组件
  isOfficeSelected.value = value === 'office';
};

// 处理科室点击
const handleOfficeClick = () => {
  // 不再切换到列表组件，叶子节点会在当前结构显示人员
};

// 处理搜索
const handleSearch = (value) => {
  searchValue.value = value;
  isSearching.value = true;
};

// 处理输入
const handleInput = (value) => {
  searchValue.value = value;
  isSearching.value = value !== '';
};

// 处理树形组件选择
const handleTreeSelect = (value) => {
  if (multiple.value) {
    selectedItems.value = [...new Set([...selectedItems.value, ...value])];
  } else {
    selectedItems.value = [value];
    // 单选模式下，选择后自动完成
    handleSelectComplete();
  }
};

// 处理列表组件选择
const handleListSelect = (value) => {
  if (multiple.value) {
    selectedItems.value = [...new Set([...selectedItems.value, ...value])];
  } else {
    selectedItems.value = [value];
    // 单选模式下，选择后自动完成
    handleSelectComplete();
  }
};

// 处理单选/多选切换
const handleMultipleChange = (value) => {
  multiple.value = value;
  if (!value) {
    // 切换到单选模式时，只保留第一个选择
    if (selectedItems.value.length > 1) {
      selectedItems.value = [selectedItems.value[0]];
    }
  }
};

// 处理移除选择
const handleRemove = (item) => {
  selectedItems.value = selectedItems.value.filter(id => id !== item);
};
</script>

<style scoped>
.user-select-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.search-box {
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-button {
  flex: 1;
}

.content {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.tree-section,
.list-section {
  flex: 1;
}

.tree-section h3,
.list-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.control-section {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-section {
  margin-top: 20px;
}

.selected-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.empty-selected {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
  color: #909399;
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
  }
  
  .tree-section,
  .list-section {
    width: 100%;
  }
}
</style>