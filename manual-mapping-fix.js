// 手動で不足しているマッピングを追加する修正スクリプト
const fs = require('fs');

// 学習データを読み込み
function loadLearningData() {
    try {
        const dataPath = 'C:\\Users\\kizan\\VRChat-Booth-Manager\\data.json';
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            return data;
        }
    } catch (error) {
        console.error('学習データ読み込みエラー:', error);
    }
    return null;
}

// 学習データを保存
function saveLearningData(data) {
    try {
        const dataPath = 'C:\\Users\\kizan\\VRChat-Booth-Manager\\data.json';
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log('✅ 学習データを保存しました');
        return true;
    } catch (error) {
        console.error('学習データ保存エラー:', error);
        return false;
    }
}

function addMissingMappings() {
    console.log('=== 不足マッピングの手動追加開始 ===\n');
    
    const data = loadLearningData();
    if (!data) {
        console.error('❌ 学習データの読み込みに失敗しました');
        return;
    }
    
    if (!data.boothMappings) {
        data.boothMappings = {};
    }
    
    // HTMLから判明した正しいマッピングを追加
    const missingMappings = {
        // Reverse Side Suit - HTML解析で発見されたURL
        'reverse_side_suit_shinra.zip': 'https://booth.pm/ja/items/5840011',
        'reverse side suit_shinra': 'https://booth.pm/ja/items/5840011',
        'reverse_side_suit_shinra': 'https://booth.pm/ja/items/5840011',
        
        // Gothic Clothesは既存の同じ商品のURLを使用
        '+Head_Gothic_Clothes.zip': 'https://booth.pm/ja/items/5836748',
        '+Head_Gothic_Clothes': 'https://booth.pm/ja/items/5836748',
        'Head_Gothic_Clothes.zip': 'https://booth.pm/ja/items/5836748',
        'Head_Gothic_Clothes': 'https://booth.pm/ja/items/5836748',
        
        // Teddy Bear Hair - HTMLから発見されたURL
        'Teddy_Bear_Hair_v.1.0.1.zip': 'https://booth.pm/ja/items/4764582',
        'Teddy_Bear_Hair_v.1.0.1': 'https://booth.pm/ja/items/4764582',
        'Teddy Bear Hair_v.1.0.1': 'https://booth.pm/ja/items/4764582'
    };
    
    let addedCount = 0;
    let existingCount = 0;
    
    for (const [filename, url] of Object.entries(missingMappings)) {
        if (data.boothMappings[filename]) {
            console.log(`⚠️ 既存: "${filename}" -> ${data.boothMappings[filename]}`);
            existingCount++;
        } else {
            data.boothMappings[filename] = url;
            console.log(`✅ 追加: "${filename}" -> ${url}`);
            addedCount++;
        }
    }
    
    console.log(`\n=== 結果 ===`);
    console.log(`追加: ${addedCount} 件`);
    console.log(`既存: ${existingCount} 件`);
    
    if (addedCount > 0) {
        if (saveLearningData(data)) {
            console.log('\n🎉 マッピングの追加が完了しました！');
            console.log('これでZIPファイルのサムネイル取得が改善されるはずです。');
        }
    } else {
        console.log('\n👍 追加するマッピングはありませんでした。');
    }
}

addMissingMappings();