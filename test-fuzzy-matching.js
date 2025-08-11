// Test script for fuzzy matching functionality
// This simulates the file name normalization and fuzzy matching logic

// 正規化関数 (同じ関数をmain-localStorage.jsから抽出)
function normalizeForMatching(str) {
    return str
        .toLowerCase()
        .replace(/[_\s\-\.]/g, '') // アンダースコア、スペース、ハイフン、ドットを削除
        .replace(/ver\d+/g, '') // ver002などのバージョン表記を削除
        .replace(/v?\d+(\.\d+)*(\.\d+)?/g, '') // バージョン番号を削除 (v1.0.9, v109, 1.2など)
        .replace(/\(.*?\)/g, '') // 括弧内を削除
        .replace(/type[a-z]/g, '') // type-a, type_a などを削除
        .replace(/men|women/g, '') // men, womenを削除
        .replace(/psd|png|jpg|jpeg|zip|rar|unitypackage/g, '') // ファイル拡張子を削除
        .trim();
}

// テストケース
const testCases = [
    {
        learned: "reverse_side_suit_shinra.zip",
        actual: "reverse side suit_shinra.unitypackage",
        expected: true, // マッチするはず
    },
    {
        learned: "avatar_clothes_v1.2.zip",
        actual: "avatar clothes.unitypackage", 
        expected: true, // マッチするはず
    },
    {
        learned: "character_outfit_type-a.zip",
        actual: "character outfit.unitypackage",
        expected: true, // マッチするはず
    },
    {
        learned: "some_different_product.zip",
        actual: "completely different file.unitypackage",
        expected: false, // マッチしないはず
    }
];

// テスト実行
console.log("=== ファジーマッチングテスト ===\n");

testCases.forEach((testCase, index) => {
    const normalizedLearned = normalizeForMatching(testCase.learned);
    const normalizedActual = normalizeForMatching(testCase.actual);
    
    console.log(`テスト ${index + 1}:`);
    console.log(`  学習データ: ${testCase.learned} -> ${normalizedLearned}`);
    console.log(`  実際ファイル: ${testCase.actual} -> ${normalizedActual}`);
    
    // 単純な比較（完全一致）
    const exactMatch = normalizedLearned === normalizedActual;
    
    // 部分一致チェック
    const partialMatch = normalizedLearned.includes(normalizedActual) || 
                        normalizedActual.includes(normalizedLearned);
    
    // キーワード一致チェック
    const learnedWords = normalizedLearned.match(/[a-z]{3,}/g) || [];
    const actualWords = normalizedActual.match(/[a-z]{3,}/g) || [];
    
    let keywordMatches = 0;
    for (const learnedWord of learnedWords) {
        for (const actualWord of actualWords) {
            if (learnedWord.includes(actualWord) || actualWord.includes(learnedWord)) {
                keywordMatches++;
                break;
            }
        }
    }
    
    const keywordSimilarity = keywordMatches / Math.max(learnedWords.length, actualWords.length, 1);
    
    const match = exactMatch || partialMatch || keywordSimilarity > 0.7;
    
    console.log(`  完全一致: ${exactMatch}`);
    console.log(`  部分一致: ${partialMatch}`);
    console.log(`  キーワード類似度: ${keywordSimilarity.toFixed(2)} (${keywordMatches}/${Math.max(learnedWords.length, actualWords.length)})`);
    console.log(`  結果: ${match ? '✅ マッチ' : '❌ 非マッチ'} (期待値: ${testCase.expected ? 'マッチ' : '非マッチ'})`);
    
    if (match === testCase.expected) {
        console.log(`  ✅ テスト合格\n`);
    } else {
        console.log(`  ❌ テスト不合格\n`);
    }
});