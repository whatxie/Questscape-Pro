const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;
let serverProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '题境随行',
    icon: path.join(__dirname, 'resources/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#00000000',
    frame: false,
    transparent: false,
    resizable: true,
    maximizable: true,
    minimizable: true,
    // Windows 11 高级感配置
    visualEffectState: 'active',
    backgroundMaterial: 'acrylic'
  });

  // 根据环境加载不同页面
  const startUrl = isDev 
    ? 'http://localhost:8080' 
    : `file://${path.join(__dirname, 'renderer/index.html')}`;
    
  mainWindow.loadURL(startUrl);

  // 打开开发者工具（开发模式）
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口事件处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 窗口控制
  ipcMain.handle('minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('close', () => {
    mainWindow.close();
  });
}

// 应用启动
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 应用退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 文件选择对话框
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    ...options
  });
  return result.filePaths;
});

// 保存文件对话框
ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    ...options
  });
  return result.filePath;
});

// 读取本地文件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 写入本地文件
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 检查文件是否存在
ipcMain.handle('file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

// 获取应用数据路径
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// 获取桌面路径
ipcMain.handle('get-desktop-path', () => {
  return app.getPath('desktop');
});