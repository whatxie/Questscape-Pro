<template>
  <div class="practice-container">
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
      <!-- 选择刷题模式 -->
      <div v-if="!isPracticing" class="mode-selection">
        <div class="mode-header">
          <h2>选择刷题模式</h2>
          <p>根据您的学习需求选择合适的刷题方式</p>
        </div>
        
        <div class="mode-grid">
          <div class="mode-card glass-card" @click="startPractice('sequence')">
            <div class="mode-icon">
              <el-icon :size="40"><List /></el-icon>
            </div>
            <h3>顺序刷题</h3>
            <p>按照题库顺序逐一练习</p>
          </div>
          
          <div class="mode-card glass-card" @click="startPractice('random')">
            <div class="mode-icon">
              <el-icon :size="40"><MagicStick /></el-icon>
            </div>
            <h3>随机刷题</h3>
            <p>随机抽取题目进行练习</p>
          </div>
          
          <div class="mode-card glass-card" @click="startPractice('wrong')">
            <div class="mode-icon">
              <el-icon :size="40"><WarningFilled /></el-icon>
            </div>
            <h3>错题重刷</h3>
            <p>专门练习错题本中的题目</p>
          </div>
          
          <div class="mode-card glass-card" @click="$router.push('/exam')">
            <div class="mode-icon">
              <el-icon :size="40"><Timer /></el-icon>
            </div>
            <h3>模拟考试</h3>
            <p>限时模拟真实考试环境</p>
          </div>
        </div>

        <!-- 题库选择 -->
        <div class="bank-selection glass-card">
          <h3>选择题库</h3>
          <el-select 
            v-model="selectedBankId" 
            placeholder="请选择题库" 
            style="width: 100%; max-width: 400px"
          >
            <el-option
              v-for="bank in banks"
              :key="bank.id"
              :label="`${bank.name} (${bank.questionCount}题)`"
              :value="bank.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 答题界面 -->
      <div v-else class="practice-area">
        <div class="practice-header">
          <div class="progress-info">
            <span class="progress-text">进度: {{ currentIndex + 1 }} / {{ questions.length }}</span>
            <el-progress 
              :percentage="Math.round((currentIndex + 1) / questions.length * 100)" 
              :stroke-width="8"
              style="width: 200px"
            />
          </div>
          <div class="timer-info">
            <el-icon><Timer /></el-icon>
            <span>{{ formatTime(elapsedTime) }}</span>
          </div>
        </div>

        <!-- 题目卡片 -->
        <div class="question-card glass-card">
          <div class="question-header">
            <el-tag :type="getQuestionTypeTag(currentQuestion?.type)">
              {{ getQuestionTypeText(currentQuestion?.type) }}
            </el-tag>
            <el-tag v-if="currentQuestion?.difficulty" :type="getDifficultyTag(currentQuestion.difficulty)">
              {{ getDifficultyText(currentQuestion.difficulty) }}
            </el-tag>
            <el-button 
              v-if="currentQuestion" 
              :type="isFavorited ? 'warning' : 'info'" 
              size="small" 
              circle
              @toggle="toggleFavorite"
            >
              <el-icon><Star /></el-icon>
            </el-button>
          </div>

          <div class="question-content">
            <h3 class="question-text">{{ currentQuestion?.content }}</h3>
            
            <!-- 选择题选项 -->
            <div v-if="currentQuestion?.type === 'choice'" class="options-list">
              <div
                v-for="(option, key) in currentQuestion.options"
                :key="key"
                class="option-item"
                :class="{ 
                  selected: selectedAnswer === key,
                  correct: showResult && key === currentQuestion.answer,
                  wrong: showResult && selectedAnswer === key && key !== currentQuestion.answer
                }"
                @click="selectOption(key)"
              >
                <span class="option-key">{{ key }}.</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>

            <!-- 判断题选项 -->
            <div v-else-if="currentQuestion?.type === 'true-false'" class="options-list">
              <div
                class="option-item"
                :class="{ 
                  selected: selectedAnswer === '正确',
                  correct: showResult && currentQuestion.answer === '正确',
                  wrong: showResult && selectedAnswer === '正确' && currentQuestion.answer !== '正确'
                }"
                @click="selectAnswer('正确')"
              >
                <el-icon><CircleCheck /></el-icon>
                <span>正确</span>
              </div>
              <div
                class="option-item"
                :class="{ 
                  selected: selectedAnswer === '错误',
                  correct: showResult && currentQuestion.answer === '错误',
                  wrong: showResult && selectedAnswer === '错误' && currentQuestion.answer !== '错误'
                }"
                @click="selectAnswer('错误')"
              >
                <el-icon><CircleClose /></el-icon>
                <span>错误</span>
              </div>
            </div>

            <!-- 填空题/简答题 -->
            <div v-else class="text-answer">
              <el-input
                v-model="selectedAnswer"
                type="textarea"
                :rows="3"
                placeholder="请输入答案"
                :disabled="showResult"
              />
            </div>
          </div>

          <!-- 解析 -->
          <transition name="slide-fade">
            <div v-if="showResult" class="answer-analysis">
              <div class="result-banner" :class="isCorrect ? 'correct' : 'wrong'">
                {{ isCorrect ? '回答正确' : '回答错误' }}
              </div>
              <div class="analysis-content">
                <p><strong>正确答案：</strong>{{ currentQuestion?.answer }}</p>
                <p><strong>解析：</strong>{{ currentQuestion?.explanation || '暂无解析' }}</p>
                <p v-if="currentQuestion?.knowledgePoint"><strong>知识点：</strong>{{ currentQuestion.knowledgePoint }}</p>
              </div>
            </div>
          </transition>
        </div>

        <!-- 操作按钮 -->
        <div class="practice-actions">
          <el-button v-if="!showResult" type="primary" @click="submitAnswer" :disabled="!selectedAnswer">
            提交答案
          </el-button>
          <el-button v-else type="primary" @click="nextQuestion">
            {{ currentIndex < questions.length - 1 ? '下一题' : '完成练习' }}
          </el-button>
          <el-button @click="markQuestion">
            {{ currentQuestion?.marked ? '取消标记' : '标记此题' }}
          </el-button>
          <el-button @click="giveUpPractice">放弃练习</el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  HomeFilled, FolderOpened, EditPen, Timer, WarningFilled, DataAnalysis, Setting,
  List, MagicStick, Star, CircleCheck, CircleClose
} from '@element-plus/icons-vue';
import { useQuestionBankStore } from '../stores/questionBank';
import { usePracticeStore } from '../stores/practice';

const router = useRouter();
const questionBankStore = useQuestionBankStore();
const practiceStore = usePracticeStore();

// 状态
const banks = ref([]);
const selectedBankId = ref('');
const isPracticing = ref(false);
const questions = ref([]);
const currentIndex = ref(0);
const selectedAnswer = ref('');
const showResult = ref(false);
const isCorrect = ref(false);
const isFavorited = ref(false);
const elapsedTime = ref(0);
let timer = null;

// 计算属性
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value];
});

// 生命周期
onMounted(async () => {
  await loadBanks();
  await practiceStore.init();
});

onUnmounted(() => {
  stopTimer();
});

// 加载题库
const loadBanks = async () => {
  try {
    banks.value = await questionBankStore.getAllBanks();
    if (banks.value.length > 0) {
      selectedBankId.value = banks.value[0].id;
    }
  } catch (error) {
    console.error('加载题库失败:', error);
  }
};

// 开始练习
const startPractice = async (mode) => {
  if (!selectedBankId.value && mode !== 'wrong') {
    ElMessage.warning('请先选择题库');
    return;
  }
  
  try {
    let questionList = [];
    
    switch (mode) {
      case 'sequence':
        questionList = await questionBankStore.getQuestionsByBankId(selectedBankId.value);
        break;
      case 'random':
        questionList = await questionBankStore.getQuestionsByBankId(selectedBankId.value);
        // 随机打乱
        questionList = questionList.sort(() => Math.random() - 0.5);
        break;
      case 'wrong':
        questionList = await practiceStore.getAllWrongQuestions();
        if (questionList.length === 0) {
          ElMessage.warning('错题本为空');
          router.push('/wrong-questions');
          return;
        }
        break;
    }
    
    if (questionList.length === 0) {
      ElMessage.warning('该题库中没有题目');
      return;
    }
    
    questions.value = questionList;
    currentIndex.value = 0;
    selectedAnswer.value = '';
    showResult.value = false;
    isCorrect.value = false;
    isFavorited.value = false;
    
    await practiceStore.startPractice({
      mode,
      bankId: selectedBankId.value,
      questionIds: questionList.map(q => q.id)
    });
    
    isPracticing.value = true;
    startTimer();
  } catch (error) {
    ElMessage.error('开始练习失败');
  }
};

// 选择选项
const selectOption = (key) => {
  if (!showResult.value) {
    selectedAnswer.value = key;
  }
};

// 选择答案
const selectAnswer = (answer) => {
  if (!showResult.value) {
    selectedAnswer.value = answer;
  }
};

// 提交答案
const submitAnswer = () => {
  if (!selectedAnswer.value) {
    ElMessage.warning('请选择或输入答案');
    return;
  }
  
  const question = currentQuestion.value;
  const userAnswer = selectedAnswer.value;
  
  // 判断正误
  if (question.type === 'choice' || question.type === 'true-false') {
    isCorrect.value = userAnswer === question.answer;
  } else {
    // 简答题和填空题暂时无法自动判题
    isCorrect.value = null;
  }
  
  practiceStore.submitAnswer(question.id, userAnswer, isCorrect.value, question);
  showResult.value = true;
  checkFavorite();
};

// 下一题
const nextQuestion = async () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
    selectedAnswer.value = '';
    showResult.value = false;
    isCorrect.value = false;
    isFavorited.value = false;
    checkFavorite();
  } else {
    await finishPractice();
  }
};

// 完成练习
const finishPractice = async () => {
  stopTimer();
  const result = await practiceStore.endPractice();
  
  if (result) {
    ElMessage.success(`练习完成！正确率: ${result.record.accuracy.toFixed(1)}%`);
  }
  
  isPracticing.value = false;
  resetPractice();
};

// 放弃练习
const giveUpPractice = async () => {
  try {
    await ElMessageBox.confirm('确定要放弃当前练习吗？', '提示', { type: 'warning' });
    stopTimer();
    isPracticing.value = false;
    resetPractice();
  } catch (e) {
    // 用户取消
  }
};

// 重置练习状态
const resetPractice = () => {
  questions.value = [];
  currentIndex.value = 0;
  selectedAnswer.value = '';
  showResult.value = false;
  isCorrect.value = false;
  isFavorited.value = false;
  elapsedTime.value = 0;
};

// 标记题目
const markQuestion = async () => {
  const question = currentQuestion.value;
  if (question.marked) {
    question.marked = false;
    ElMessage.success('已取消标记');
  } else {
    question.marked = true;
    await practiceStore.addToFavorites(question);
    ElMessage.success('已添加标记');
  }
  isFavorited.value = question.marked;
};

// 检查是否已收藏
const checkFavorite = () => {
  if (currentQuestion.value) {
    isFavorited.value = practiceStore.isFavorited(currentQuestion.value.id);
  }
};

// 切换收藏
const toggleFavorite = async () => {
  if (isFavorited.value) {
    await practiceStore.removeFromFavorites(currentQuestion.value.id);
    ElMessage.success('已取消收藏');
  } else {
    await practiceStore.addToFavorites(currentQuestion.value);
    ElMessage.success('已添加收藏');
  }
  isFavorited.value = !isFavorited.value;
};

// 计时器
const startTimer = () => {
  timer = setInterval(() => {
    elapsedTime.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 获取题型标签
const getQuestionTypeTag = (type) => {
  const tags = {
    'choice': '',
    'true-false': 'success',
    'fill': 'warning',
    'short-answer': 'info'
  };
  return tags[type] || '';
};

// 获取题型文本
const getQuestionTypeText = (type) => {
  const texts = {
    'choice': '选择题',
    'true-false': '判断题',
    'fill': '填空题',
    'short-answer': '简答题'
  };
  return texts[type] || '未知';
};

// 获取难度标签
const getDifficultyTag = (difficulty) => {
  const tags = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  };
  return tags[difficulty] || '';
};

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const texts = {
    1: '简单',
    2: '中等',
    3: '困难'
  };
  return texts[difficulty] || '未知';
};
</script>

<style lang="scss" scoped>
.practice-container {
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
}

.mode-selection {
  .mode-header {
    text-align: center;
    margin-bottom: 32px;
    
    h2 {
      font-size: 28px;
      color: #ffffff;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .mode-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .mode-card {
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    
    .mode-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(103, 194, 255, 0.2));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #409eff;
    }
    
    h3 {
      font-size: 18px;
      color: #ffffff;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    &:hover {
      transform: translateY(-8px);
      
      .mode-icon {
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.4), rgba(103, 194, 255, 0.4));
      }
    }
  }
  
  .bank-selection {
    padding: 24px;
    text-align: center;
    
    h3 {
      font-size: 16px;
      color: #ffffff;
      margin-bottom: 16px;
    }
  }
}

.practice-area {
  .practice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .progress-info {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .progress-text {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .timer-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      color: #ffffff;
    }
  }
}

.question-card {
  padding: 32px;
  
  .question-header {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .question-content {
    .question-text {
      font-size: 20px;
      font-weight: 500;
      color: #ffffff;
      line-height: 1.6;
      margin-bottom: 32px;
    }
  }
  
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .option-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(64, 158, 255, 0.5);
    }
    
    &.selected {
      background: rgba(64, 158, 255, 0.2);
      border-color: #409eff;
    }
    
    &.correct {
      background: rgba(103, 194, 58, 0.2);
      border-color: #67c23a;
    }
    
    &.wrong {
      background: rgba(245, 108, 108, 0.2);
      border-color: #f56c6c;
    }
    
    .option-key {
      font-weight: 600;
      color: #409eff;
    }
    
    .option-text {
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  .text-answer {
    margin-top: 16px;
  }
  
  .answer-analysis {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .result-banner {
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      margin-bottom: 16px;
      display: inline-block;
      
      &.correct {
        background: rgba(103, 194, 58, 0.2);
        color: #67c23a;
      }
      
      &.wrong {
        background: rgba(245, 108, 108, 0.2);
        color: #f56c6c;
      }
    }
    
    .analysis-content {
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
}

.practice-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>