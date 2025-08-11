const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = false;

let mainWindow = null;

// データ保存用のファイルパス
const userDataPath = require('os').homedir();
const dataDir = path.join(userDataPath, 'VRChat-Booth-Manager');
const dataFile = path.join(dataDir, 'data.json');
const archiveDir = path.join(dataDir, 'Archive');

// データディレクトリを作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// アーカイブディレクトリを作成
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

// データを読み込む
let appData = {
  products: [],
  avatars: [],
  settings: {
    autoArchive: false // デフォルトでアーカイブ機能を無効
  }
};

if (fs.existsSync(dataFile)) {
  try {
    const loadedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    // 既存データとデフォルト設定をマージ
    appData = {
      products: loadedData.products || [],
      avatars: loadedData.avatars || [],
      settings: {
        autoArchive: false, // デフォルト値
        ...loadedData.settings // 既存の設定で上書き
      }
    };
    
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


  // ページ読み込み完了後に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // エラーログ
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL);
  });

  const indexPath = path.join(__dirname, 'renderer/index.html');
  
  mainWindow.loadFile(indexPath).then(() => {
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

ipcMain.handle('db:deleteAvatar', async (_, id) => {
  const index = appData.avatars.findIndex(a => a.id === id);
  if (index !== -1) {
    appData.avatars.splice(index, 1);
    saveData();
    return true;
  }
  return false;
});

ipcMain.handle('openExternal', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('openFile', async (_, filePath) => {
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
            resolve({
              success: true,
              thumbnailUrl: ogImageMatch[1]
            });
          } else {
            resolve({
              success: false,
              thumbnailUrl: null
            });
          }
        });
      });
      
      req.on('error', () => resolve({
        success: false,
        thumbnailUrl: null
      }));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          thumbnailUrl: null
        });
      });
    });
  } catch (error) {
    console.error('サムネイル取得エラー:', error);
    return {
      success: false,
      thumbnailUrl: null
    };
  }
});

// ファイルをアーカイブに移動
ipcMain.handle('fs:moveToArchive', async (_, filePath) => {
  try {
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'ファイルが存在しません' };
    }
    
    const fileName = path.basename(filePath);
    const archivePath = path.join(archiveDir, fileName);
    
    // 同名ファイルが既に存在する場合はタイムスタンプを付与
    let finalArchivePath = archivePath;
    if (fs.existsSync(archivePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      finalArchivePath = path.join(archiveDir, `${nameWithoutExt}_${timestamp}${ext}`);
    }
    
    // ファイルを移動（コピー後に元ファイルを削除）
    fs.copyFileSync(filePath, finalArchivePath);
    fs.unlinkSync(filePath);
    
    return { 
      success: true, 
      newPath: finalArchivePath,
      message: `ファイルをアーカイブに移動しました: ${path.basename(finalArchivePath)}`
    };
    
  } catch (error) {
    console.error('ファイル移動エラー:', error);
    return { 
      success: false, 
      error: `ファイル移動に失敗しました: ${error.message}` 
    };
  }
});

// アーカイブディレクトリのパスを取得
ipcMain.handle('fs:getArchiveDir', async () => {
  return archiveDir;
});

// フォルダをアーカイブに移動
ipcMain.handle('fs:moveFolderToArchive', async (_, folderPath) => {
  try {
    
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: 'フォルダが存在しません' };
    }
    
    // フォルダかどうか確認
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) {
      return { success: false, error: '指定されたパスはフォルダではありません' };
    }
    
    const folderName = path.basename(folderPath);
    const archivePath = path.join(archiveDir, folderName);
    
    // 同名フォルダが既に存在する場合はタイムスタンプを付与
    let finalArchivePath = archivePath;
    if (fs.existsSync(archivePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      finalArchivePath = path.join(archiveDir, `${folderName}_${timestamp}`);
    }
    
    // フォルダを移動（コピー後に元フォルダを削除）
    console.log('フォルダをアーカイブにコピー中:', folderPath, '->', finalArchivePath);
    copyFolderRecursive(folderPath, finalArchivePath);
    console.log('元フォルダを削除中:', folderPath);
    deleteFolderRecursive(folderPath);
    console.log('フォルダ移動完了');
    
    return { 
      success: true, 
      newPath: finalArchivePath,
      message: `フォルダをアーカイブに移動しました: ${path.basename(finalArchivePath)}`
    };
    
  } catch (error) {
    console.error('フォルダ移動エラー:', error);
    return { 
      success: false, 
      error: `フォルダ移動に失敗しました: ${error.message}` 
    };
  }
});

// フォルダを再帰的にコピーする関数
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// フォルダを再帰的に削除する関数
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        deleteFolderRecursive(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

// 設定を取得
ipcMain.handle('settings:get', async () => {
  return appData.settings;
});

// 設定を更新
ipcMain.handle('settings:update', async (_, newSettings) => {
  appData.settings = { ...appData.settings, ...newSettings };
  saveData();
  return appData.settings;
});

// ZIPファイル内のUnitypackageファイル一覧を取得
ipcMain.handle('zip:listUnitypackages', async (_, zipPath) => {
  console.log('ZIP処理開始:', zipPath);
  
  try {
    // ファイルの存在確認
    if (!fs.existsSync(zipPath)) {
      console.error('ファイルが存在しません:', zipPath);
      return {
        success: false,
        error: 'ZIPファイルが見つかりません',
        files: []
      };
    }
    
    console.log('adm-zipモジュールを読み込み中...');
    
    // adm-zipを動的にrequire
    let AdmZip;
    try {
      AdmZip = require('adm-zip');
      console.log('adm-zipの読み込み成功');
    } catch (requireError) {
      console.error('adm-zip読み込みエラー:', requireError);
      return {
        success: false,
        error: 'adm-zipモジュールの読み込みに失敗しました',
        files: []
      };
    }
    
    console.log('ZIPファイルを開いています:', zipPath);
    let zip;
    try {
      zip = new AdmZip(zipPath);
      console.log('ZIPファイルの読み込み成功');
    } catch (zipError) {
      console.error('ZIP読み込みエラー:', zipError);
      return {
        success: false,
        error: 'ZIPファイルの読み込みに失敗しました: ' + zipError.message,
        files: []
      };
    }
    
    console.log('エントリを取得中...');
    let entries;
    try {
      entries = zip.getEntries();
      console.log('エントリ数:', entries ? entries.length : 0);
    } catch (entriesError) {
      console.error('エントリ取得エラー:', entriesError);
      return {
        success: false,
        error: 'ZIPエントリの取得に失敗しました',
        files: []
      };
    }
    
    const unitypackageFiles = [];
    if (entries && entries.length > 0) {
      entries.forEach((entry, index) => {
        try {
          console.log(`エントリ ${index}: ${entry.entryName}`);
          if (entry && !entry.isDirectory && entry.entryName) {
            const entryName = entry.entryName.toLowerCase();
            if (entryName.endsWith('.unitypackage')) {
              unitypackageFiles.push({
                name: path.basename(entry.entryName),
                path: entry.entryName,
                size: entry.header && entry.header.size ? entry.header.size : 0
              });
            }
          }
        } catch (entryError) {
          console.error(`エントリ処理エラー ${index}:`, entryError);
        }
      });
    }
    
    console.log('見つかったUnitypackageファイル:', unitypackageFiles.length);
    
    return {
      success: true,
      files: unitypackageFiles
    };
  } catch (error) {
    console.error('ZIP処理エラー詳細:', error);
    console.error('エラースタック:', error.stack);
    return {
      success: false,
      error: error.message || 'Unknown ZIP processing error',
      files: []
    };
  }
});

// ZIPファイルからファイルを抽出
ipcMain.handle('zip:extractFile', async (_, zipPath, filePath, outputPath) => {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    
    // ファイルを抽出
    zip.extractEntryTo(filePath, outputPath, false, true);
    
    return { success: true };
  } catch (error) {
    console.error('ZIPファイル抽出エラー:', error);
    throw error;
  }
});

// ZIPファイルからUnitypackageを抽出
ipcMain.handle('zip:extractUnitypackage', async (_, zipPath, unitypackageEntry, outputDir) => {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    
    console.log('Unitypackage抽出開始:', {
      zipPath,
      unitypackageEntry,
      outputDir
    });
    
    // unitypackageEntryの構造を確認
    if (!unitypackageEntry) {
      throw new Error('unitypackageEntryが指定されていません');
    }
    
    // エントリのパスを取得（複数の可能性を考慮）
    const entryPath = unitypackageEntry.path || unitypackageEntry.entryName || unitypackageEntry.name;
    const entryName = unitypackageEntry.name || path.basename(entryPath);
    
    if (!entryPath) {
      console.error('エントリパスが見つかりません:', unitypackageEntry);
      throw new Error('エントリパスが見つかりません');
    }
    
    console.log('使用するエントリパス:', entryPath);
    console.log('ファイル名:', entryName);
    
    // ZIPファイル内のエントリを確認
    const entries = zip.getEntries();
    const entryNames = entries.map(entry => entry.entryName);
    console.log('ZIP内の全エントリ:', entryNames);
    
    // エントリが実際に存在するかチェック
    const actualEntry = entries.find(entry => 
      entry.entryName === entryPath || 
      entry.entryName.endsWith('/' + entryName) ||
      entry.entryName === entryName
    );
    
    if (!actualEntry) {
      console.error('エントリが見つかりません。期待するパス:', entryPath);
      console.error('利用可能なエントリ:', entryNames);
      throw new Error(`エントリが見つかりません: ${entryPath}`);
    }
    
    console.log('見つかったエントリ:', actualEntry.entryName);
    
    // 出力ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // ファイルを抽出
    const outputPath = path.join(outputDir, entryName);
    zip.extractEntryTo(actualEntry.entryName, outputDir, false, true);
    
    console.log('抽出完了:', outputPath);
    
    return {
      success: true,
      extractedPath: outputPath
    };
  } catch (error) {
    console.error('Unitypackage抽出エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Booth学習データ管理
let boothLearningData = [];

// Booth学習データファイルパス
const learningDataFile = path.join(dataDir, 'booth-learning.json');

// 学習データを読み込む
if (fs.existsSync(learningDataFile)) {
  try {
    boothLearningData = JSON.parse(fs.readFileSync(learningDataFile, 'utf8')) || [];
  } catch (error) {
    console.error('Booth学習データ読み込みエラー:', error);
    boothLearningData = [];
  }
}

// 学習データを保存する
const saveLearningData = () => {
  try {
    fs.writeFileSync(learningDataFile, JSON.stringify(boothLearningData, null, 2));
  } catch (error) {
    console.error('Booth学習データ保存エラー:', error);
  }
};

// Booth学習データのマッピングを追加
ipcMain.handle('booth:learnMapping', async (_, filename, boothUrl) => {
  try {
    console.log('学習データ追加:', { filename, boothUrl });
    
    // 既存データをチェック
    const existingIndex = boothLearningData.findIndex(item => 
      item.filename === filename && item.boothUrl === boothUrl
    );
    
    if (existingIndex === -1) {
      // 新規追加
      boothLearningData.push({
        filename,
        boothUrl,
        learnedAt: new Date().toISOString()
      });
      saveLearningData();
      console.log('学習データを追加しました');
    } else {
      console.log('学習データは既に存在します');
    }
    
    return { success: true };
  } catch (error) {
    console.error('学習データ追加エラー:', error);
    return { success: false, error: error.message };
  }
});

