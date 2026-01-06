<template>
  <div class="question-bank-container">
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
            <el-button type="primary" @click="showCreateBankDialog">
              <el-icon><Plus /></el-icon>
              新建题库
            </el-button>
            <el-button @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>
            <el-button type="success" @click="showImportDialog">
              <el-icon><Upload /></el-icon>
              导入Excel
            </el-button>
          </div>
          <div class="action-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索题目..."
              prefix-icon="Search"
              clearable
              style="width: 200px"
            />
          </div>
        </div>

        <!-- 题库列表 -->
        <div class="bank-list">
          <div class="bank-card glass-card" v-for="bank in filteredBanks" :key="bank.id">
            <div class="bank-header">
              <div class="bank-info">
                <h3 class="bank-name">{{ bank.name }}</h3>
                <span class="bank-count">{{ bank.questionCount }} 道题目</span>
              </div>
              <div class="bank-actions">
                <el-button circle size="small" @click="editBank(bank)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button circle size="small" type="danger" @click="deleteBank(bank)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="bank-tags">
              <el-tag
                v-for="tag in bank.tags.slice(0, 5)"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
              <el-tag v-if="bank.tags.length > 5" size="small" effect="plain">
                +{{ bank.tags.length - 5 }}
              </el-tag>
            </div>
            <div class="bank-footer">
              <span class="update-time">更新于 {{ formatTime(bank.updatedAt) }}</span>
              <el-button type="primary" size="small" @click="viewQuestions(bank)">
                查看题目
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="banks.length === 0" description="暂无题库，点击新建题库开始">
          <el-button type="primary" @click="showCreateBankDialog">新建题库</el-button>
        </el-empty>
      </div>
    </main>

    <!-- 新建/编辑题库对话框 -->
    <el-dialog
      v-model="bankDialogVisible"
      :title="editingBank ? '编辑题库' : '新建题库'"
      width="500px"
    >
      <el-form :model="bankForm" label-width="80px">
        <el-form-item label="题库名称">
          <el-input v-model="bankForm.name" placeholder="请输入题库名称" />
        </el-form-item>
        <el-form-item label="知识点标签">
          <el-select
            v-model="bankForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bankDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBank">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入Excel" width="600px">
      <div class="import-content">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept=".xlsx,.xls"
          drag
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 .xlsx, .xls 格式</div>
          </template>
        </el-upload>
        
        <div v-if="previewData.length > 0" class="preview-section">
          <h4>数据预览 (前5条)</h4>
          <el-table :data="previewData" max-height="300" size="small">
            <el-table-column prop="question" label="题目" min-width="150" />
            <el-table-column prop="type" label="题型" width="80" />
            <el-table-column prop="answer" label="答案" width="60" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importFile" @click="executeImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  HomeFilled, FolderOpened, EditPen, Timer, WarningFilled, DataAnalysis, Setting,
  Plus, Download, Upload, Edit, Delete
} from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { useQuestionBankStore } from '../stores/questionBank';

const router = useRouter();
const questionBankStore = useQuestionBankStore();

// 题库列表
const banks = ref([]);
const searchKeyword = ref('');

// 题库表单
const bankDialogVisible = ref(false);
const bankForm = ref({
  id: null,
  name: '',
  tags: []
});
const editingBank = ref(null);

// 导入相关
const importDialogVisible = ref(false);
const importFile = ref(null);
const previewData = ref([]);
const uploadRef = ref(null);

// 常用标签
const commonTags = ref([
  '基础知识', '重点难点', '易错题', '历年真题', '模拟试题',
  '选择题', '填空题', '判断题', '简答题', '编程题'
]);

// 计算属性
const filteredBanks = computed(() => {
  if (!searchKeyword.value) return banks.value;
  const keyword = searchKeyword.value.toLowerCase();
  return banks.value.filter(bank => 
    bank.name.toLowerCase().includes(keyword) ||
    bank.tags.some(tag => tag.toLowerCase().includes(keyword))
  );
});

// 生命周期
onMounted(async () => {
  await loadBanks();
});

// 加载题库列表
const loadBanks = async () => {
  try {
    banks.value = await questionBankStore.getAllBanks();
  } catch (error) {
    ElMessage.error('加载题库列表失败');
  }
};

// 显示新建题库对话框
const showCreateBankDialog = () => {
  editingBank.value = null;
  bankForm.value = { id: null, name: '', tags: [] };
  bankDialogVisible.value = true;
};

// 编辑题库
const editBank = (bank) => {
  editingBank.value = bank;
  bankForm.value = { ...bank };
  bankDialogVisible.value = true;
};

// 保存题库
const saveBank = async () => {
  if (!bankForm.value.name.trim()) {
    ElMessage.warning('请输入题库名称');
    return;
  }
  
  try {
    if (editingBank.value) {
      await questionBankStore.updateBank(editingBank.value.id, bankForm.value);
      ElMessage.success('题库更新成功');
    } else {
      await questionBankStore.createBank(bankForm.value);
      ElMessage.success('题库创建成功');
    }
    bankDialogVisible.value = false;
    await loadBanks();
  } catch (error) {
    ElMessage.error('保存题库失败');
  }
};

// 删除题库
const deleteBank = async (bank) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除题库"${bank.name}"吗？删除后无法恢复。`,
      '删除确认',
      { type: 'warning' }
    );
    await questionBankStore.deleteBank(bank.id);
    ElMessage.success('题库删除成功');
    await loadBanks();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除题库失败');
    }
  }
};

// 查看题目
const viewQuestions = (bank) => {
  router.push(`/question-bank?bankId=${bank.id}`);
};

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    {
      '题目内容': '示例题目：如果2+2=？',
      '题型': '选择题',
      '选项A': '3',
      '选项B': '4',
      '选项C': '5',
      '选项D': '6',
      '答案': 'B',
      '解析': '这是一道基础数学题',
      '知识点': '数学运算',
      '难度': '简单'
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '题目模板');
  
  const defaultPath = window.electronAPI?.getDesktopPath?.() || '';
  const filePath = `${defaultPath}/题库导入模板.xlsx`;
  
  XLSX.writeFile(wb, filePath);
  ElMessage.success(`模板已保存至: ${filePath}`);
};

// 显示导入对话框
const showImportDialog = () => {
  importFile.value = null;
  previewData.value = [];
  importDialogVisible.value = true;
};

// 文件变化处理
const handleFileChange = (file) => {
  importFile.value = file.raw;
  parseExcel(file.raw);
};

// 文件移除
const handleFileRemove = () => {
  importFile.value = null;
  previewData.value = [];
};

// 解析Excel
const parseExcel = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (jsonData.length > 0) {
        previewData.value = jsonData.slice(0, 5).map((item, index) => ({
          id: index,
          question: item['题目内容'] || item['question'] || '',
          type: item['题型'] || item['type'] || '',
          answer: item['答案'] || item['answer'] || ''
        }));
      }
    } catch (error) {
      ElMessage.error('解析Excel失败');
    }
  };
  reader.readAsArrayBuffer(file);
};

// 执行导入
const executeImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件');
    return;
  }
  
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (jsonData.length === 0) {
        ElMessage.warning('Excel文件中没有数据');
        return;
      }
      
      // 转换数据格式
      const questions = jsonData.map((item, index) => ({
        id: `q_${Date.now()}_${index}`,
        content: item['题目内容'] || item['question'] || '',
        type: mapQuestionType(item['题型'] || item['type'] || '选择题'),
        options: {
          A: item['选项A'] || item['optionA'] || '',
          B: item['选项B'] || item['optionB'] || '',
          C: item['选项C'] || item['optionC'] || '',
          D: item['选项D'] || item['optionD'] || ''
        },
        answer: item['答案'] || item['answer'] || '',
        explanation: item['解析'] || item['explanation'] || '',
        knowledgePoint: item['知识点'] || item['knowledgePoint'] || '',
        difficulty: mapDifficulty(item['难度'] || item['difficulty'] || '中等'),
        createdAt: new Date().toISOString()
      }));
      
      // 保存到题库
      if (banks.value.length > 0) {
        const bankId = banks.value[0].id;
        await questionBankStore.addQuestionsToBank(bankId, questions);
        ElMessage.success(`成功导入 ${questions.length} 道题目`);
        importDialogVisible.value = false;
        await loadBanks();
      } else {
        // 如果没有题库，先创建默认题库
        const newBank = await questionBankStore.createBank({ name: '默认题库', tags: ['默认'] });
        await questionBankStore.addQuestionsToBank(newBank.id, questions);
        ElMessage.success(`已创建题库并导入 ${questions.length} 道题目`);
        importDialogVisible.value = false;
        await loadBanks();
      }
    };
    reader.readAsArrayBuffer(importFile.value);
  } catch (error) {
    ElMessage.error('导入失败: ' + error.message);
  }
};

// 映射题型
const mapQuestionType = (type) => {
  const typeMap = {
    '选择题': 'choice',
    '判断题': 'true-false',
    '填空题': 'fill',
    '简答题': 'short-answer'
  };
  return typeMap[type] || 'choice';
};

// 映射难度
const mapDifficulty = (difficulty) => {
  const difficultyMap = {
    '简单': 1,
    '容易': 1,
    '中等': 2,
    '一般': 2,
    '困难': 3,
    '难': 3
  };
  return difficultyMap[difficulty] || 2;
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '未知';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.question-bank-container {
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
    gap: 12px;
  }
}

.bank-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.bank-card {
  padding: 20px;
  
  .bank-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .bank-name {
      font-size: 18px;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 4px;
    }
    
    .bank-count {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .bank-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    
    .el-tag {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .bank-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .update-time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

.import-content {
  .preview-section {
    margin-top: 20px;
    
    h4 {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
    }
  }
}
</style>