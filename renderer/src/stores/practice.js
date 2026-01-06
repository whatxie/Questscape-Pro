import { defineStore } from 'pinia';

// 检测是否在 Electron 主进程中（有 fs 模块）
const isElectronMain = typeof window !== 'undefined' && window.electronAPI?.isMain;

// 浏览器存储键名
const STORAGE_KEYS = {
  practiceRecords: 'questscape_practice_records',
  wrongQuestions: 'questscape_wrong_questions',
  favorites: 'questscape_favorites'
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

// 动态加载 fs 和 path（仅 Electron 环境）
let fs = null;
let path = null;

const loadElectronModules = () => {
  if (isElectronMain && !fs) {
    try {
      fs = require('fs');
      path = require('path');
    } catch (e) {
      console.warn('无法加载 fs/path 模块:', e);
    }
  }
};

const getDataDir = () => {
  loadElectronModules();
  if (isElectronMain && fs && path) {
    const electronPath = window.electronAPI?.getAppPath?.();
    return electronPath ? `${electronPath}/data` : path.join(process.cwd(), 'data');
  }
  return null;
};

const ensureDir = () => {
  const dataDir = getDataDir();
  if (dataDir && fs) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
};

// 浏览器环境的文件系统操作模拟
const browserOperations = {
  existsSync: (filePath) => {
    if (filePath.includes('practice_records')) {
      return localStorage.getItem(STORAGE_KEYS.practiceRecords) !== null;
    } else if (filePath.includes('wrong_questions')) {
      return localStorage.getItem(STORAGE_KEYS.wrongQuestions) !== null;
    } else if (filePath.includes('favorites')) {
      return localStorage.getItem(STORAGE_KEYS.favorites) !== null;
    }
    return false;
  },
  readFileSync: (filePath, encoding) => {
    if (filePath.includes('practice_records')) {
      return localStorage.getItem(STORAGE_KEYS.practiceRecords) || '[]';
    } else if (filePath.includes('wrong_questions')) {
      return localStorage.getItem(STORAGE_KEYS.wrongQuestions) || '[]';
    } else if (filePath.includes('favorites')) {
      return localStorage.getItem(STORAGE_KEYS.favorites) || '[]';
    }
    return '[]';
  },
  writeFileSync: (filePath, data) => {
    if (filePath.includes('practice_records')) {
      localStorage.setItem(STORAGE_KEYS.practiceRecords, data);
    } else if (filePath.includes('wrong_questions')) {
      localStorage.setItem(STORAGE_KEYS.wrongQuestions, data);
    } else if (filePath.includes('favorites')) {
      localStorage.setItem(STORAGE_KEYS.favorites, data);
    }
  }
};

const getFsOps = () => {
  if (isElectronMain && fs) {
    loadElectronModules();
    return {
      existsSync: (path) => fs.existsSync(path),
      readFileSync: (path, encoding) => fs.readFileSync(path, encoding),
      writeFileSync: (path, data) => fs.writeFileSync(path, data),
      mkdirSync: (path, options) => fs.mkdirSync(path, options)
    };
  }
  return browserOperations;
};

export const usePracticeStore = defineStore('practice', {
  state: () => ({
    practiceRecords: [], // 练习记录
    wrongQuestions: [], // 错题本
    favorites: [], // 收藏的题目
    currentPractice: null // 当前练习状态
  }),

  getters: {
    // 获取所有错题
    getAllWrongQuestions: (state) => {
      return state.wrongQuestions;
    },
    
    // 按知识点分组错题
    getWrongQuestionsGrouped: (state) => {
      const grouped = {};
      state.wrongQuestions.forEach(q => {
        const key = q.knowledgePoint || '未分类';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(q);
      });
      return grouped;
    },
    
    // 计算正确率
    getAccuracy: (state) => {
      if (state.practiceRecords.length === 0) return 0;
      const total = state.practiceRecords.reduce((sum, r) => sum + r.totalCount, 0);
      const correct = state.practiceRecords.reduce((sum, r) => sum + r.correctCount, 0);
      return total > 0 ? (correct / total * 100) : 0;
    },
    
    // 获取统计数据
    getStats: () => {
      return {
        totalPractices: 0,
        totalQuestions: 0,
        accuracy: 0,
        totalWrong: 0
      };
    }
  },

  actions: {
    // 初始化
    async init() {
      if (!isElectronMain) {
        // 浏览器环境直接从 localStorage 加载
        this.practiceRecords = loadFromStorage(STORAGE_KEYS.practiceRecords, []);
        this.wrongQuestions = loadFromStorage(STORAGE_KEYS.wrongQuestions, []);
        this.favorites = loadFromStorage(STORAGE_KEYS.favorites, []);
      } else {
        // Electron 环境使用 fs
        loadElectronModules();
        ensureDir();
        await this.loadPracticeRecords();
        await this.loadWrongQuestions();
        await this.loadFavorites();
      }
    },

    // 加载练习记录
    async loadPracticeRecords() {
      if (!isElectronMain) {
        this.practiceRecords = loadFromStorage(STORAGE_KEYS.practiceRecords, []);
        return;
      }
      
      const fsOps = getFsOps();
      loadElectronModules();
      const file = path.join(getDataDir(), 'practice_records.json');
      try {
        if (fsOps.existsSync(file)) {
          const data = fsOps.readFileSync(file, 'utf-8');
          this.practiceRecords = JSON.parse(data);
        }
      } catch (error) {
        console.error('加载练习记录失败:', error);
        this.practiceRecords = [];
      }
    },

    // 加载错题本
    async loadWrongQuestions() {
      if (!isElectronMain) {
        this.wrongQuestions = loadFromStorage(STORAGE_KEYS.wrongQuestions, []);
        return;
      }
      
      const fsOps = getFsOps();
      loadElectronModules();
      const file = path.join(getDataDir(), 'wrong_questions.json');
      try {
        if (fsOps.existsSync(file)) {
          const data = fsOps.readFileSync(file, 'utf-8');
          this.wrongQuestions = JSON.parse(data);
        }
      } catch (error) {
        console.error('加载错题本失败:', error);
        this.wrongQuestions = [];
      }
    },

    // 加载收藏
    async loadFavorites() {
      if (!isElectronMain) {
        this.favorites = loadFromStorage(STORAGE_KEYS.favorites, []);
        return;
      }
      
      const fsOps = getFsOps();
      loadElectronModules();
      const file = path.join(getDataDir(), 'favorites.json');
      try {
        if (fsOps.existsSync(file)) {
          const data = fsOps.readFileSync(file, 'utf-8');
          this.favorites = JSON.parse(data);
        }
      } catch (error) {
        console.error('加载收藏失败:', error);
        this.favorites = [];
      }
    },

    // 保存练习记录
    async savePracticeRecords() {
      if (!isElectronMain) {
        saveToStorage(STORAGE_KEYS.practiceRecords, this.practiceRecords);
        return;
      }
      
      const fsOps = getFsOps();
      loadElectronModules();
      const file = path.join(getDataDir(), 'practice_records.json');
      try {
        fsOps.writeFileSync(file, JSON.stringify(this.practiceRecords, null, 2));
      } catch (error) {
        console.error('保存练习记录失败:', error);
      }
    },

    // 保存错题本
    async saveWrongQuestions() {
      if (!isElectronMain) {
        saveToStorage(STORAGE_KEYS.wrongQuestions, this.wrongQuestions);
        return;
      }
      
      const fsOps = getFsOps();
      loadElectronModules();
      const file = path.join(getDataDir(), 'wrong_questions.json');
      try {
        fsOps.writeFileSync(file, JSON.stringify(this.wrongQuestions, null, 2));
      } catch (error) {
        console.error('保存错题本失败:', error);
      }
    },

    // 保存收藏
    async saveFavorites() {
      if (!isElectronMain) {
        saveToStorage(STORAGE_KEYS.favorites, this.favorites);
        return;
      }
      
      const fsOps = getFsOps();
      loadElectronModules();
      const file = path.join(getDataDir(), 'favorites.json');
      try {
        fsOps.writeFileSync(file, JSON.stringify(this.favorites, null, 2));
      } catch (error) {
        console.error('保存收藏失败:', error);
      }
    },

    // 开始练习
    async startPractice(options) {
      this.currentPractice = {
        mode: options.mode, // 'sequence', 'random', 'exam', 'wrong'
        questionIds: options.questionIds || [],
        bankId: options.bankId,
        startTime: new Date().toISOString(),
        currentIndex: 0,
        answers: [],
        wrongQuestions: []
      };
      return this.currentPractice;
    },

    // 提交答案
    async submitAnswer(questionId, answer, isCorrect, questionData) {
      if (!this.currentPractice) return;
      
      const record = {
        questionId,
        answer,
        isCorrect,
        timestamp: new Date().toISOString()
      };
      
      this.currentPractice.answers.push(record);
      
      // 如果答错，添加到错题本
      if (!isCorrect) {
        await this.addToWrongQuestions(questionData || { id: questionId });
      }
      
      this.currentPractice.currentIndex++;
      return record;
    },

    // 结束练习
    async endPractice() {
      if (!this.currentPractice) return null;
      
      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(this.currentPractice.startTime);
      
      const correctCount = this.currentPractice.answers.filter(a => a.isCorrect).length;
      const totalCount = this.currentPractice.answers.length;
      const accuracy = totalCount > 0 ? (correctCount / totalCount * 100) : 0;
      
      const practiceRecord = {
        id: `pr_${Date.now()}`,
        mode: this.currentPractice.mode,
        bankId: this.currentPractice.bankId,
        startTime: this.currentPractice.startTime,
        endTime,
        duration,
        totalCount,
        correctCount,
        accuracy,
        wrongCount: totalCount - correctCount
      };
      
      this.practiceRecords.push(practiceRecord);
      await this.savePracticeRecords();
      
      const result = this.currentPractice;
      this.currentPractice = null;
      
      return { record: practiceRecord, details: result };
    },

    // 添加到错题本
    async addToWrongQuestions(question) {
      // 检查是否已存在
      const exists = this.wrongQuestions.find(q => q.id === question.id);
      if (exists) {
        exists.wrongCount = (exists.wrongCount || 1) + 1;
        exists.lastWrongTime = new Date().toISOString();
      } else {
        this.wrongQuestions.push({
          ...question,
          wrongCount: 1,
          firstWrongTime: new Date().toISOString(),
          lastWrongTime: new Date().toISOString()
        });
      }
      await this.saveWrongQuestions();
    },

    // 从错题本移除
    async removeFromWrongQuestions(questionId) {
      this.wrongQuestions = this.wrongQuestions.filter(q => q.id !== questionId);
      await this.saveWrongQuestions();
    },

    // 清空错题本
    async clearWrongQuestions() {
      this.wrongQuestions = [];
      await this.saveWrongQuestions();
    },

    // 添加到收藏
    async addToFavorites(question) {
      const exists = this.favorites.find(q => q.id === question.id);
      if (!exists) {
        this.favorites.push({
          ...question,
          addTime: new Date().toISOString()
        });
        await this.saveFavorites();
      }
    },

    // 从收藏移除
    async removeFromFavorites(questionId) {
      this.favorites = this.favorites.filter(q => q.id !== questionId);
      await this.saveFavorites();
    },

    // 是否已收藏
    isFavorited(questionId) {
      return this.favorites.some(q => q.id === questionId);
    },

    // 获取统计数据
    async getStats() {
      const totalPractices = this.practiceRecords.length;
      const totalQuestions = this.practiceRecords.reduce((sum, r) => sum + r.totalCount, 0);
      const accuracy = this.getAccuracy;
      const totalWrong = this.practiceRecords.reduce((sum, r) => sum + r.wrongCount, 0);
      
      return {
        totalPractices,
        totalQuestions,
        accuracy: Math.round(accuracy),
        totalWrong
      };
    }
  }
});