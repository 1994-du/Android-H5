<template>
  <div class="tree-select">
    <div class="tree-content">
      <div
        v-for="item in treeData"
        :key="item.id"
        class="tree-node"
      >
        <div class="tree-node-header" @click="handleToggleExpand(item)">
          <span v-if="!item.isLeaf" class="expand-icon">
            {{ item.expanded ? '▼' : '▶' }}
          </span>
          <span v-else class="leaf-icon">•</span>
          {{ item.name }}
          <van-loading v-if="loadingNode === item.id" size="16px" />
        </div>
        <div v-if="item.expanded && !item.isLeaf" class="tree-node-children">
          <div
            v-for="child in item.children"
            :key="child.id"
            class="tree-node"
          >
            <div class="tree-node-header" @click="handleToggleExpand(child)">
              <span v-if="!child.isLeaf" class="expand-icon">
                {{ child.expanded ? '▼' : '▶' }}
              </span>
              <span v-else class="leaf-icon">•</span>
              {{ child.name }}
              <van-loading v-if="loadingNode === child.id" size="16px" />
            </div>
            <div v-if="child.expanded && !child.isLeaf" class="tree-node-children">
              <div
                v-for="grandchild in child.children"
                :key="grandchild.id"
                class="tree-node"
              >
                <div class="tree-node-header" @click="handleToggleExpand(grandchild)">
                  <span v-if="!grandchild.isLeaf" class="expand-icon">
                    {{ grandchild.expanded ? '▼' : '▶' }}
                  </span>
                  <span v-else class="leaf-icon">•</span>
                  {{ grandchild.name }}
                  <van-loading v-if="loadingNode === grandchild.id" size="16px" />
                </div>
                <div v-if="grandchild.isLeaf" class="tree-node-children">
                  <div class="leaf-node" @click="handleNodeClick(grandchild)">
                    点击查看人员
                  </div>
                </div>
              </div>
            </div>
            <div v-if="child.isLeaf" class="tree-node-children">
              <div v-if="!child.expanded || !child.users" class="leaf-node" @click="handleNodeClick(child)">
                点击查看人员
              </div>
              <div v-else class="user-list">
                <van-checkbox-group v-model="selectedLeafItems" @change="handleLeafSelect">
                  <div
                    v-for="user in child.users"
                    :key="user.id"
                    class="user-item"
                  >
                    <van-checkbox
                      v-if="multiple"
                      :name="user.id"
                    />
                    <van-radio
                      v-else
                      :name="user.id"
                      :checked="selectedLeafItems.includes(user.id)"
                      @click.stop="handleRadioSelect(user.id)"
                    />
                    <span class="user-name">{{ user.name }}</span>
                  </div>
                </van-checkbox-group>
              </div>
            </div>
          </div>
        </div>
        <div v-if="item.isLeaf" class="tree-node-children">
          <div v-if="!item.expanded || !item.users" class="leaf-node" @click="handleNodeClick(item)">
            点击查看人员
          </div>
          <div v-else class="user-list">
            <van-checkbox-group v-model="selectedLeafItems" @change="handleLeafSelect">
              <div
                v-for="user in item.users"
                :key="user.id"
                class="user-item"
              >
                <van-checkbox
                  v-if="multiple"
                  :name="user.id"
                />
                <van-radio
                  v-else
                  :name="user.id"
                  :checked="selectedLeafItems.includes(user.id)"
                  @click.stop="handleRadioSelect(user.id)"
                />
                <span class="user-name">{{ user.name }}</span>
              </div>
            </van-checkbox-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  treeData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select']);

const selectedLeafItems = ref([]);
const loadingNode = ref(null);

// 模拟获取子组织架构数据
const fetchChildren = async (item) => {
  loadingNode.value = item.id;
  // 模拟接口请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  // 模拟返回数据
  item.children = [
    {
      id: `${item.id}-1`,
      orgId: `${item.orgId || item.id}-1`,
      name: `${item.name} - 子组织 1`,
      isLeaf: 0,
      expanded: false,
      children: []
    },
    {
      id: `${item.id}-2`,
      orgId: `${item.orgId || item.id}-2`,
      name: `${item.name} - 子组织 2`,
      isLeaf: 0,
      expanded: false,
      children: []
    },
    {
      id: `${item.id}-3`,
      orgId: `${item.orgId || item.id}-3`,
      name: `${item.name} - 子组织 3`,
      isLeaf: 1,
      expanded: false,
      children: []
    }
  ];
  loadingNode.value = null;
};

// 模拟获取人员数据
const fetchUsers = async (item) => {
  loadingNode.value = item.id;
  // 模拟接口请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  // 模拟返回数据
  item.users = [
    { id: `user-${item.orgId || item.id}-1`, name: `用户 ${item.name} 1` },
    { id: `user-${item.orgId || item.id}-2`, name: `用户 ${item.name} 2` },
    { id: `user-${item.orgId || item.id}-3`, name: `用户 ${item.name} 3` }
  ];
  loadingNode.value = null;
  // 不再触发 office-click 事件
};

// 处理展开/折叠
const handleToggleExpand = async (item) => {
  if (!item.expanded && item.isLeaf !== 1) {
    if (!item.children || item.children.length === 0) {
      await fetchChildren(item);
    }
  }
  item.expanded = !item.expanded;
};

// 处理节点点击
const handleNodeClick = async (item) => {
  if (item.isLeaf === 1) {
    if (!item.users) {
      await fetchUsers(item);
    }
    item.expanded = !item.expanded;
  }
};

// 处理选择
const handleSelect = (value) => {
  if (props.multiple) {
    emit('select', value);
  } else {
    emit('select', value);
  }
};

// 处理 office-click
const handleOfficeClick = (node) => {
  selectedNode.value = node;
  selectedLeafItems.value = [];
  emit('office-click');
};

// 处理叶子节点选择
const handleLeafSelect = (values) => {
  if (props.multiple) {
    emit('select', values);
  }
};

// 处理单选
const handleRadioSelect = (value) => {
  if (!props.multiple) {
    selectedLeafItems.value = [value];
    emit('select', value);
  }
};
</script>

<style scoped>
.tree-select {
  width: 100%;
  height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.tree-content {
  padding: 10px;
  overflow-y: auto;
  max-height: 350px;
}

.tree-node {
  margin-bottom: 5px;
}

.tree-node-header {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.tree-node-header:hover {
  background-color: #f5f7fa;
}

.expand-icon {
  margin-right: 8px;
  font-size: 12px;
  color: #909399;
}

.leaf-icon {
  margin-right: 8px;
  font-size: 12px;
  color: #67c23a;
}

.tree-node-children {
  margin-left: 20px;
  margin-top: 5px;
}

.leaf-node {
  padding: 10px;
  color: #409eff;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ecf5ff;
  }
}

.user-list {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-top: 5px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.user-name {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

.leaf-content {
  padding: 10px;
  border-top: 1px solid #e4e7ed;
}

.leaf-title {
  font-weight: bold;
  margin-bottom: 10px;
}
</style>