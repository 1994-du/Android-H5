<template>
  <div class="list-select">
    <van-search
      v-model="searchValue"
      placeholder="搜索"
      @search="handleSearch"
      @input="handleInput"
    />
    <div class="list-content">
      <van-checkbox-group v-model="selectedItems" @change="handleSelect">
        <van-cell-group>
          <van-cell
            v-for="item in filteredItems"
            :key="item.id"
            :title="item.name"
            :value="item.id"
          >
            <template #right>
              <van-checkbox
                v-if="multiple"
                :name="item.id"
              />
              <van-radio
                v-else
                :name="item.id"
                :checked="selectedItems.includes(item.id)"
                @click.stop="handleRadioSelect(item.id)"
              />
            </template>
          </van-cell>
        </van-cell-group>
      </van-checkbox-group>
      <div v-if="filteredItems.length === 0" class="empty">
        <van-empty description="暂无数据" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  listData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select']);

const searchValue = ref('');
const selectedItems = ref([]);

const filteredItems = computed(() => {
  if (!searchValue.value) {
    return props.listData;
  }
  return props.listData.filter(item => 
    item.name.toLowerCase().includes(searchValue.value.toLowerCase())
  );
});

const handleSearch = (value) => {
  // 搜索逻辑已在 computed 中处理
};

const handleInput = (value) => {
  // 输入逻辑已在 computed 中处理
};

const handleSelect = (values) => {
  if (props.multiple) {
    emit('select', values);
  }
};

const handleRadioSelect = (value) => {
  if (!props.multiple) {
    selectedItems.value = [value];
    emit('select', value);
  }
};
</script>

<style scoped>
.list-select {
  width: 100%;
  height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.empty {
  padding: 40px 0;
  text-align: center;
}
</style>