// 特定のファイル名での学習データ検索デバッグ
const fs = require('fs');

// 学習データを読み込み
function loadLearningData() {
    try {
        const dataPath = 'C:\\Users\\kizan\\VRChat-Booth-Manager\\data.json';
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            return data.boothMappings || {};
        }
    } catch (error) {
        console.error('学習データ読み込みエラー:', error);
    }
    return {};
}

function debugSpecificFiles() {
    console.log('=== 特定ファイルの学習データデバッグ ===\n');
    
    const mappings = loadLearningData();
    const totalMappings = Object.keys(mappings).length;
    
    console.log(`総学習データ数: ${totalMappings}\n`);
    
    // 問題のファイル名リスト
    const problemFiles = [
        'reverse_side_suit_shinra.zip',
        '+Head_Gothic_Clothes.zip',
        'Gothic_Clothes.unitypackage',
        'reverse side suit_shinra.unitypackage'
    ];
    
    console.log('--- 完全一致チェック ---');
    problemFiles.forEach(filename => {
        const result = mappings[filename];
        console.log(`"${filename}": ${result ? '✅ 見つかった → ' + result : '❌ 見つからない'}`);
    });
    
    console.log('\n--- 類似キー検索 ---');
    problemFiles.forEach(filename => {
        console.log(`\n"${filename}" の類似キー:`);
        const similarKeys = Object.keys(mappings).filter(key => {
            const keyLower = key.toLowerCase();
            const fileLower = filename.toLowerCase();
            
            // 部分一致チェック
            return keyLower.includes(fileLower.replace(/\.(zip|unitypackage)$/i, '')) ||
                   fileLower.includes(keyLower.replace(/\.(zip|unitypackage)$/i, '')) ||
                   // キーワード一致チェック
                   key.split(/[_\-\s]+/).some(part => 
                       filename.toLowerCase().includes(part.toLowerCase()) && part.length > 2
                   );
        });
        
        if (similarKeys.length > 0) {
            similarKeys.slice(0, 5).forEach(key => {
                console.log(`  - "${key}" → ${mappings[key]}`);
            });
            if (similarKeys.length > 5) {
                console.log(`  ... および${similarKeys.length - 5}個の追加結果`);
            }
        } else {
            console.log('  類似するキーが見つかりません');
        }
    });
    
    console.log('\n--- 正規化マッチングテスト ---');
    
    function normalizeForMatching(str) {
        return str
            .toLowerCase()
            .replace(/[_\s\-\.]/g, '')
            .replace(/ver\d+/g, '')
            .replace(/v?\d+(\.\d+)*(\.\d+)?/g, '')
            .replace(/\(.*?\)/g, '')
            .replace(/type[a-z]/g, '')
            .replace(/men|women/g, '')
            .replace(/psd|png|jpg|jpeg|zip|rar|unitypackage/g, '')
            .trim();
    }
    
    problemFiles.forEach(filename => {
        const normalizedFile = normalizeForMatching(filename);
        console.log(`\n"${filename}" → "${normalizedFile}"`);
        
        let foundMatch = false;
        for (const [key, url] of Object.entries(mappings)) {
            const normalizedKey = normalizeForMatching(key);
            
            if (normalizedKey === normalizedFile && normalizedFile.length > 3) {
                console.log(`  🎯 完全正規化一致: "${key}" → ${url}`);
                foundMatch = true;
                break;
            }
        }
        
        if (!foundMatch) {
            console.log('  ❌ 正規化一致なし');
        }
    });
    
    console.log('\n=== 学習データ品質チェック ===');
    
    let validCount = 0;
    let searchUrlCount = 0;
    let invalidCount = 0;
    
    for (const [key, url] of Object.entries(mappings)) {
        if (url.includes('/search/')) {
            searchUrlCount++;
        } else if (url.includes('/items/') && url.includes('booth.pm')) {
            validCount++;
        } else {
            invalidCount++;
        }
    }
    
    console.log(`✅ 有効な商品URL: ${validCount} 件`);
    console.log(`🔍 検索URL: ${searchUrlCount} 件`);
    console.log(`❌ 無効なURL: ${invalidCount} 件`);
    console.log(`📊 品質率: ${((validCount / totalMappings) * 100).toFixed(1)}%`);
}

debugSpecificFiles();