<template>
  <el-config-provider :locale="locale">
    <div class="app-container">
      <!-- 自定义标题栏 -->
      <title-bar @minimize="minimize" @maximize="maximize" @close="close" />
      
      <!-- 主内容区 -->
      <div class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref } from 'vue';
import titleBar from './components/TitleBar.vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const locale = ref(zhCn);
const isMaximized = ref(false);

const minimize = () => window.electronAPI?.minimize?.();
const maximize = () => {
  window.electronAPI?.maximize?.();
  isMaximized.value = !isMaximized.value;
};
const close = () => window.electronAPI?.close?.();
</script>

<style lang="scss">
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>