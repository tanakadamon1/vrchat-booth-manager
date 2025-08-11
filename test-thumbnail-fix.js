// Test script to verify thumbnail fetching fix
const { ipcRenderer } = require('electron');

async function testThumbnailFetching() {
    console.log('=== サムネイル取得修正テスト ===\n');
    
    // 問題のあったファイル名をテスト
    const problemFiles = [
        'reverse_side_suit_shinra.zip',
        '+Head_Gothic_Clothes.zip',
        'Lemiel[Moises_Hair].unitypackage'
    ];
    
    for (const filename of problemFiles) {
        console.log(`--- テスト: ${filename} ---`);
        
        try {
            const result = await electronAPI.booth.searchByFilename(filename);
            
            console.log(`成功: ${result.success}`);
            console.log(`結果数: ${result.results.length}`);
            console.log(`高信頼度: ${result.highConfidence}`);
            
            if (result.results.length > 0) {
                result.results.forEach((res, index) => {
                    console.log(`  結果 ${index + 1}:`);
                    console.log(`    URL: ${res.url}`);
                    console.log(`    タイトル: ${res.title}`);
                    console.log(`    信頼度: ${res.confidence}%`);
                    console.log(`    タイプ: ${res.matchType}`);
                    
                    // 検索URLかチェック
                    if (res.url.includes('/search/')) {
                        console.log('    ❌ 検索URLが返されました（修正失敗）');
                    } else if (res.url.includes('/items/')) {
                        console.log('    ✅ 商品URLが返されました（修正成功）');
                    } else {
                        console.log('    ⚠️ 不明なURL形式');
                    }
                });
            } else {
                console.log('  ✅ 空の結果が返されました（検索URLなし）');
            }
            
        } catch (error) {
            console.error(`エラー: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('=== テスト完了 ===');
}

// ページロード後にテストを実行
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(testThumbnailFetching, 1000);
    });
} else {
    // Node.js環境での実行
    testThumbnailFetching();
}