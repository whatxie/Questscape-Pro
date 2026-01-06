<template>
  <div class="statistics-container">
    <!-- 侧边栏 -->
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
        <!-- 概览统计 -->
        <div class="overview-section">
          <div class="overview-card glass-card" v-for="stat in overviewStats" :key="stat.label">
            <div class="stat-icon" :style="{ background: stat.gradient }">
              <el-icon :size="28"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- 正确率趋势 -->
        <div class="chart-section glass-card">
          <div class="section-header">
            <h3>正确率趋势</h3>
            <el-select v-model="timeRange" size="small" style="width: 120px">
              <el-option label="最近7天" value="7" />
              <el-option label="最近30天" value="30" />
              <el-option label="最近90天" value="90" />
            </el-select>
          </div>
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon :size="64" color="rgba(255,255,255,0.2)"><DataAnalysis /></el-icon>
              <p>正确率趋势图表</p>
            </div>
          </div>
        </div>

        <!-- 薄弱知识点分析 -->
        <div class="weak-points-section glass-card">
          <div class="section-header">
            <h3>薄弱知识点分析</h3>
          </div>
          <div class="weak-points-list">
            <div 
              class="weak-point-item" 
              v-for="(point, idx) in weakKnowledgePoints" 
              :key="idx"
            >
              <div class="point-info">
                <span class="point-name">{{ point.name }}</span>
                <span class="point-count">{{ point.wrongCount }} 题错</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: point.rate + '%' }"></div>
              </div>
              <span class="point-rate">{{ point.rate }}%</span>
            </div>
          </div>
          <el-empty v-if="weakKnowledgePoints.length === 0" description="暂无薄弱知识点数据" :image-size="100" />
        </div>

        <!-- 练习历史 -->
        <div class="history-section glass-card">
          <div class="section-header">
            <h3>练习历史</h3>
            <el-button size="small" @click="exportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
          <div class="history-table">
            <el-table :data="practiceHistory" style="width: 100%" size="small">
              <el-table-column prop="date" label="日期" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="mode" label="模式" width="100">
                <template #default="{ row }">
                  {{ getModeText(row.mode) }}
                </template>
              </el-table-column>
              <el-table-column prop="totalCount" label="题数" width="80" />
              <el-table-column prop="correctCount" label="正确" width="80" />
              <el-table-column prop="wrongCount" label="错误" width="80" />
              <el-table-column prop="accuracy" label="正确率" width="100">
                <template #default="{ row }">
                  <span :class="{ 'text-success': row.accuracy >= 60, 'text-danger': row.accuracy < 60 }">
                    {{ row.accuracy }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="用时" width="100">
                <template #default="{ row }">
                  {{ formatDuration(row.duration) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 题型分布 -->
        <div class="distribution-section glass-card">
          <div class="section-header">
            <h3>题型分布</h3>
          </div>
          <div class="distribution-grid">
            <div 
              class="distribution-item" 
              v-for="(dist, type) in typeDistribution" 
              :key="type"
            >
              <div class="dist-icon" :style="{ background: dist.color }">
                {{ dist.count }}
              </div>
              <span class="dist-label">{{ getTypeText(type) }}</span>
              <span class="dist-rate">{{ dist.rate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  HomeFilled, FolderOpened, EditPen, Timer, WarningFilled, DataAnalysis, Setting,
  Download, Trophy
} from '@element-plus/icons-vue';
import { usePracticeStore } from '../stores/practice';

const practiceStore = usePracticeStore();

// 概览统计数据
const overviewStats = ref([
  { label: '练习次数', value: 0, icon: 'Collection', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: '总答题数', value: 0, icon: 'EditPen', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: '正确率', value: '0%', icon: 'Trophy', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: '错题数', value: 0, icon: 'Warning', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
]);

// 时间范围
const timeRange = ref('30');

// 练习历史
const practiceHistory = ref([]);

// 薄弱知识点
const weakKnowledgePoints = ref([]);

// 题型分布
const typeDistribution = ref({});

// 生命周期
onMounted(async () => {
  await loadStatistics();
});

// 加载统计数据
const loadStatistics = async () => {
  try {
    const stats = await practiceStore.getStats();
    
    overviewStats.value[0].value = stats.totalPractices;
    overviewStats.value[1].value = stats.totalQuestions;
    overviewStats.value[2].value = stats.accuracy + '%';
    overviewStats.value[3].value = stats.totalWrong;
    
    // 加载练习历史
    const records = await loadPracticeHistory();
    practiceHistory.value = records;
    
    // 分析薄弱知识点
    analyzeWeakPoints();
    
    // 分析题型分布
    analyzeTypeDistribution();
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载练习历史
const loadPracticeHistory = async () => {
  // 从 practice store 获取
  return practiceStore.practiceRecords.slice(-20).reverse();
};

// 分析薄弱知识点
const analyzeWeakPoints = () => {
  const wrongQuestions = practiceStore.wrongQuestions;
  const knowledgeCount = {};
  
  wrongQuestions.forEach(q => {
    const key = q.knowledgePoint || '未分类';
    if (!knowledgeCount[key]) {
      knowledgeCount[key] = { count: 0, wrongCount: 0 };
    }
    knowledgeCount[key].count++;
    knowledgeCount[key].wrongCount += (q.wrongCount || 1);
  });
  
  weakKnowledgePoints.value = Object.entries(knowledgeCount)
    .map(([name, data]) => ({
      name,
      count: data.count,
      wrongCount: data.wrongCount,
      rate: Math.round((data.wrongCount / (wrongQuestions.length || 1)) * 100)
    }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);
};

// 分析题型分布
const analyzeTypeDistribution = () => {
  const records = practiceStore.practiceRecords;
  const total = records.reduce((sum, r) => sum + r.totalCount, 0) || 1;
  
  typeDistribution.value = {
    choice: { count: Math.round(total * 0.7), rate: 70, color: 'linear-gradient(135deg, #409eff, #67c2ff)' },
    'true-false': { count: Math.round(total * 0.2), rate: 20, color: 'linear-gradient(135deg, #67c23a, #95de64)' },
    fill: { count: Math.round(total * 0.08), rate: 8, color: 'linear-gradient(135deg, #e6a23c, #fcd34d)' },
    'short-answer': { count: Math.round(total * 0.02), rate: 2, color: 'linear-gradient(135deg, #909399, #b1b3b8)' }
  };
};

// 导出数据
const exportData = async () => {
  try {
    const exportData = practiceHistory.value.map((r, idx) => ({
      '序号': idx + 1,
      '日期': formatDate(r.date),
      '模式': getModeText(r.mode),
      '题数': r.totalCount,
      '正确数': r.correctCount,
      '错误数': r.wrongCount,
      '正确率': r.accuracy + '%',
      '用时': formatDuration(r.duration)
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '练习历史');
    
    const defaultPath = window.electronAPI?.getDesktopPath?.() || '';
    const filePath = `${defaultPath}/练习数据_${Date.now()}.xlsx`;
    
    XLSX.writeFile(wb, filePath);
    ElMessage.success(`数据已导出至: ${filePath}`);
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 格式化时长
const formatDuration = (ms) => {
  if (!ms) return '0秒';
  const seconds = Math.round(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
};

// 获取模式文本
const getModeText = (mode) => {
  const texts = { sequence: '顺序刷题', random: '随机刷题', exam: '模拟考试', wrong: '错题重刷' };
  return texts[mode] || mode;
};

// 获取题型文本
const getTypeText = (type) => {
  const texts = { choice: '选择题', 'true-false': '判断题', fill: '填空题', 'short-answer': '简答题' };
  return texts[type] || type;
};
</script>

<style lang="scss" scoped>
.statistics-container {
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
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    
    &.active {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(103, 194, 255, 0.3));
      color: #ffffff;
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

.overview-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  .overview-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: #ffffff;
    }
    
    .stat-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

.chart-section, .weak-points-section, .history-section, .distribution-section {
  padding: 24px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
    }
  }
}

.chart-container {
  height: 200px;
  
  .chart-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    p {
      margin-top: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

.weak-points-list {
  .weak-point-item {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    
    .point-info {
      min-width: 120px;
      
      .point-name {
        display: block;
        font-size: 14px;
        color: #ffffff;
      }
      
      .point-count {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
    
    .progress-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f56c6c, #e6a23c);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
    }
    
    .point-rate {
      min-width: 50px;
      text-align: right;
      font-size: 14px;
      font-weight: 500;
      color: #f56c6c;
    }
  }
}

.history-table {
  :deep(.el-table) {
    background: transparent;
    
    .el-table__header-wrapper th {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.8);
      border-bottom: none;
    }
    
    .el-table__body-wrapper {
      background: transparent;
      
      td {
        background: transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.8);
      }
      
      tr:hover td {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  }
  
  .text-success {
    color: #67c23a;
  }
  
  .text-danger {
    color: #f56c6c;
  }
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  .distribution-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    .dist-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .dist-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 4px;
    }
    
    .dist-rate {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}
</style>