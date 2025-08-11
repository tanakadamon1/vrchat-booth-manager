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
  },
  boothMappings: {} // ファイル名 -> Booth URL のマッピング
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
      },
      boothMappings: loadedData.boothMappings || {} // Boothマッピングを読み込み
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

// ファイル名からBooth商品を検索（簡単版）
ipcMain.handle('booth:searchByFilename', async (_, filename) => {
  console.log('▓▓▓ MAIN PROCESS: Booth検索開始 ▓▓▓');
  console.log('▓▓▓ 受信したファイル名:', filename);
  console.log('▓▓▓ 現在時刻:', new Date().toISOString());
  
  // 緊急デバッグ：ファイルに書き込み
  require('fs').appendFileSync('C:\\Users\\kizan\\change_management\\debug.log', 
    `[${new Date().toISOString()}] メインプロセス開始: ${filename}\n`);
  
  // デバッグ: 結果を返す直前にログ
  const logResult = (result) => {
    console.log('▓▓▓ 検索結果を返します:', JSON.stringify(result, null, 2));
    return result;
  };
  
  try {
    // ファイル名からキーワードを抽出
    const baseFilename = filename.replace(/\.(unitypackage|zip|rar)$/i, '');
    const keywords = baseFilename.split(/[_\-\s]+/).filter(word => word.length > 1);
    
    console.log('抽出キーワード:', keywords);
    
    // デバッグログをファイルに追記
    require('fs').appendFileSync('C:\\Users\\kizan\\change_management\\debug.log', 
      `  baseFilename: ${baseFilename}\n  keywords: ${JSON.stringify(keywords)}\n`);
    
    const manualTestResults = [];
    
    // 1. 学習済みマッピングをチェック
    console.log('=== 学習済みマッピングチェック ===');
    console.log('検索対象ファイル名:', baseFilename);
    console.log('現在のマッピング全体:', JSON.stringify(appData.boothMappings, null, 2));
    console.log('マッピング内のキー一覧:', Object.keys(appData.boothMappings));
    console.log('対象キーの存在チェック:', baseFilename, 'exists:', !!appData.boothMappings[baseFilename]);
    
    if (appData.boothMappings[baseFilename]) {
      console.log('学習済み結果発見:', baseFilename, '->', appData.boothMappings[baseFilename]);
      manualTestResults.push({
        url: appData.boothMappings[baseFilename],
        title: `${baseFilename} - 学習済み`,
        query: keywords[0] || baseFilename
      });
      
      return logResult({
        success: true,
        results: manualTestResults,
        keywords: keywords
      });
    } else {
      console.log('学習済み結果なし。高度なマッチング検索を試します...');
      
      // より柔軟なマッチング検索
      const normalizeForMatching = (str) => {
        return str
          .toLowerCase()
          .replace(/[_\s\-\.]/g, '') // アンダースコア、スペース、ハイフン、ドットを削除
          .replace(/v?\d+(\.\d+)*(\.\d+)?/g, '') // バージョン番号を削除 (v1.0.9, v109, 1.2など)
          .replace(/\(.*?\)/g, '') // 括弧内を削除
          .replace(/type[a-z]/g, '') // type-a, type_a などを削除
          .replace(/men|women/g, '') // men, womenを削除
          .replace(/psd|png|jpg|jpeg|zip|rar|unitypackage/g, '') // ファイル拡張子を削除
          .trim();
      };
      
      const normalizedSearchName = normalizeForMatching(baseFilename);
      console.log('正規化された検索名:', normalizedSearchName);
      
      // デバッグログを追加
      require('fs').appendFileSync('C:\\Users\\kizan\\change_management\\debug.log', 
        `  正規化された検索名: ${normalizedSearchName}\n`);
      
      // 1. 部分一致での検索
      for (const [mappedFilename, mappedUrl] of Object.entries(appData.boothMappings)) {
        if (mappedFilename.includes(baseFilename) || baseFilename.includes(mappedFilename)) {
          console.log('部分一致発見:', mappedFilename, '->', mappedUrl);
          manualTestResults.push({
            url: mappedUrl,
            title: `${mappedFilename} - 部分一致`,
            query: keywords[0] || baseFilename
          });
          
          return logResult({
            success: true,
            results: manualTestResults,
            keywords: keywords
          });
        }
      }
      
      // 2. 正規化後の類似度マッチング
      let bestMatch = null;
      let bestScore = 0;
      
      for (const [mappedFilename, mappedUrl] of Object.entries(appData.boothMappings)) {
        const normalizedMapped = normalizeForMatching(mappedFilename);
        
        // デバッグ：Fluffy_Bob.psdの場合のみ詳細ログ
        if (mappedFilename.includes('Fluffy')) {
          require('fs').appendFileSync('C:\\Users\\kizan\\change_management\\debug.log', 
            `    ${mappedFilename} -> ${normalizedMapped}\n`);
        }
        
        // A. 前方一致での類似度計算
        const commonLength = Math.min(normalizedSearchName.length, normalizedMapped.length);
        let prefixMatchScore = 0;
        
        for (let i = 0; i < commonLength; i++) {
          if (normalizedSearchName[i] === normalizedMapped[i]) {
            prefixMatchScore++;
          } else {
            break; // 一致しなくなったら終了
          }
        }
        
        const prefixSimilarity = prefixMatchScore / Math.max(normalizedSearchName.length, normalizedMapped.length);
        
        // B. キーワード一致での類似度計算
        const searchWords = normalizedSearchName.match(/[a-z]{3,}/g) || [];
        const mappedWords = normalizedMapped.match(/[a-z]{3,}/g) || [];
        
        let keywordMatches = 0;
        for (const searchWord of searchWords) {
          for (const mappedWord of mappedWords) {
            if (searchWord.includes(mappedWord) || mappedWord.includes(searchWord)) {
              keywordMatches++;
              break;
            }
          }
        }
        
        const keywordSimilarity = keywordMatches / Math.max(searchWords.length, mappedWords.length, 1);
        
        // C. 最終スコア計算（前方一致60% + キーワード一致40%）
        const finalSimilarity = (prefixSimilarity * 0.6) + (keywordSimilarity * 0.4);
        
        console.log(`類似度チェック: ${mappedFilename}`);
        console.log(`  正規化: "${normalizedMapped}"`);
        console.log(`  前方一致: ${prefixSimilarity.toFixed(2)} キーワード: ${keywordSimilarity.toFixed(2)} 最終: ${finalSimilarity.toFixed(2)}`);
        
        // デバッグ：Fluffy_Bob.psdの最終スコアをログ
        if (mappedFilename.includes('Fluffy')) {
          require('fs').appendFileSync('C:\\Users\\kizan\\change_management\\debug.log', 
            `      最終スコア: ${finalSimilarity.toFixed(3)}\n`);
        }
        
        // 35%以上の類似度があれば候補とする（さらに閾値を下げました）
        if (finalSimilarity > 0.35 && finalSimilarity > bestScore) {
          bestScore = finalSimilarity;
          bestMatch = { filename: mappedFilename, url: mappedUrl };
        }
      }
      
      if (bestMatch) {
        console.log('類似マッチ発見:', bestMatch.filename, '->', bestMatch.url, 'スコア:', bestScore.toFixed(2));
        manualTestResults.push({
          url: bestMatch.url,
          title: `${bestMatch.filename} - 類似マッチ (${Math.round(bestScore * 100)}%)`,
          query: keywords[0] || baseFilename
        });
        
        return logResult({
          success: true,
          results: manualTestResults,
          keywords: keywords
        });
      }
    }
    
    // 2. 学習済み結果がない場合、検索リンクを返す
    console.log('学習済み結果なし、検索リンクを返します');
    manualTestResults.push({
      url: 'https://booth.pm/search/' + encodeURIComponent(keywords[0] || baseFilename),
      title: `"${keywords[0] || baseFilename}" の検索結果（Boothで確認してください）`,
      query: keywords[0] || baseFilename
    });
    
    return {
      success: true,
      results: manualTestResults,
      keywords: keywords
    };
    
  } catch (error) {
    console.error('Booth検索エラー:', error);
    return logResult({
      success: false,
      error: `検索に失敗しました: ${error.message}`,
      results: [],
      keywords: []
    });
  }
});

// ファイルをアーカイブに移動
ipcMain.handle('fs:moveToArchive', async (_, filePath) => {
  try {
    console.log('ファイルをアーカイブに移動:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('移動対象ファイルが存在しません:', filePath);
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
    
    console.log('ファイル移動完了:', finalArchivePath);
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

// Boothマッピングを学習
ipcMain.handle('booth:learnMapping', async (_, filename, boothUrl) => {
  console.log('=== Boothマッピング学習開始 ===');
  console.log('引数 - ファイル名:', filename);
  console.log('引数 - Booth URL:', boothUrl);
  
  // 引数検証
  if (!filename || !boothUrl) {
    console.error('学習失敗: 引数が不正です');
    return false;
  }
  
  const baseFilename = filename.replace(/\.(unitypackage|zip|rar)$/i, '');
  console.log('正規化後ファイル名:', baseFilename);
  
  // 保存前の状態をログ
  console.log('保存前のマッピング:', JSON.stringify(appData.boothMappings, null, 2));
  
  appData.boothMappings[baseFilename] = boothUrl;
  
  // 保存後の状態をログ
  console.log('保存後のマッピング:', JSON.stringify(appData.boothMappings, null, 2));
  
  try {
    saveData();
    console.log('データ保存完了 - ファイル:', dataFile);
    
    // 保存されたファイルの内容を検証
    const savedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log('保存ファイル内のマッピング:', JSON.stringify(savedData.boothMappings, null, 2));
    
    return true;
  } catch (error) {
    console.error('データ保存エラー:', error);
    return false;
  }
});

// Booth購入履歴HTMLファイルを選択（複数ファイル対応）
// HTML選択（複数選択可能）
ipcMain.handle('booth:selectPurchaseHistoryFiles', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    title: 'Booth購入履歴HTMLファイルを選択（複数選択可）',
    filters: [
      { name: 'HTMLファイル', extensions: ['html', 'htm'] },
      { name: 'すべてのファイル', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections'] // 複数選択を許可
  });
  
  if (result.canceled) {
    return [];
  }
  
  return result.filePaths;
});

// 複数のBooth購入履歴HTMLを一括処理
ipcMain.handle('booth:parseMultiplePurchaseHistories', async (_, htmlFilePaths) => {
  try {
    console.log('複数購入履歴HTMLパース開始:', htmlFilePaths.length, 'ファイル');
    
    let totalItems = [];
    let addedCount = 0;
    let existingCount = 0;
    
    for (let i = 0; i < htmlFilePaths.length; i++) {
      const htmlFilePath = htmlFilePaths[i];
      console.log(`ファイル ${i + 1}/${htmlFilePaths.length} 処理中:`, htmlFilePath);
      
      const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
      const purchaseData = parsePurchaseHistoryHTML(htmlContent);
      
      console.log(`ファイル ${i + 1} から ${purchaseData.length} 件の商品を抽出`);
      totalItems = totalItems.concat(purchaseData);
    }
    
    // 重複を除去（URLベース）
    const uniqueItems = [];
    const seenUrls = new Set();
    
    for (const item of totalItems) {
      if (item.boothUrl && !seenUrls.has(item.boothUrl)) {
        seenUrls.add(item.boothUrl);
        uniqueItems.push(item);
      }
    }
    
    console.log(`重複除去後: ${uniqueItems.length} 件のユニーク商品`);
    
    // 既存のboothMappingsと統合
    uniqueItems.forEach(item => {
      if (item.filename && item.boothUrl) {
        const baseFilename = item.filename.replace(/\.(unitypackage|zip|rar|psd|ai|png|jpg|jpeg)$/i, '');
        if (!appData.boothMappings[baseFilename]) {
          appData.boothMappings[baseFilename] = item.boothUrl;
          addedCount++;
        } else {
          existingCount++;
        }
      }
    });
    
    // データ保存
    saveData();
    
    return {
      success: true,
      totalFiles: htmlFilePaths.length,
      totalItems: totalItems.length,
      uniqueItems: uniqueItems.length,
      addedItems: addedCount,
      existingItems: existingCount,
      items: uniqueItems
    };
    
  } catch (error) {
    console.error('複数購入履歴パースエラー:', error);
    return {
      success: false,
      error: `パースに失敗しました: ${error.message}`,
      items: []
    };
  }
});

// Booth購入履歴HTMLをパースして商品情報を抽出（単一ファイル用）
ipcMain.handle('booth:parsePurchaseHistory', async (_, htmlFilePath) => {
  try {
    console.log('購入履歴HTMLパース開始:', htmlFilePath);
    
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const purchaseData = parsePurchaseHistoryHTML(htmlContent);
    
    console.log('パース結果:', purchaseData.length, '件の商品を抽出');
    
    // 既存のboothMappingsと統合
    let addedCount = 0;
    purchaseData.forEach(item => {
      if (item.filename && item.boothUrl) {
        const baseFilename = item.filename.replace(/\.(unitypackage|zip|rar)$/i, '');
        if (!appData.boothMappings[baseFilename]) {
          appData.boothMappings[baseFilename] = item.boothUrl;
          addedCount++;
        }
      }
    });
    
    // データ保存
    saveData();
    
    return {
      success: true,
      totalItems: purchaseData.length,
      addedItems: addedCount,
      existingItems: purchaseData.length - addedCount,
      items: purchaseData
    };
    
  } catch (error) {
    console.error('購入履歴パースエラー:', error);
    return {
      success: false,
      error: `パースに失敗しました: ${error.message}`,
      items: []
    };
  }
});

// 購入履歴HTMLをパースする関数
function parsePurchaseHistoryHTML(htmlContent) {
  const items = [];
  
  try {
    console.log('HTMLファイルサイズ:', htmlContent.length, '文字');
    console.log('HTMLの最初の500文字:', htmlContent.substring(0, 500));
    
    // Boothライブラリページの実際の構造に基づいたパース
    // パターン1: 購入商品のブロック全体を取得
    let itemPattern = /<div class="mb-16 bg-white p-16[^"]*">[\s\S]*?<\/div><\/div><\/div>/gi;
    let matches = htmlContent.match(itemPattern) || [];
    console.log('パターン1 (商品ブロック全体):', matches.length, '件');
    
    // パターン2: より緩い条件で商品ブロックを検索
    if (matches.length === 0) {
      itemPattern = /<div[^>]*class="[^"]*mb-16[^"]*bg-white[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*mb-16[^"]*bg-white[^"]*"|<div class="pager|$)/gi;
      matches = htmlContent.match(itemPattern) || [];
      console.log('パターン2 (商品ブロック緩い条件):', matches.length, '件');
    }
    
    // パターン3: Booth URLを含む大きなブロックを検索
    if (matches.length === 0) {
      itemPattern = /<div[^>]*>[\s\S]*?href="https:\/\/booth\.pm\/ja\/items\/\d+"[\s\S]*?<\/div>/gi;
      matches = htmlContent.match(itemPattern) || [];
      console.log('パターン3 (BoothURLを含むブロック):', matches.length, '件');
    }
    
    // パターン4: 各行を直接検索してBoothの商品情報を抽出
    if (matches.length === 0) {
      console.log('ブロック単位での抽出に失敗、行単位で解析します');
      const lines = htmlContent.split('\n');
      const boothItemLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('booth.pm/ja/items/') && line.includes('href=')) {
          // 商品URL発見、前後の行も含めて商品情報を構築
          const contextStart = Math.max(0, i - 10);
          const contextEnd = Math.min(lines.length, i + 20);
          const contextBlock = lines.slice(contextStart, contextEnd).join('\n');
          boothItemLines.push(contextBlock);
        }
      }
      
      matches = boothItemLines;
      console.log('パターン4 (行ベース解析):', matches.length, '件');
    }
    
    matches.forEach((itemHtml, index) => {
      try {
        console.log(`=== アイテム ${index + 1} の解析 ===`);
        console.log('HTML断片:', itemHtml.substring(0, 300));
        
        // Boothライブラリの実際の構造に基づいた抽出
        
        // 商品名を抽出 - 実際のHTML構造: <div class="text-text-default font-bold typography-16 ...">商品名</div>
        const titleMatch = itemHtml.match(/<div class="text-text-default font-bold typography-16[^"]*"[^>]*>([^<]+)<\/div>/i) ||
                          itemHtml.match(/<div[^>]*font-bold[^>]*>([^<]+)<\/div>/i) ||
                          itemHtml.match(/typography-16[^>]*>([^<]+)<\/div>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&') : '';
        console.log('抽出されたタイトル:', title);
        
        // Booth URLを抽出 - 実際の構造: href="https://booth.pm/ja/items/4903360"
        const urlMatch = itemHtml.match(/href="(https:\/\/booth\.pm\/ja\/items\/\d+)"/i);
        const boothUrl = urlMatch ? urlMatch[1] : '';
        console.log('抽出されたURL:', boothUrl);
        
        // ファイル名を抽出 - 実際の構造: <div class="typography-14 !preserve-half-leading">ファイル名.zip</div>
        const filenameMatches = itemHtml.match(/<div class="typography-14 !preserve-half-leading">([^<]+)<\/div>/gi) || [];
        let filename = '';
        
        // すべてのtypography-14要素をチェックして、ファイル拡張子があるものを探す
        for (const match of filenameMatches) {
          const fileMatch = match.match(/>([^<]*\.(zip|rar|unitypackage|pdf|psd|ai|png|jpg|jpeg))/i);
          if (fileMatch) {
            filename = fileMatch[1].trim();
            break;
          }
        }
        
        // ファイル名が見つからない場合、他のパターンも試す
        if (!filename) {
          const fallbackMatch = itemHtml.match(/>([^<]*\.(zip|rar|unitypackage|pdf|psd|ai))/i);
          filename = fallbackMatch ? fallbackMatch[1].trim() : '';
        }
        
        console.log('抽出されたファイル名:', filename);
        
        // サムネイルURLを抽出 - 実際の構造: src="https://booth.pximg.net/..."
        const thumbnailMatch = itemHtml.match(/src="(https:\/\/booth\.pximg\.net[^"]+)"/i);
        const thumbnailUrl = thumbnailMatch ? thumbnailMatch[1] : '';
        console.log('抽出されたサムネイル:', thumbnailUrl);
        
        // BoothURLがあれば商品として認識
        if (boothUrl) {
          const item = {
            title: title || 'タイトル不明',
            boothUrl,
            filename: filename || '',
            thumbnailUrl
          };
          console.log('商品として追加:', item);
          items.push(item);
        } else {
          console.log('BoothURLが見つからないためスキップ');
        }
      } catch (error) {
        console.error('個別アイテムパースエラー:', error);
      }
    });
    
    console.log('HTMLパース完了:', items.length, '件抽出');
    return items;
    
  } catch (error) {
    console.error('HTMLパース全体エラー:', error);
    return [];
  }
}

console.log('=== VRChat Booth Manager - JSONファイル版 ===');
console.log('データ保存先:', dataFile);
console.log('アーカイブ保存先:', archiveDir);
console.log('better-sqlite3を使わないシンプル版です');
console.log('=======================================');