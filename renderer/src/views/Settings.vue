<template>
  <div class="settings-container">
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
        <h2 class="page-title">设置</h2>

        <!-- 基本设置 -->
        <div class="settings-section glass-card">
          <h3>基本设置</h3>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">应用字体大小</span>
              <span class="setting-desc">调整应用内文字显示大小</span>
            </div>
            <el-slider 
              v-model="settings.fontSize" 
              :min="12" 
              :max="20" 
              :step="1"
              @change="saveSettings"
            />
            <span class="setting-value">{{ settings.fontSize }}px</span>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">动画效果</span>
              <span class="setting-desc">开启或关闭界面动画效果</span>
            </div>
            <el-switch v-model="settings.animation" @change="saveSettings" />
          </div>
        </div>

        <!-- 刷题设置 -->
        <div class="settings-section glass-card">
          <h3>刷题设置</h3>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">显示答案解析</span>
              <span class="setting-desc">答题后立即显示正确答案和解析</span>
            </div>
            <el-switch v-model="settings.showAnalysis" @change="saveSettings" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">自动记录错题</span>
              <span class="setting-desc">答错题目自动添加到错题本</span>
            </div>
            <el-switch v-model="settings.autoRecordWrong" @change="saveSettings" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">答题音效</span>
              <span class="setting-desc">答题时播放提示音</span>
            </div>
            <el-switch v-model="settings.soundEffect" @change="saveSettings" />
          </div>
        </div>

        <!-- 存储设置 -->
        <div class="settings-section glass-card">
          <h3>存储管理</h3>
          <div class="storage-info">
            <div class="storage-item">
              <span class="storage-label">数据存储路径</span>
              <span class="storage-path">{{ dataPath }}</span>
            </div>
            <div class="storage-stats">
              <div class="stat">
                <el-icon><Folder /></el-icon>
                <span>{{ storageStats.questionCount }} 道题目</span>
              </div>
              <div class="stat">
                <el-icon><Document /></el-icon>
                <span>{{ storageStats.recordCount }} 条记录</span>
              </div>
            </div>
          </div>
          <div class="setting-actions">
            <el-button @click="openDataFolder">
              <el-icon><FolderOpened /></el-icon>
              打开数据文件夹
            </el-button>
          </div>
        </div>

        <!-- 数据备份 -->
        <div class="settings-section glass-card">
          <h3>数据备份</h3>
          <div class="backup-section">
            <div class="backup-item">
              <el-button type="primary" @click="backupData">
                <el-icon><Upload /></el-icon>
                备份数据
              </el-button>
              <p class="backup-desc">将所有题库和练习记录导出为Excel文件</p>
            </div>
            <div class="backup-item">
              <el-button @click="restoreData">
                <el-icon><Download /></el-icon>
                恢复数据
              </el-button>
              <p class="backup-desc">从Excel备份文件恢复数据</p>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section glass-card">
          <h3>关于</h3>
          <div class="about-info">
            <div class="app-name">题境随行</div>
            <div class="app-version">版本 1.0.0</div>
            <p class="app-desc">一款专注于学习的题库管理与刷题工具</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  HomeFilled, FolderOpened, EditPen, Timer, WarningFilled, DataAnalysis, Setting,
  Folder, Document, Upload, Download
} from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { useQuestionBankStore } from '../stores/questionBank';
import { usePracticeStore } from '../stores/practice';

const questionBankStore = useQuestionBankStore();
const practiceStore = usePracticeStore();

// 设置
const settings = ref({
  fontSize: 14,
  animation: true,
  showAnalysis: true,
  autoRecordWrong: true,
  soundEffect: false
});

// 数据路径
const dataPath = ref('');

// 存储统计
const storageStats = ref({
  questionCount: 0,
  recordCount: 0
});

// 生命周期
onMounted(async () => {
  await loadSettings();
  await loadStorageStats();
  dataPath.value = window.electronAPI?.getAppPath?.() + '/data' || './data';
});

// 加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('question-practice-settings');
    if (saved) {
      settings.value = { ...settings.value, ...JSON.parse(saved) };
      applyFontSize();
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 保存设置
const saveSettings = () => {
  try {
    localStorage.setItem('question-practice-settings', JSON.stringify(settings.value));
    applyFontSize();
    ElMessage.success('设置已保存');
  } catch (error) {
    ElMessage.error('保存设置失败');
  }
};

// 应用字体大小
const applyFontSize = () => {
  document.documentElement.style.fontSize = settings.value.fontSize + 'px';
};

// 加载存储统计
const loadStorageStats = async () => {
  try {
    const questions = await questionBankStore.getAllQuestions();
    storageStats.value.questionCount = questions.length;
    storageStats.value.recordCount = practiceStore.practiceRecords.length;
  } catch (error) {
    console.error('加载存储统计失败:', error);
  }
};

// 打开数据文件夹
const openDataFolder = () => {
  const path = window.electronAPI?.getAppPath?.();
  if (path) {
    // 发送消息给主进程打开文件夹
    ElMessage.info('请在文件管理器中打开: ' + path);
  }
};

// 备份数据
const backupData = async () => {
  try {
    const questions = await questionBankStore.getAllQuestions();
    const records = practiceStore.practiceRecords;
    const wrongQuestions = await practiceStore.getAllWrongQuestions();
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 题目数据
    if (questions.length > 0) {
      const questionData = questions.map((q, idx) => ({
        '序号': idx + 1,
        '题目内容': q.content,
        '题型': q.type,
        '选项A': q.options?.A || '',
        '选项B': q.options?.B || '',
        '选项C': q.options?.C || '',
        '选项D': q.options?.D || '',
        '正确答案': q.answer,
        '解析': q.explanation || '',
        '知识点': q.knowledgePoint || '',
        '难度': q.difficulty
      }));
      const ws1 = XLSX.utils.json_to_sheet(questionData);
      XLSX.utils.book_append_sheet(wb, ws1, '题目');
    }
    
    // 练习记录
    if (records.length > 0) {
      const recordData = records.map((r, idx) => ({
        '序号': idx + 1,
        '日期': new Date(r.startTime).toLocaleString(),
        '模式': r.mode,
        '题数': r.totalCount,
        '正确数': r.correctCount,
        '正确率': r.accuracy + '%'
      }));
      const ws2 = XLSX.utils.json_to_sheet(recordData);
      XLSX.utils.book_append_sheet(wb, ws2, '练习记录');
    }
    
    // 错题本
    if (wrongQuestions.length > 0) {
      const wrongData = wrongQuestions.map((q, idx) => ({
        '序号': idx + 1,
        '题目内容': q.content,
        '正确答案': q.answer,
        '错误次数': q.wrongCount || 1,
        '知识点': q.knowledgePoint || ''
      }));
      const ws3 = XLSX.utils.json_to_sheet(wrongData);
      XLSX.utils.book_append_sheet(wb, ws3, '错题本');
    }
    
    const defaultPath = window.electronAPI?.getDesktopPath?.() || '';
    const filePath = `${defaultPath}/题境随行备份_${Date.now()}.xlsx`;
    
    XLSX.writeFile(wb, filePath);
    ElMessage.success(`备份已保存至: ${filePath}`);
  } catch (error) {
    ElMessage.error('备份失败: ' + error.message);
  }
};

// 恢复数据
const restoreData = async () => {
  const filePath = await window.electronAPI?.selectFile?.({
    filters: [{ name: 'Excel文件', extensions: ['xlsx', 'xls'] }]
  });
  
  if (!filePath || filePath.length === 0) return;
  
  try {
    const file = filePath[0];
    const wb = XLSX.readFile(file);
    
    // 处理题目
    if (wb.SheetNames.includes('题目')) {
      const questions = XLSX.utils.sheet_to_json(wb.Sheets['题目']);
      ElMessage.info(`发现 ${questions.length} 道题目`);
      // 实际恢复逻辑需要更多处理
    }
    
    ElMessage.success('数据恢复功能演示完成');
  } catch (error) {
    ElMessage.error('恢复失败: ' + error.message);
  }
};
</script>

<style lang="scss" scoped>
.settings-container {
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
  
  .page-title {
    font-size: 24px;
    color: #ffffff;
    margin: 0;
  }
}

.settings-section {
  padding: 24px;
  
  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .setting-item {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .setting-info {
      flex: 1;
      
      .setting-label {
        display: block;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 4px;
      }
      
      .setting-desc {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
    
    .setting-value {
      min-width: 50px;
      text-align: right;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.storage-info {
  .storage-item {
    margin-bottom: 16px;
    
    .storage-label {
      display: block;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
    }
    
    .storage-path {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      word-break: break-all;
    }
  }
  
  .storage-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    
    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .setting-actions {
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.backup-section {
  display: flex;
  gap: 32px;
  
  .backup-item {
    flex: 1;
    
    .backup-desc {
      margin-top: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

.about-info {
  text-align: center;
  
  .app-name {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 8px;
  }
  
  .app-version {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 12px;
  }
  
  .app-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>