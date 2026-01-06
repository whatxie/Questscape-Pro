<template>
  <div class="wrong-questions-container">
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
        <!-- 顶部操作栏 -->
        <div class="action-bar glass-card">
          <div class="action-left">
            <h2>错题本</h2>
            <span class="total-count">共 {{ groupedQuestions.length }} 个知识点，{{ totalWrongCount }} 道错题</span>
          </div>
          <div class="action-right">
            <el-button type="primary" @click="startReview" :disabled="wrongQuestions.length === 0">
              <el-icon><EditPen /></el-icon>
              复习错题
            </el-button>
            <el-button type="danger" @click="clearWrongQuestions">
              <el-icon><Delete /></el-icon>
              清空错题本
            </el-button>
            <el-button @click="exportWrongQuestions">
              <el-icon><Download /></el-icon>
              导出错题
            </el-button>
          </div>
        </div>

        <!-- 按知识点分类 -->
        <div class="knowledge-section" v-for="(questions, knowledge) in groupedQuestions" :key="knowledge">
          <div class="knowledge-header glass-card">
            <div class="knowledge-info">
              <el-icon class="knowledge-icon"><Folder /></el-icon>
              <span class="knowledge-name">{{ knowledge }}</span>
              <el-tag size="small">{{ questions.length }} 题</el-tag>
            </div>
            <el-button type="primary" size="small" @click="reviewKnowledge(knowledge)">
              复习此知识点
            </el-button>
          </div>
          
          <div class="question-list">
            <div 
              class="question-item glass-card" 
              v-for="(q, idx) in questions" 
              :key="q.id"
              @click="viewQuestionDetail(q)"
            >
              <div class="question-index">{{ idx + 1 }}</div>
              <div class="question-content">
                <p class="question-text">{{ q.content }}</p>
                <div class="question-meta">
                  <el-tag size="small">{{ getQuestionTypeText(q.type) }}</el-tag>
                  <span class="wrong-count">错误 {{ q.wrongCount || 1 }} 次</span>
                  <span class="last-time">最近错误: {{ formatTime(q.lastWrongTime) }}</span>
                </div>
              </div>
              <div class="question-actions">
                <el-button circle size="small" @click.stop="removeQuestion(q)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="wrongQuestions.length === 0" description="错题本是空的，继续加油！">
          <el-button type="primary" @click="$router.push('/practice')">开始刷题</el-button>
        </el-empty>
      </div>
    </main>

    <!-- 题目详情对话框 -->
    <el-dialog v-model="detailVisible" title="错题详情" width="700px">
      <div v-if="currentQuestion" class="detail-content">
        <div class="detail-header">
          <el-tag :type="getQuestionTypeTag(currentQuestion.type)">
            {{ getQuestionTypeText(currentQuestion.type) }}
          </el-tag>
          <span class="wrong-info">错误 {{ currentQuestion.wrongCount || 1 }} 次</span>
        </div>
        
        <div class="question-text">
          <h3>{{ currentQuestion.content }}</h3>
        </div>
        
        <div v-if="currentQuestion.options" class="options-display">
          <div 
            v-for="(opt, key) in currentQuestion.options" 
            :key="key"
            class="option-display"
            :class="{ correct: key === currentQuestion.answer }"
          >
            <span class="option-key">{{ key }}.</span>
            <span>{{ opt }}</span>
          </div>
        </div>
        
        <div class="answer-section">
          <p><strong>正确答案：</strong>{{ currentQuestion.answer }}</p>
          <p><strong>解析：</strong>{{ currentQuestion.explanation || '暂无解析' }}</p>
          <p v-if="currentQuestion.knowledgePoint"><strong>知识点：</strong>{{ currentQuestion.knowledgePoint }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="reviewThisQuestion">复习这道题</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  HomeFilled, FolderOpened, EditPen, Timer, WarningFilled, DataAnalysis, Setting,
  Folder, Delete, Download
} from '@element-plus/icons-vue';
import { usePracticeStore } from '../stores/practice';

const router = useRouter();
const practiceStore = usePracticeStore();

// 错题数据
const wrongQuestions = ref([]);
const groupedQuestions = ref({});
const totalWrongCount = ref(0);

// 详情弹窗
const detailVisible = ref(false);
const currentQuestion = ref(null);

// 生命周期
onMounted(async () => {
  await loadWrongQuestions();
});

// 加载错题
const loadWrongQuestions = async () => {
  try {
    wrongQuestions.value = await practiceStore.getAllWrongQuestions();
    groupQuestions();
    totalWrongCount.value = wrongQuestions.value.length;
  } catch (error) {
    console.error('加载错题失败:', error);
  }
};

// 分类错题
const groupQuestions = () => {
  const grouped = {};
  wrongQuestions.value.forEach(q => {
    const key = q.knowledgePoint || '未分类';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(q);
  });
  groupedQuestions.value = grouped;
};

// 查看题目详情
const viewQuestionDetail = (q) => {
  currentQuestion.value = q;
  detailVisible.value = true;
};

// 复习这道题
const reviewThisQuestion = () => {
  detailVisible.value = false;
  router.push({ path: '/practice', query: { questionId: currentQuestion.value.id } });
};

// 开始复习
const startReview = () => {
  router.push({ path: '/practice', query: { mode: 'wrong' } });
};

// 按知识点复习
const reviewKnowledge = (knowledge) => {
  router.push({ path: '/practice', query: { mode: 'wrong', knowledge } });
};

// 移除错题
const removeQuestion = async (q) => {
  try {
    await ElMessageBox.confirm('确定要从错题本移除这道题吗？', '提示', { type: 'warning' });
    await practiceStore.removeFromWrongQuestions(q.id);
    wrongQuestions.value = wrongQuestions.value.filter(item => item.id !== q.id);
    groupQuestions();
    totalWrongCount.value = wrongQuestions.value.length;
    ElMessage.success('已移除');
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('移除失败');
    }
  }
};

// 清空错题本
const clearWrongQuestions = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有错题吗？此操作不可恢复。', '警告', { type: 'warning' });
    await practiceStore.clearWrongQuestions();
    wrongQuestions.value = [];
    groupedQuestions.value = {};
    totalWrongCount.value = 0;
    ElMessage.success('错题本已清空');
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('清空失败');
    }
  }
};

// 导出错题
const exportWrongQuestions = async () => {
  if (wrongQuestions.value.length === 0) {
    ElMessage.warning('没有错题可导出');
    return;
  }
  
  try {
    const exportData = wrongQuestions.value.map((q, idx) => ({
      '序号': idx + 1,
      '题目内容': q.content,
      '题型': getQuestionTypeText(q.type),
      '选项A': q.options?.A || '',
      '选项B': q.options?.B || '',
      '选项C': q.options?.C || '',
      '选项D': q.options?.D || '',
      '正确答案': q.answer,
      '解析': q.explanation || '',
      '知识点': q.knowledgePoint || '',
      '错误次数': q.wrongCount || 1
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '错题本');
    
    const defaultPath = window.electronAPI?.getDesktopPath?.() || '';
    const filePath = `${defaultPath}/错题本_${Date.now()}.xlsx`;
    
    XLSX.writeFile(wb, filePath);
    ElMessage.success(`错题已导出至: ${filePath}`);
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '未知';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 获取题型文本
const getQuestionTypeText = (type) => {
  const texts = { 'choice': '选择题', 'true-false': '判断题', 'fill': '填空题', 'short-answer': '简答题' };
  return texts[type] || '未知';
};

// 获取题型标签
const getQuestionTypeTag = (type) => {
  const tags = { 'choice': '', 'true-false': 'success', 'fill': 'warning', 'short-answer': 'info' };
  return tags[type] || '';
};
</script>

<style lang="scss" scoped>
.wrong-questions-container {
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

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  
  .action-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    h2 {
      font-size: 20px;
      color: #ffffff;
      margin: 0;
    }
    
    .total-count {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .action-right {
    display: flex;
    gap: 12px;
  }
}

.knowledge-section {
  .knowledge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    margin-bottom: 16px;
    
    .knowledge-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .knowledge-icon {
        font-size: 20px;
        color: #e6a23c;
      }
      
      .knowledge-name {
        font-size: 16px;
        font-weight: 500;
        color: #ffffff;
      }
    }
  }
  
  .question-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .question-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    cursor: pointer;
    
    &:hover {
      .question-content {
        .question-text {
          color: #409eff;
        }
      }
    }
    
    .question-index {
      width: 32px;
      height: 32px;
      background: rgba(64, 158, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 500;
      color: #409eff;
      flex-shrink: 0;
    }
    
    .question-content {
      flex: 1;
      
      .question-text {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.6;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .question-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .wrong-count {
          font-size: 12px;
          color: #f56c6c;
        }
        
        .last-time {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }
}

.detail-content {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    
    .wrong-info {
      font-size: 14px;
      color: #f56c6c;
    }
  }
  
  .question-text {
    h3 {
      font-size: 18px;
      color: #ffffff;
      line-height: 1.6;
      margin-bottom: 24px;
    }
  }
  
  .options-display {
    margin-bottom: 24px;
    
    .option-display {
      padding: 12px 16px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      
      &.correct {
        background: rgba(103, 194, 58, 0.2);
        border: 1px solid rgba(103, 194, 58, 0.5);
      }
      
      .option-key {
        font-weight: 600;
        color: #409eff;
        margin-right: 8px;
      }
    }
  }
  
  .answer-section {
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    
    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
      
      strong {
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}
</style>