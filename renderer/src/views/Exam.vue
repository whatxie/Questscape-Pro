<template>
  <div class="exam-container">
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
      <!-- 配置界面 -->
      <div v-if="!isExamining" class="config-area">
        <div class="config-header">
          <h2>模拟考试</h2>
          <p>设置考试参数，开始模拟考试</p>
        </div>

        <div class="config-form glass-card">
          <el-form label-width="100px">
            <el-form-item label="选择题库">
              <el-select v-model="config.bankId" placeholder="请选择题库" style="width: 100%">
                <el-option
                  v-for="bank in banks"
                  :key="bank.id"
                  :label="`${bank.name} (${bank.questionCount}题)`"
                  :value="bank.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="题目数量">
              <el-slider 
                v-model="config.questionCount" 
                :min="5" 
                :max="100" 
                :step="5"
                show-input
              />
            </el-form-item>

            <el-form-item label="考试时长">
              <el-select v-model="config.duration" style="width: 100%">
                <el-option label="15分钟" :value="15" />
                <el-option label="30分钟" :value="30" />
                <el-option label="45分钟" :value="45" />
                <el-option label="60分钟" :value="60" />
                <el-option label="90分钟" :value="90" />
                <el-option label="120分钟" :value="120" />
              </el-select>
            </el-form-item>

            <el-form-item label="及格分数">
              <el-input-number 
                v-model="config.passScore" 
                :min="0" 
                :max="100"
                :step="5"
              />
              <span class="unit">分</span>
            </el-form-item>

            <el-form-item label="显示答案">
              <el-switch v-model="config.showAnswer" />
              <span class="tip">考试结束后显示正确答案</span>
            </el-form-item>
          </el-form>

          <div class="config-actions">
            <el-button type="primary" size="large" @click="startExam">
              开始考试
            </el-button>
            <el-button size="large" @click="$router.push('/practice')">返回刷题</el-button>
          </div>
        </div>

        <!-- 考试说明 -->
        <div class="exam-rules glass-card">
          <h3>考试规则</h3>
          <ul>
            <li>考试时间到达后会自动提交试卷</li>
            <li>每道题提交后不可修改</li>
            <li>考试期间请勿切换页面</li>
            <li>考试结束后可查看成绩和错题解析</li>
          </ul>
        </div>
      </div>

      <!-- 考试界面 -->
      <div v-else class="exam-area">
        <!-- 考试顶部信息 -->
        <div class="exam-header">
          <div class="exam-title">
            <h3>{{ bankName }} - 模拟考试</h3>
            <span class="exam-mode">第 {{ currentIndex + 1 }} 题 / 共 {{ questions.length }} 题</span>
          </div>
          <div class="exam-info">
            <div class="timer" :class="{ warning: remainingTime < 300 }">
              <el-icon><Timer /></el-icon>
              <span>{{ formatTime(remainingTime) }}</span>
            </div>
            <div class="score">
              当前得分: {{ currentScore }} 分
            </div>
          </div>
        </div>

        <!-- 题目卡片 -->
        <div class="question-card glass-card">
          <div class="question-header">
            <div class="question-tags">
              <el-tag>第 {{ currentIndex + 1 }} 题</el-tag>
              <el-tag :type="getQuestionTypeTag(currentQuestion?.type)">
                {{ getQuestionTypeText(currentQuestion?.type) }}
              </el-tag>
              <el-tag :type="getDifficultyTag(currentQuestion?.difficulty)">
                {{ getDifficultyText(currentQuestion?.difficulty) }}
              </el-tag>
            </div>
            <div class="question-actions">
              <el-button 
                :type="currentQuestion?.marked ? 'warning' : 'info'" 
                size="small"
                @click="markQuestion"
              >
                <el-icon><Flag /></el-icon>
                {{ currentQuestion?.marked ? '已标记' : '标记' }}
              </el-button>
            </div>
          </div>

          <div class="question-content">
            <h3 class="question-text">{{ currentQuestion?.content }}</h3>
            
            <!-- 选择题 -->
            <div v-if="currentQuestion?.type === 'choice'" class="options-list">
              <div
                v-for="(option, key) in currentQuestion.options"
                :key="key"
                class="option-item"
                :class="{ selected: selectedAnswer === key }"
                @click="selectOption(key)"
              >
                <span class="option-key">{{ key }}</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>

            <!-- 判断题 -->
            <div v-else-if="currentQuestion?.type === 'true-false'" class="options-list tf-options">
              <div
                class="option-item"
                :class="{ selected: selectedAnswer === '正确' }"
                @click="selectAnswer('正确')"
              >
                <el-icon><CircleCheck /></el-icon>
                <span>正确</span>
              </div>
              <div
                class="option-item"
                :class="{ selected: selectedAnswer === '错误' }"
                @click="selectAnswer('错误')"
              >
                <el-icon><CircleClose /></el-icon>
                <span>错误</span>
              </div>
            </div>

            <!-- 填空/简答 -->
            <div v-else class="text-answer">
              <el-input
                v-model="selectedAnswer"
                type="textarea"
                :rows="4"
                placeholder="请输入答案"
                :disabled="submitted"
              />
            </div>
          </div>
        </div>

        <!-- 答题卡 -->
        <div class="answer-sheet glass-card">
          <h4>答题卡</h4>
          <div class="sheet-grid">
            <div
              v-for="(q, idx) in questions"
              :key="idx"
              class="sheet-item"
              :class="{
                current: idx === currentIndex,
                answered: answers[idx] !== undefined,
                correct: config.showAnswer && q.answer === answers[idx],
                wrong: config.showAnswer && answers[idx] !== undefined && answers[idx] !== q.answer
              }"
              @click="goToQuestion(idx)"
            >
              {{ idx + 1 }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="exam-actions">
          <el-button :disabled="currentIndex === 0" @click="prevQuestion">
            <el-icon><ArrowLeft /></el-icon>
            上一题
          </el-button>
          <el-button v-if="!submitted" type="primary" @click="submitCurrentQuestion">
            提交本题
          </el-button>
          <el-button :disabled="currentIndex === questions.length - 1" @click="nextQuestion">
            下一题
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button type="danger" @click="finishExam">交卷</el-button>
        </div>
      </div>

      <!-- 成绩公布 -->
      <div v-if="showResult" class="result-area">
        <div class="result-card glass-card">
          <div class="result-header">
            <div class="result-icon" :class="isPassed ? 'passed' : 'failed'">
              <el-icon v-if="isPassed" :size="48"><CircleCheck /></el-icon>
              <el-icon v-else :size="48"><CircleClose /></el-icon>
            </div>
            <h2>{{ isPassed ? '恭喜通过!' : '继续加油!' }}</h2>
            <p>考试结果</p>
          </div>

          <div class="result-stats">
            <div class="stat-item">
              <div class="stat-value">{{ score }}</div>
              <div class="stat-label">总分</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ accuracy }}%</div>
              <div class="stat-label">正确率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ correctCount }}</div>
              <div class="stat-label">正确题数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ wrongCount }}</div>
              <div class="stat-label">错误题数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatTime(examDuration) }}</div>
              <div class="stat-label">用时</div>
            </div>
          </div>

          <div class="result-actions">
            <el-button type="primary" size="large" @click="reviewExam">查看试卷</el-button>
            <el-button size="large" @click="retryExam">重新考试</el-button>
            <el-button size="large" @click="$router.push('/statistics')">查看统计</el-button>
          </div>
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
  CircleCheck, CircleClose, ArrowLeft, ArrowRight, Flag
} from '@element-plus/icons-vue';
import { useQuestionBankStore } from '../stores/questionBank';
import { usePracticeStore } from '../stores/practice';

const router = useRouter();
const questionBankStore = useQuestionBankStore();
const practiceStore = usePracticeStore();

// 题库
const banks = ref([]);

// 考试配置
const config = ref({
  bankId: '',
  questionCount: 20,
  duration: 30,
  passScore: 60,
  showAnswer: true
});

// 考试状态
const isExamining = ref(false);
const questions = ref([]);
const currentIndex = ref(0);
const answers = ref({});
const selectedAnswer = ref('');
const submitted = ref(false);
const remainingTime = ref(0);
const currentScore = ref(0);
let timer = null;

// 结果状态
const showResult = ref(false);
const score = ref(0);
const correctCount = ref(0);
const wrongCount = ref(0);
const accuracy = ref(0);
const examDuration = ref(0);

// 计算属性
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const bankName = computed(() => {
  const bank = banks.value.find(b => b.id === config.value.bankId);
  return bank?.name || '';
});
const isPassed = computed(() => score.value >= config.value.passScore);

// 生命周期
onMounted(async () => {
  await loadBanks();
  await practiceStore.init();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// 加载题库
const loadBanks = async () => {
  try {
    banks.value = await questionBankStore.getAllBanks();
    if (banks.value.length > 0) {
      config.value.bankId = banks.value[0].id;
    }
  } catch (error) {
    console.error('加载题库失败:', error);
  }
};

// 开始考试
const startExam = async () => {
  if (!config.value.bankId) {
    ElMessage.warning('请选择题库');
    return;
  }
  
  try {
    const allQuestions = await questionBankStore.getQuestionsByBankId(config.value.bankId);
    if (allQuestions.length < config.value.questionCount) {
      ElMessage.warning(`题库中只有 ${allQuestions.length} 道题，无法完成 ${config.value.questionCount} 道题的考试`);
      return;
    }
    
    // 随机抽取题目
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    questions.value = shuffled.slice(0, config.value.questionCount);
    currentIndex.value = 0;
    answers.value = {};
    selectedAnswer.value = '';
    submitted.value = false;
    currentScore.value = 0;
    remainingTime.value = config.value.duration * 60;
    
    await practiceStore.startPractice({
      mode: 'exam',
      bankId: config.value.bankId,
      questionIds: questions.value.map(q => q.id)
    });
    
    isExamining.value = true;
    startTimer();
  } catch (error) {
    ElMessage.error('开始考试失败');
  }
};

// 计时器
const startTimer = () => {
  timer = setInterval(() => {
    remainingTime.value--;
    if (remainingTime.value <= 0) {
      finishExam();
    }
  }, 1000);
};

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 选择选项
const selectOption = (key) => {
  if (!submitted.value) {
    selectedAnswer.value = key;
  }
};

// 选择答案
const selectAnswer = (answer) => {
  if (!submitted.value) {
    selectedAnswer.value = answer;
  }
};

// 提交当前题
const submitCurrentQuestion = () => {
  if (!selectedAnswer.value) {
    ElMessage.warning('请选择答案');
    return;
  }
  
  answers.value[currentIndex.value] = selectedAnswer.value;
  submitted.value = true;
  
  // 计算得分
  const q = currentQuestion.value;
  const userAnswer = selectedAnswer.value;
  let isCorrect = false;
  
  if (q.type === 'choice' || q.type === 'true-false') {
    isCorrect = userAnswer === q.answer;
    if (isCorrect) {
      currentScore.value += Math.round(100 / questions.value.length);
    }
  }
  
  practiceStore.submitAnswer(q.id, userAnswer, isCorrect, q);
};

// 上一题
const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    loadQuestionState();
  }
};

// 下一题
const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
    loadQuestionState();
  }
};

// 跳转到指定题目
const goToQuestion = (index) => {
  currentIndex.value = index;
  loadQuestionState();
};

// 加载题目状态
const loadQuestionState = () => {
  const savedAnswer = answers.value[currentIndex.value];
  if (savedAnswer !== undefined) {
    selectedAnswer.value = savedAnswer;
    submitted.value = true;
  } else {
    selectedAnswer.value = '';
    submitted.value = false;
  }
};

// 标记题目
const markQuestion = async () => {
  if (currentQuestion.value) {
    if (currentQuestion.value.marked) {
      currentQuestion.value.marked = false;
      ElMessage.success('已取消标记');
    } else {
      currentQuestion.value.marked = true;
      await practiceStore.addToFavorites(currentQuestion.value);
      ElMessage.success('已标记');
    }
  }
};

// 完成考试
const finishExam = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  // 提交未答题
  for (let i = 0; i < questions.value.length; i++) {
    if (answers.value[i] === undefined) {
      answers.value[i] = '';
      practiceStore.submitAnswer(questions.value[i].id, '', false, questions.value[i]);
    }
  }
  
  // 计算成绩
  correctCount.value = 0;
  wrongCount.value = 0;
  for (let i = 0; i < questions.value.length; i++) {
    const q = questions.value[i];
    const userAnswer = answers.value[i];
    
    if (q.type === 'choice' || q.type === 'true-false') {
      if (userAnswer === q.answer) {
        correctCount.value++;
      } else {
        wrongCount.value++;
      }
    }
  }
  
  accuracy.value = Math.round((correctCount.value / questions.value.length) * 100);
  score.value = currentScore.value;
  examDuration.value = (config.value.duration * 60) - remainingTime.value;
  
  // 保存练习记录
  const result = await practiceStore.endPractice();
  if (result) {
    result.record.score = score.value;
    result.record.passed = isPassed.value;
  }
  
  showResult.value = true;
  isExamining.value = false;
};

// 查看试卷
const reviewExam = () => {
  config.value.showAnswer = true;
  isExamining.value = true;
  showResult.value = false;
  currentIndex.value = 0;
  loadQuestionState();
};

// 重新考试
const retryExam = () => {
  showResult.value = false;
  config.value.questionCount = Math.min(config.value.questionCount, 20);
  startExam();
};

// 获取题型标签
const getQuestionTypeTag = (type) => {
  const tags = { 'choice': '', 'true-false': 'success', 'fill': 'warning', 'short-answer': 'info' };
  return tags[type] || '';
};

// 获取题型文本
const getQuestionTypeText = (type) => {
  const texts = { 'choice': '选择题', 'true-false': '判断题', 'fill': '填空题', 'short-answer': '简答题' };
  return texts[type] || '未知';
};

// 获取难度标签
const getDifficultyTag = (difficulty) => {
  const tags = { 1: 'success', 2: 'warning', 3: 'danger' };
  return tags[difficulty] || '';
};

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const texts = { 1: '简单', 2: '中等', 3: '困难' };
  return texts[difficulty] || '未知';
};
</script>

<style lang="scss" scoped>
.exam-container {
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

.config-area {
  .config-header {
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
  
  .config-form {
    padding: 32px;
    max-width: 600px;
    margin: 0 auto 24px;
    
    .unit {
      margin-left: 8px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .tip {
      margin-left: 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
  
  .config-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
  }
  
  .exam-rules {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
    
    h3 {
      font-size: 16px;
      color: #ffffff;
      margin-bottom: 16px;
    }
    
    ul {
      list-style: none;
      padding: 0;
      
      li {
        position: relative;
        padding-left: 20px;
        margin-bottom: 8px;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
        
        &::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #409eff;
        }
      }
    }
  }
}

.exam-area {
  .exam-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    
    .exam-title {
      h3 {
        font-size: 18px;
        color: #ffffff;
        margin-bottom: 4px;
      }
      
      .exam-mode {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }
    }
    
    .exam-info {
      display: flex;
      align-items: center;
      gap: 24px;
      
      .timer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        
        &.warning {
          color: #f56c6c;
          animation: pulse 1s infinite;
        }
      }
      
      .score {
        font-size: 16px;
        color: #67c23a;
      }
    }
  }
  
  .question-card {
    padding: 32px;
    
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      .question-tags {
        display: flex;
        gap: 8px;
      }
    }
    
    .question-text {
      font-size: 20px;
      font-weight: 500;
      color: #ffffff;
      line-height: 1.6;
      margin-bottom: 32px;
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
      
      .option-key {
        font-weight: 600;
        color: #409eff;
      }
      
      .option-text {
        flex: 1;
        color: rgba(255, 255, 255, 0.9);
      }
    }
    
    .tf-options {
      flex-direction: row;
      
      .option-item {
        flex: 1;
        justify-content: center;
      }
    }
  }
  
  .answer-sheet {
    padding: 20px;
    margin-top: 20px;
    
    h4 {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 16px;
    }
    
    .sheet-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .sheet-item {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid transparent;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &.current {
        border-color: #409eff;
        background: rgba(64, 158, 255, 0.2);
      }
      
      &.answered {
        background: rgba(64, 158, 255, 0.3);
      }
      
      &.correct {
        background: rgba(103, 194, 58, 0.3);
      }
      
      &.wrong {
        background: rgba(245, 108, 108, 0.3);
      }
    }
  }
  
  .exam-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
  }
}

.result-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  
  .result-card {
    padding: 48px;
    text-align: center;
    max-width: 500px;
    
    .result-header {
      margin-bottom: 32px;
      
      .result-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.passed {
          background: linear-gradient(135deg, rgba(103, 194, 58, 0.3), rgba(103, 194, 58, 0.1));
          color: #67c23a;
        }
        
        &.failed {
          background: linear-gradient(135deg, rgba(245, 108, 108, 0.3), rgba(245, 108, 108, 0.1));
          color: #f56c6c;
        }
      }
      
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
    
    .result-stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 32px;
      
      .stat-item {
        padding: 16px 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }
    
    .result-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .el-button {
        width: 100%;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>