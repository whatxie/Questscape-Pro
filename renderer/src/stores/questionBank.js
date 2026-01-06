import { defineStore } from 'pinia';

// 检测是否在 Electron 主进程中（有 fs 模块）
const isElectronMain = typeof window !== 'undefined' && window.electronAPI?.isMain;

let fs = null;
let path = null;

if (isElectronMain) {
  try {
    fs = require('fs');
    path = require('path');
  } catch (e) {
    console.warn('无法加载 fs 模块，将使用本地存储');
  }
}

// 数据目录路径
const getDataDir = () => {
  if (isElectronMain && fs && path) {
    const electronPath = window.electronAPI?.getAppPath?.();
    return electronPath ? `${electronPath}/data` : path.join(process.cwd(), 'data');
  }
  // 浏览器环境使用 localStorage
  return null;
};

// 浏览器存储键名
const STORAGE_KEYS = {
  banks: 'questscape_banks',
  questions: 'questscape_questions'
};

// 确保目录存在
const ensureDir = () => {
  if (isElectronMain && fs && getDataDir()) {
    const dataDir = getDataDir();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
};

// 从浏览器 localStorage 加载数据
const loadFromStorage = (key, defaultValue = []) => {
  if (!isElectronMain) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`加载 ${key} 失败:`, e);
      return defaultValue;
    }
  }
  return defaultValue;
};

// 保存到浏览器 localStorage
const saveToStorage = (key, data) => {
  if (!isElectronMain) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`保存 ${key} 失败:`, e);
    }
  }
};

// 模拟 fs 操作（用于浏览器环境）
const browserOperations = {
  existsSync: (filePath) => {
    const key = filePath.includes('banks') ? STORAGE_KEYS.banks : STORAGE_KEYS.questions;
    return localStorage.getItem(key) !== null;
  },
  readFileSync: (filePath, encoding) => {
    const key = filePath.includes('banks') ? STORAGE_KEYS.banks : STORAGE_KEYS.questions;
    return localStorage.getItem(key) || '[]';
  },
  writeFileSync: (filePath, data) => {
    const key = filePath.includes('banks') ? STORAGE_KEYS.banks : STORAGE_KEYS.questions;
    localStorage.setItem(key, data);
  },
  mkdirSync: (dirPath, options) => {
    // 浏览器环境不需要创建目录
  }
};

// 获取正确的 fs 操作对象
const getFsOps = () => {
  if (isElectronMain && fs) {
    return {
      existsSync: (path) => fs.existsSync(path),
      readFileSync: (path, encoding) => fs.readFileSync(path, encoding),
      writeFileSync: (path, data) => fs.writeFileSync(path, data),
      mkdirSync: (path, options) => fs.mkdirSync(path, options)
    };
  }
  return browserOperations;
};

export const useQuestionBankStore = defineStore('questionBank', {
  state: () => ({
    banks: [],
    currentBank: null,
    questions: []
  }),

  getters: {
    getBankById: (state) => (id) => {
      return state.banks.find(bank => bank.id === id);
    },
    
    getQuestionsByBankId: (state) => (bankId) => {
      return state.questions.filter(q => q.bankId === bankId);
    }
  },

  actions: {
    // 初始化加载所有数据
    async init() {
      const fsOps = getFsOps();
      if (!isElectronMain) {
        // 浏览器环境直接从 localStorage 加载
        this.banks = loadFromStorage(STORAGE_KEYS.banks, []);
        this.questions = loadFromStorage(STORAGE_KEYS.questions, []);
      } else {
        // Electron 环境使用 fs
        ensureDir();
        await this.loadBanks();
        await this.loadQuestions();
      }
    },

    // 加载题库列表
    async loadBanks() {
      if (!isElectronMain) {
        this.banks = loadFromStorage(STORAGE_KEYS.banks, []);
        return;
      }
      
      const fsOps = getFsOps();
      const banksFile = require('path').join(getDataDir(), 'banks.json');
      try {
        if (fsOps.existsSync(banksFile)) {
          const data = fsOps.readFileSync(banksFile, 'utf-8');
          this.banks = JSON.parse(data);
        }
      } catch (error) {
        console.error('加载题库失败:', error);
        this.banks = [];
      }
    },

    // 加载所有题目
    async loadQuestions() {
      if (!isElectronMain) {
        this.questions = loadFromStorage(STORAGE_KEYS.questions, []);
        return;
      }
      
      const fsOps = getFsOps();
      const questionsFile = require('path').join(getDataDir(), 'questions.json');
      try {
        if (fsOps.existsSync(questionsFile)) {
          const data = fsOps.readFileSync(questionsFile, 'utf-8');
          this.questions = JSON.parse(data);
        }
      } catch (error) {
        console.error('加载题目失败:', error);
        this.questions = [];
      }
    },

    // 保存题库列表
    async saveBanks() {
      if (!isElectronMain) {
        saveToStorage(STORAGE_KEYS.banks, this.banks);
        return;
      }
      
      const fsOps = getFsOps();
      const banksFile = require('path').join(getDataDir(), 'banks.json');
      try {
        fsOps.writeFileSync(banksFile, JSON.stringify(this.banks, null, 2));
      } catch (error) {
        console.error('保存题库失败:', error);
        throw error;
      }
    },

    // 保存所有题目
    async saveQuestions() {
      if (!isElectronMain) {
        saveToStorage(STORAGE_KEYS.questions, this.questions);
        return;
      }
      
      const fsOps = getFsOps();
      const questionsFile = require('path').join(getDataDir(), 'questions.json');
      try {
        fsOps.writeFileSync(questionsFile, JSON.stringify(this.questions, null, 2));
      } catch (error) {
        console.error('保存题目失败:', error);
        throw error;
      }
    },

    // 创建题库
    async createBank(bankData) {
      const bank = {
        id: `bank_${Date.now()}`,
        name: bankData.name,
        tags: bankData.tags || [],
        questionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.banks.push(bank);
      await this.saveBanks();
      return bank;
    },

    // 更新题库
    async updateBank(bankId, bankData) {
      const index = this.banks.findIndex(b => b.id === bankId);
      if (index !== -1) {
        this.banks[index] = {
          ...this.banks[index],
          name: bankData.name,
          tags: bankData.tags,
          updatedAt: new Date().toISOString()
        };
        await this.saveBanks();
      }
    },

    // 删除题库
    async deleteBank(bankId) {
      this.banks = this.banks.filter(b => b.id !== bankId);
      this.questions = this.questions.filter(q => q.bankId !== bankId);
      await this.saveBanks();
      await this.saveQuestions();
    },

    // 获取所有题库
    async getAllBanks() {
      return this.banks;
    },

    // 添加题目到题库
    async addQuestionsToBank(bankId, questions) {
      const validQuestions = questions.map(q => ({
        ...q,
        bankId,
        id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      this.questions.push(...validQuestions);
      
      // 更新题库的题目数量
      const bank = this.banks.find(b => b.id === bankId);
      if (bank) {
        bank.questionCount = this.questions.filter(q => q.bankId === bankId).length;
        bank.updatedAt = new Date().toISOString();
        await this.saveBanks();
      }
      
      await this.saveQuestions();
      return validQuestions;
    },

    // 获取题库中的题目
    async getQuestionsByBankId(bankId) {
      return this.questions.filter(q => q.bankId === bankId);
    },

    // 更新题目
    async updateQuestion(questionId, questionData) {
      const index = this.questions.findIndex(q => q.id === questionId);
      if (index !== -1) {
        this.questions[index] = {
          ...this.questions[index],
          ...questionData,
          updatedAt: new Date().toISOString()
        };
        await this.saveQuestions();
      }
    },

    // 删除题目
    async deleteQuestion(questionId) {
      const question = this.questions.find(q => q.id === questionId);
      if (question) {
        const bankId = question.bankId;
        this.questions = this.questions.filter(q => q.id !== questionId);
        
        // 更新题库题目数量
        const bank = this.banks.find(b => b.id === bankId);
        if (bank) {
          bank.questionCount = this.questions.filter(q => q.bankId === bankId).length;
          bank.updatedAt = new Date().toISOString();
          await this.saveBanks();
        }
        
        await this.saveQuestions();
      }
    },

    // 获取所有题目
    async getAllQuestions() {
      return this.questions;
    },

    // 根据知识点筛选题目
    async getQuestionsByKnowledgePoint(knowledgePoint) {
      return this.questions.filter(q => q.knowledgePoint === knowledgePoint);
    },

    // 搜索题目
    async searchQuestions(keyword) {
      const lowerKeyword = keyword.toLowerCase();
      return this.questions.filter(q => 
        q.content.toLowerCase().includes(lowerKeyword) ||
        q.knowledgePoint?.toLowerCase().includes(lowerKeyword)
      );
    }
  }
});