const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const isDev = false; // ポータブル版では常に本番モード
const { DatabaseManager } = require('./dist/src/database/database');
const puppeteer = require('puppeteer');

let mainWindow = null;
let database = null;

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
    backgroundColor: '#1a1a1a',
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // ポータブル版では常にローカルファイルを読み込み
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  database = new DatabaseManager();
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

// IPC handlers
ipcMain.handle('db:getProducts', async () => {
  return database?.getProducts() || [];
});

ipcMain.handle('db:addProduct', async (_, product) => {
  return database?.addProduct(product);
});

ipcMain.handle('db:updateProduct', async (_, id, product) => {
  return database?.updateProduct(id, product);
});

ipcMain.handle('db:deleteProduct', async (_, id) => {
  return database?.deleteProduct(id);
});

ipcMain.handle('db:getAvatars', async () => {
  return database?.getAvatars() || [];
});

ipcMain.handle('db:addAvatar', async (_, avatar) => {
  return database?.addAvatar(avatar);
});

ipcMain.handle('openExternal', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('openFile', async (_, filePath) => {
  try {
    const fs = require('fs');
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが見つかりません:\n${filePath}\n\nファイルが移動または削除されていないか確認してください。`);
    }
    
    const result = await shell.openPath(filePath);
    console.log('openPath result:', result);
    
    // openPathは空文字列を返すと成功、エラーメッセージを返すと失敗
    if (result) {
      // エラーが返された場合
      if (result.includes('no application') || result.includes('No application')) {
        throw new Error('Unityがインストールされていないか、.unitypackageファイルに関連付けられていません。\n\nUnity Hubをインストールして、プロジェクトを開いてから再度お試しください。');
      }
      throw new Error(`ファイルを開けませんでした: ${result}`);
    }
    
    // 成功した場合は何も返さない
    return;
  } catch (error) {
    console.error('Failed to open file:', error);
    throw error;
  }
});

ipcMain.handle('openPath', async (_, filePath) => {
  try {
    const result = await shell.openPath(filePath);
    console.log('openPath result:', result);
    
    if (result) {
      if (result.includes('no application') || result.includes('No application')) {
        throw new Error('Unityがインストールされていないか、.unitypackageファイルに関連付けられていません。\n\nUnity Hubをインストールして、プロジェクトを開いてから再度お試しください。');
      }
      throw new Error(`ファイルを開けませんでした: ${result}`);
    }
    
    return;
  } catch (error) {
    console.error('Failed to open file:', error);
    throw error;
  }
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

ipcMain.handle('dialog:selectMultipleFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Unity Package', extensions: ['unitypackage'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled) {
    return [];
  }
  
  return result.filePaths;
});

ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// データエクスポート
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
    
    const products = database?.getProducts() || [];
    const avatars = database?.getAvatars() || [];
    
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products,
      avatars
    };
    
    const fs = require('fs');
    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
    
    return result.filePath;
  } catch (error) {
    console.error('データエクスポートエラー:', error);
    throw error;
  }
});

// データインポート
ipcMain.handle('data:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return null;
    }
    
    const fs = require('fs');
    const fileContent = fs.readFileSync(result.filePaths[0], 'utf8');
    const importData = JSON.parse(fileContent);
    
    // データ構造の検証
    if (!importData.products || !importData.avatars) {
      throw new Error('無効なデータ形式です');
    }
    
    // インポート処理
    let importedProducts = 0;
    let importedAvatars = 0;
    
    // アバターをインポート
    for (const avatar of importData.avatars) {
      const { id, created_at, ...avatarData } = avatar;
      await database?.addAvatar(avatarData);
      importedAvatars++;
    }
    
    // 商品をインポート
    for (const product of importData.products) {
      const { id, created_at, updated_at, ...productData } = product;
      await database?.addProduct(productData);
      importedProducts++;
    }
    
    return {
      products: importedProducts,
      avatars: importedAvatars
    };
  } catch (error) {
    console.error('データインポートエラー:', error);
    throw error;
  }
});

// Puppeteerを使用したサムネイル自動取得
ipcMain.handle('fetch:thumbnail', async (_, boothUrl) => {
  let browser;
  try {
    console.log('Puppeteerでサムネイル取得開始:', boothUrl);
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // ユーザーエージェントを設定（ブロック回避）
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // ページを開く（タイムアウト30秒）
    await page.goto(boothUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // OG:imageタグからサムネイルURLを取得
    const thumbnailUrl = await page.evaluate(() => {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.getAttribute('content')) {
        return ogImage.getAttribute('content');
      }
      
      // 代替: twitter:imageタグを試行
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage && twitterImage.getAttribute('content')) {
        return twitterImage.getAttribute('content');
      }
      
      return null;
    });
    
    await browser.close();
    
    if (thumbnailUrl) {
      console.log('サムネイル取得成功:', thumbnailUrl);
      return thumbnailUrl;
    } else {
      console.log('サムネイル取得失敗: OG:imageタグが見つかりません');
      return null;
    }
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Puppeteerエラー:', error);
    return null;
  }
});