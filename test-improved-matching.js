// 改善されたファジーマッチングロジックのテスト
// 80%閾値での厳しいマッチング条件をテスト

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

function calculateSimilarity(str1, str2) {
    const norm1 = normalizeForMatching(str1);
    const norm2 = normalizeForMatching(str2);
    
    // 前方一致での類似度計算
    const commonLength = Math.min(norm1.length, norm2.length);
    let prefixMatchScore = 0;
    
    for (let i = 0; i < commonLength; i++) {
        if (norm1[i] === norm2[i]) {
            prefixMatchScore++;
        } else {
            break;
        }
    }
    
    const prefixSimilarity = prefixMatchScore / Math.max(norm1.length, norm2.length);
    
    // キーワード一致での類似度計算
    const words1 = norm1.match(/[a-z]{3,}/g) || [];
    const words2 = norm2.match(/[a-z]{3,}/g) || [];
    
    let keywordMatches = 0;
    for (const word1 of words1) {
        for (const word2 of words2) {
            if (word1.includes(word2) || word2.includes(word1)) {
                keywordMatches++;
                break;
            }
        }
    }
    
    const keywordSimilarity = keywordMatches / Math.max(words1.length, words2.length, 1);
    
    // 最終スコア計算（前方一致60% + キーワード一致40%）
    return (prefixSimilarity * 0.6) + (keywordSimilarity * 0.4);
}

// テストケース - 80%閾値での期待結果
const testCases = [
    {
        learned: "reverse_side_suit_shinra.zip",
        actual: "reverse side suit_shinra.unitypackage",
        expected: "MATCH", // 完全正規化で一致するため通過
    },
    {
        learned: "avatar_clothes_shinra_v2.3.zip", 
        actual: "avatar clothes shinra.unitypackage",
        expected: "MATCH", // 高い類似度で通過
    },
    {
        learned: "some_random_product.zip",
        actual: "completely_different_item.unitypackage", 
        expected: "NO_MATCH", // 低い類似度で拒否
    },
    {
        learned: "character_dress_blue.zip",
        actual: "character_dress_red.unitypackage",
        expected: "MAYBE", // 中程度の類似度（境界線ケース）
    },
    {
        learned: "shinra_outfit_formal.zip",
        actual: "shinra formal wear.unitypackage",
        expected: "MATCH", // キーワード一致で通過
    },
    {
        learned: "test_item_abc.zip",
        actual: "test_item_xyz.unitypackage", 
        expected: "NO_MATCH", // 部分的一致だが全体では低い類似度
    }
];

console.log("=== 改善されたファジーマッチングテスト (80%閾値) ===\n");

testCases.forEach((testCase, index) => {
    const similarity = calculateSimilarity(testCase.learned, testCase.actual);
    const shouldMatch = similarity >= 0.80;
    
    console.log(`テスト ${index + 1}:`);
    console.log(`  学習データ: ${testCase.learned}`);
    console.log(`  実際ファイル: ${testCase.actual}`);
    console.log(`  類似度: ${(similarity * 100).toFixed(1)}%`);
    console.log(`  閾値(80%)判定: ${shouldMatch ? '✅ マッチ' : '❌ 非マッチ'}`);
    console.log(`  期待値: ${testCase.expected}`);
    
    // 結果判定
    let result;
    if (shouldMatch && (testCase.expected === 'MATCH' || testCase.expected === 'MAYBE')) {
        result = '✅ 合格';
    } else if (!shouldMatch && testCase.expected === 'NO_MATCH') {
        result = '✅ 合格';
    } else if (!shouldMatch && testCase.expected === 'MAYBE') {
        result = '✅ 合格（安全側）';
    } else {
        result = '❌ 不合格';
    }
    
    console.log(`  テスト結果: ${result}\n`);
});

console.log("=== サムネイル取得判定テスト ===");
console.log("80%以上の類似度の場合のみサムネイル取得:");
testCases.forEach((testCase, index) => {
    const similarity = calculateSimilarity(testCase.learned, testCase.actual);
    const shouldGetThumbnail = similarity >= 0.80;
    
    console.log(`${index + 1}. ${testCase.actual}: ${shouldGetThumbnail ? '📷 サムネイル取得' : '🚫 サムネイル取得しない'} (${(similarity * 100).toFixed(1)}%)`);
});

console.log("\n=== 改善のまとめ ===");
console.log("• 閾値を35% → 80%に大幅アップ");
console.log("• 部分一致も80%の文字重複率が必要");
console.log("• 低信頼度マッチではサムネイル取得を停止");
console.log("• 間違ったサムネイルよりも「画像なし」を優先");