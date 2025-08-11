import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { DatabaseManager } from '../database/database';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;
let database: DatabaseManager | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    titleBarStyle: 'default',
    backgroundColor: '#1a1a1a',
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  if (isDev) {
    // Viteの開発サーバーに接続（動的ポート対応）
    mainWindow.loadURL('http://localhost:3013');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  }

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

ipcMain.handle('openExternal', async (_, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle('openFile', async (_, filePath: string) => {
  await shell.openPath(filePath);
});

// File dialog handlers
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
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
  const result = await dialog.showOpenDialog(mainWindow!, {
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
  const result = await dialog.showOpenDialog(mainWindow!, {
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
    const result = await dialog.showSaveDialog(mainWindow!, {
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
    throw error;
  }
});

// データインポート
ipcMain.handle('data:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
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
    throw error;
  }
});

// ファイルアーカイブ機能
ipcMain.handle('file:archive', async (_, filePath: string) => {
  try {
    // ファイルの存在確認
    await fs.access(filePath);
    
    // アーカイブディレクトリのパスを作成
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const archiveDir = path.join(fileDir, 'archive');
    
    // アーカイブディレクトリが存在しない場合は作成
    try {
      await fs.mkdir(archiveDir, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }
    
    // タイムスタンプ付きのファイル名を生成
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5); // YYYY-MM-DDTHH-mm-ss
    const fileExt = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExt);
    const archivedFileName = `${fileNameWithoutExt}_${timestamp}${fileExt}`;
    const archivedFilePath = path.join(archiveDir, archivedFileName);
    
    // ファイルをアーカイブディレクトリに移動
    await fs.rename(filePath, archivedFilePath);
    
    
    return {
      success: true,
      originalPath: filePath,
      archivedPath: archivedFilePath,
      archiveDir: archiveDir
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Puppeteerを使用したサムネイル自動取得
ipcMain.handle('fetch:thumbnail', async (_, boothUrl: string) => {
  let browser;
  try {
    
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
      return thumbnailUrl;
    } else {
      return null;
    }
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    return null;
  }
});