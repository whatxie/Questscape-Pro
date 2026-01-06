<template>
  <div class="title-bar" :class="{ maximized: isMaximized }">
    <div class="drag-area">
      <span class="title">{{ title }}</span>
    </div>
    
    <div class="window-controls">
      <el-button class="control-btn" @click="handleMinimize" circle size="small">
        <el-icon><Minus /></el-icon>
      </el-button>
      <el-button class="control-btn" @click="handleMaximize" circle size="small">
        <el-icon><FullScreen v-if="!isMaximized" /><CopyDocument v-else /></el-icon>
      </el-button>
      <el-button class="control-btn close-btn" @click="handleClose" circle size="small">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Minus, Close, FullScreen, CopyDocument } from '@element-plus/icons-vue';

defineProps({
  title: {
    type: String,
    default: '题境随行'
  }
});

const emit = defineEmits(['minimize', 'maximize', 'close']);

const isMaximized = ref(false);

const handleMinimize = () => emit('minimize');
const handleMaximize = () => {
  emit('maximize');
  isMaximized.value = !isMaximized.value;
};
const handleClose = () => emit('close');
</script>

<style lang="scss" scoped>
.title-bar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(30px);
  -webkit-app-region: drag;
  user-select: none;
  
  &.maximized {
    border-radius: 0;
  }
}

.drag-area {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .title {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
  
  .control-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    
    &.close-btn:hover {
      background: #f56c6c;
      color: #ffffff;
    }
  }
}
</style>