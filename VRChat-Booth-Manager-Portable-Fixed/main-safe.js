const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const isDev = false;

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    backgroundColor: '#1a1a1a'
  });

  // ローカルファイルを読み込み
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// データベース機能をモックで置き換え（エラー回避）
ipcMain.handle('db:getProducts', async () => {
  console.log('Database disabled - returning empty array');
  return [];
});

ipcMain.handle('db:addProduct', async (_, product) => {
  console.log('Database disabled - product not saved:', product.name);
  return 1; // 仮のID
});

ipcMain.handle('db:updateProduct', async (_, id, product) => {
  console.log('Database disabled - product not updated:', product.name);
  return true;
});

ipcMain.handle('db:deleteProduct', async (_, id) => {
  console.log('Database disabled - product not deleted');
  return true;
});

ipcMain.handle('db:getAvatars', async () => {
  console.log('Database disabled - returning empty array');
  return [];
});

ipcMain.handle('db:addAvatar', async (_, avatar) => {
  console.log('Database disabled - avatar not saved:', avatar.name);
  return 1; // 仮のID
});

ipcMain.handle('openExternal', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('openFile', async (_, filePath) => {
  await shell.openPath(filePath);
});

// File dialog handlers
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Unity Package', extensions: ['unitypackage'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// データエクスポート（モック）
ipcMain.handle('data:export', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'vrchat-booth-data.json',
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return null;
    }
    
    const mockData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products: [],
      avatars: [],
      note: 'This is a safe mode export - no actual data saved'
    };
    
    const fs = require('fs');
    fs.writeFileSync(result.filePath, JSON.stringify(mockData, null, 2));
    
    return result.filePath;
  } catch (error) {
    console.error('データエクスポートエラー:', error);
    throw error;
  }
});

// サムネイル取得（モック）
ipcMain.handle('fetch:thumbnail', async (_, boothUrl) => {
  console.log('Thumbnail fetch disabled - returning null for:', boothUrl);
  return null;
});

console.log('=== VRChat Booth Manager - Safe Mode ===');
console.log('Database and Puppeteer features are disabled');
console.log('This version should run without dependencies issues');
console.log('=======================================');