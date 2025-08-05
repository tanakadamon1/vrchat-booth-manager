const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = false;

let mainWindow = null;

// データ保存用のファイルパス
const userDataPath = require('os').homedir();
const dataDir = path.join(userDataPath, 'VRChat-Booth-Manager');
const dataFile = path.join(dataDir, 'data.json');

// データディレクトリを作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// データを読み込む
let appData = {
  products: [],
  avatars: []
};

if (fs.existsSync(dataFile)) {
  try {
    appData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    // データ形式の互換性を確保
    if (appData.products) {
      appData.products = appData.products.map(product => ({
        ...product,
        // avatar_idsが配列の場合は文字列に変換
        avatar_ids: Array.isArray(product.avatar_ids) 
          ? product.avatar_ids.join(',') 
          : (product.avatar_ids || '')
      }));
    }
  } catch (error) {
    console.error('データ読み込みエラー:', error);
  }
}

// データを保存する
const saveData = () => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(appData, null, 2));
    console.log('データを保存しました:', dataFile);
  } catch (error) {
    console.error('データ保存エラー:', error);
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    backgroundColor: '#1a1a1a',
    show: false  // 最初は非表示にして読み込み完了後に表示
  });

  // 開発者ツールを開く（デバッグ用）
  mainWindow.webContents.openDevTools();

  // ページ読み込み完了後に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✓ Window is now visible');
  });

  // エラーログ
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL);
  });

  const indexPath = path.join(__dirname, 'renderer/index.html');
  console.log('📁 Loading file:', indexPath);
  
  mainWindow.loadFile(indexPath).then(() => {
    console.log('✓ File loaded successfully');
  }).catch((error) => {
    console.error('❌ Failed to load file:', error);
  });

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

// JSONファイルベースのデータベース機能
ipcMain.handle('db:getProducts', async () => {
  return appData.products || [];
});

ipcMain.handle('db:addProduct', async (_, product) => {
  const id = Date.now();
  const newProduct = {
    id,
    ...product,
    // avatar_idsを文字列形式に変換（SQLite版との互換性のため）
    avatar_ids: Array.isArray(product.avatar_ids) ? product.avatar_ids.join(',') : (product.avatar_ids || ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  appData.products.push(newProduct);
  saveData();
  return id;
});

ipcMain.handle('db:updateProduct', async (_, id, product) => {
  const index = appData.products.findIndex(p => p.id === id);
  if (index !== -1) {
    appData.products[index] = {
      ...appData.products[index],
      ...product,
      // avatar_idsを文字列形式に変換（SQLite版との互換性のため）
      avatar_ids: Array.isArray(product.avatar_ids) ? product.avatar_ids.join(',') : (product.avatar_ids || ''),
      updated_at: new Date().toISOString()
    };
    saveData();
    return true;
  }
  return false;
});

ipcMain.handle('db:deleteProduct', async (_, id) => {
  const index = appData.products.findIndex(p => p.id === id);
  if (index !== -1) {
    appData.products.splice(index, 1);
    saveData();
    return true;
  }
  return false;
});

ipcMain.handle('db:getAvatars', async () => {
  return appData.avatars || [];
});

ipcMain.handle('db:addAvatar', async (_, avatar) => {
  const id = Date.now();
  const newAvatar = {
    id,
    ...avatar,
    created_at: new Date().toISOString()
  };
  appData.avatars.push(newAvatar);
  saveData();
  return id;
});

ipcMain.handle('openExternal', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('openFile', async (_, filePath) => {
  console.log('Opening file from main process:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  await shell.openPath(filePath);
});

// ファイル存在確認
ipcMain.handle('fs:exists', async (_, filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('File existence check error:', error);
    return false;
  }
});

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
  
  const folderPath = result.filePaths[0];
  
  // フォルダ内の.unitypackageファイルを検索
  try {
    const files = fs.readdirSync(folderPath);
    const unityPackageFiles = files
      .filter(file => file.toLowerCase().endsWith('.unitypackage'))
      .map(file => path.join(folderPath, file));
    
    return {
      folderPath: folderPath,
      folderName: path.basename(folderPath),
      files: unityPackageFiles
    };
  } catch (error) {
    console.error('フォルダ読み込みエラー:', error);
    return {
      folderPath: folderPath,
      folderName: path.basename(folderPath),
      files: [],
      error: error.message
    };
  }
});

// ファイルまたはフォルダを選択（統合版）
ipcMain.handle('dialog:selectFilesOrFolders', async () => {
  // まずファイル選択ダイアログを試す
  let result = await dialog.showOpenDialog(mainWindow, {
    title: 'ファイルまたはフォルダを選択',
    buttonLabel: '選択',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Unity Package', extensions: ['unitypackage'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  // ファイルが選択されなかった場合、フォルダ選択を試みる
  if (result.canceled || result.filePaths.length === 0) {
    result = await dialog.showOpenDialog(mainWindow, {
      title: 'フォルダを選択',
      buttonLabel: '選択',
      properties: ['openDirectory']
    });
  }
  
  if (result.canceled) {
    return { type: null, paths: [] };
  }
  
  // 選択されたものがファイルかフォルダかを判定
  const selectedPaths = result.filePaths;
  if (selectedPaths.length > 0) {
    try {
      const stats = fs.statSync(selectedPaths[0]);
      if (stats.isDirectory()) {
        // フォルダが選択された場合、中の.unitypackageファイルを探す
        const folderPath = selectedPaths[0];
        const files = fs.readdirSync(folderPath);
        const unityPackageFiles = files
          .filter(file => file.toLowerCase().endsWith('.unitypackage'))
          .map(file => path.join(folderPath, file));
        
        return {
          type: 'folder',
          folderPath: folderPath,
          folderName: path.basename(folderPath),
          files: unityPackageFiles
        };
      } else {
        // ファイルが選択された場合
        const unityPackageFiles = selectedPaths.filter(filePath => 
          filePath.toLowerCase().endsWith('.unitypackage')
        );
        
        return {
          type: 'files',
          files: unityPackageFiles
        };
      }
    } catch (error) {
      console.error('Error checking path:', error);
      return { type: null, paths: [] };
    }
  }
  
  return { type: null, paths: [] };
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
    
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products: appData.products,
      avatars: appData.avatars
    };
    
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
    
    const fileContent = fs.readFileSync(result.filePaths[0], 'utf8');
    const importData = JSON.parse(fileContent);
    
    if (!importData.products || !importData.avatars) {
      throw new Error('無効なデータ形式です');
    }
    
    let importedProducts = 0;
    let importedAvatars = 0;
    
    // アバターをインポート
    for (const avatar of importData.avatars) {
      const { id, created_at, ...avatarData } = avatar;
      const newId = Date.now() + importedAvatars;
      appData.avatars.push({
        id: newId,
        ...avatarData,
        created_at: new Date().toISOString()
      });
      importedAvatars++;
    }
    
    // 商品をインポート
    for (const product of importData.products) {
      const { id, created_at, updated_at, ...productData } = product;
      const newId = Date.now() + importedProducts;
      appData.products.push({
        id: newId,
        ...productData,
        // avatar_idsを文字列形式に変換
        avatar_ids: Array.isArray(productData.avatar_ids) 
          ? productData.avatar_ids.join(',') 
          : (productData.avatar_ids || ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      importedProducts++;
    }
    
    saveData();
    
    return {
      products: importedProducts,
      avatars: importedAvatars
    };
  } catch (error) {
    console.error('データインポートエラー:', error);
    throw error;
  }
});

// サムネイル取得（シンプル版）
ipcMain.handle('fetch:thumbnail', async (_, boothUrl) => {
  console.log('サムネイル取得（簡略版）:', boothUrl);
  // Puppeteerを使わずに、基本的なOG:image取得を試行
  try {
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve) => {
      const client = boothUrl.startsWith('https') ? https : http;
      
      const req = client.get(boothUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const ogImageMatch = data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
          if (ogImageMatch) {
            resolve(ogImageMatch[1]);
          } else {
            resolve(null);
          }
        });
      });
      
      req.on('error', () => resolve(null));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve(null);
      });
    });
  } catch (error) {
    console.error('サムネイル取得エラー:', error);
    return null;
  }
});

console.log('=== VRChat Booth Manager - JSONファイル版 ===');
console.log('データ保存先:', dataFile);
console.log('better-sqlite3を使わないシンプル版です');
console.log('=======================================');