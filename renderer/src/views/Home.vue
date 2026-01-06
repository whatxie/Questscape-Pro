<template>
  <div class="home-container">
    <!-- 侧边导航栏 -->
    <aside class="sidebar">
      <div class="nav-menu">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/question-bank" class="nav-item" :class="{ active: $route.path === '/question-bank' }">
          <el-icon><FolderOpened /></el-icon>
          <span>题库管理</span>
        </router-link>
        <router-link to="/practice" class="nav-item" :class="{ active: $route.path === '/practice' }">
          <el-icon><EditPen /></el-icon>
          <span>开始刷题</span>
        </router-link>
        <router-link to="/exam" class="nav-item" :class="{ active: $route.path === '/exam' }">
          <el-icon><Timer /></el-icon>
          <span>模拟考试</span>
        </router-link>
        <router-link to="/wrong-questions" class="nav-item" :class="{ active: $route.path === '/wrong-questions' }">
          <el-icon><WarningFilled /></el-icon>
          <span>错题本</span>
        </router-link>
        <router-link to="/statistics" class="nav-item" :class="{ active: $route.path === '/statistics' }">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </router-link>
        <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </router-link>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 欢迎区域 -->
        <div class="welcome-section glass-card">
          <div class="welcome-info">
            <h1 class="welcome-title">欢迎使用题境随行</h1>
            <p class="welcome-desc">专注学习，高效刷题，让知识尽在掌握</p>
          </div>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="$router.push('/practice')">
              <el-icon><EditPen /></el-icon>
              立即刷题
            </el-button>
            <el-button size="large" @click="$router.push('/question-bank')">
              <el-icon><FolderOpened /></el-icon>
              管理题库
            </el-button>
          </div>
        </div>

        <!-- 统计数据卡片 -->
        <div class="stats-section">
          <div class="stat-card glass-card" v-for="stat in stats" :key="stat.label">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- 最近操作 -->
        <div class="recent-section glass-card">
          <div class="section-header">
            <h3>最近练习</h3>
            <el-button text type="primary" @click="$router.push('/practice')">查看全部</el-button>
          </div>
          <div class="recent-list" v-if="recentPractices.length > 0">
            <div class="recent-item" v-for="(item, index) in recentPractices" :key="index">
              <div class="recent-info">
                <span class="recent-title">{{ item.title }}</span>
                <span class="recent-time">{{ item.time }}</span>
              </div>
              <div class="recent-stats">
                <span class="correct-rate">{{ item.correctRate }}%</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无练习记录" />
        </div>

        <!-- 功能特性 -->
        <div class="features-section">
          <div class="feature-card glass-card" v-for="feature in features" :key="feature.title">
            <div class="feature-icon">
              <el-icon :size="32" :color="feature.color"><component :is="feature.icon" /></el-icon>
            </div>
            <h4 class="feature-title">{{ feature.title }}</h4>
            <p class="feature-desc">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { HomeFilled, FolderOpened, EditPen, Timer, WarningFilled, DataAnalysis, Setting } from '@element-plus/icons-vue';
import { usePracticeStore } from '../stores/practice';

const practiceStore = usePracticeStore();

const stats = ref([
  { label: '题库总数', value: 0, icon: 'FolderOpened', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: '已练习题数', value: 0, icon: 'EditPen', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: '正确率', value: 0, icon: 'DataAnalysis', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: '错题数量', value: 0, icon: 'WarningFilled', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
]);

const recentPractices = ref([]);
const features = ref([
  { title: 'Excel批量导入', desc: '支持Excel模板快速导入题库', icon: 'FolderOpened', color: '#409eff' },
  { title: '多种刷题模式', desc: '顺序刷题、随机刷题、模拟考试', icon: 'Timer', color: '#67c23a' },
  { title: '智能错题本', desc: '自动记录错题，针对性复习', icon: 'WarningFilled', color: '#e6a23c' },
  { title: '数据统计', desc: '详细的学习数据统计分析', icon: 'DataAnalysis', color: '#909399' }
]);

onMounted(async () => {
  await loadStats();
});

const loadStats = async () => {
  try {
    const questionCount = await practiceStore.getQuestionCount();
    const practiceCount = await practiceStore.getPracticeCount();
    const wrongCount = await practiceStore.getWrongCount();
    const accuracy = practiceCount > 0 ? await practiceStore.getAccuracy() : 0;
    
    stats.value[0].value = questionCount;
    stats.value[1].value = practiceCount;
    stats.value[2].value = accuracy.toFixed(1);
    stats.value[3].value = wrongCount;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};
</script>

<style lang="scss" scoped>
.home-container {
  display: flex;
  height: 100%;
  padding: 20px;
  gap: 20px;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
  
  .nav-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.3s ease;
    
    .el-icon {
      font-size: 20px;
    }
    
    span {
      font-size: 14px;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    
    &.active {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(103, 194, 255, 0.3));
      color: #ffffff;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        width: 4px;
        height: 60%;
        background: #409eff;
        border-radius: 0 4px 4px 0;
      }
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  
  .content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px;
  
  .welcome-title {
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 8px;
  }
  
  .welcome-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .quick-actions {
    display: flex;
    gap: 16px;
  }
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #ffffff;
    }
    
    .stat-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

.recent-section {
  padding: 24px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
    }
  }
  
  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .recent-title {
      font-size: 14px;
      color: #ffffff;
    }
    
    .recent-time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      margin-left: 12px;
    }
    
    .correct-rate {
      font-size: 14px;
      font-weight: 500;
      color: #67c23a;
    }
  }
}

.features-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  .feature-card {
    padding: 24px;
    text-align: center;
    
    .feature-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .feature-title {
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 8px;
    }
    
    .feature-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;
    }
  }
}
</style>