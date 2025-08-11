// Lemiel[Moises_Hair].unitypackageの一致度テスト

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

function calculateSimilarity(str1, str2) {
    const norm1 = normalizeForMatching(str1);
    const norm2 = normalizeForMatching(str2);
    
    console.log(`  正規化結果: "${str1}" -> "${norm1}"`);
    console.log(`  正規化結果: "${str2}" -> "${norm2}"`);
    
    if (norm1 === norm2) {
        return 1.0;
    }
    
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
    console.log(`  前方一致スコア: ${prefixMatchScore}/${Math.max(norm1.length, norm2.length)} = ${(prefixSimilarity * 100).toFixed(1)}%`);
    
    // キーワード一致での類似度計算
    const words1 = norm1.match(/[a-z]{3,}/g) || [];
    const words2 = norm2.match(/[a-z]{3,}/g) || [];
    
    console.log(`  キーワード抽出: "${norm1}" -> [${words1.join(', ')}]`);
    console.log(`  キーワード抽出: "${norm2}" -> [${words2.join(', ')}]`);
    
    let keywordMatches = 0;
    const matchedPairs = [];
    for (const word1 of words1) {
        for (const word2 of words2) {
            if (word1.includes(word2) || word2.includes(word1)) {
                keywordMatches++;
                matchedPairs.push(`${word1}<->${word2}`);
                break;
            }
        }
    }
    
    const keywordSimilarity = keywordMatches / Math.max(words1.length, words2.length, 1);
    console.log(`  キーワード一致: ${keywordMatches}/${Math.max(words1.length, words2.length)} = ${(keywordSimilarity * 100).toFixed(1)}%`);
    console.log(`  一致ペア: [${matchedPairs.join(', ')}]`);
    
    // 最終スコア計算（前方一致60% + キーワード一致40%）
    const finalSimilarity = (prefixSimilarity * 0.6) + (keywordSimilarity * 0.4);
    console.log(`  最終類似度: (${(prefixSimilarity * 100).toFixed(1)}% × 0.6) + (${(keywordSimilarity * 100).toFixed(1)}% × 0.4) = ${(finalSimilarity * 100).toFixed(1)}%`);
    
    return finalSimilarity;
}

// 実際のファイル名
const actualFile = "Lemiel[Moises_Hair].unitypackage";

// 考えられる学習データのパターン
const possibleLearnedFiles = [
    // 1. HTMLから学習した可能性のあるファイル名パターン
    "Lemiel_Moises_Hair.zip",
    "Lemiel Moises Hair.zip", 
    "lemiel_moises_hair.zip",
    "Lemiel-Moises-Hair.zip",
    "LemielMoisesHair.zip",
    
    // 2. 括弧表記が異なる可能性
    "Lemiel(Moises_Hair).zip",
    "Lemiel_[Moises_Hair].zip",
    "Lemiel - Moises Hair.zip",
    
    // 3. 略記・表記違いの可能性
    "Lemiel_Hair.zip",
    "Moises_Hair_Lemiel.zip",
    "Lemiel Hair Pack.zip",
    
    // 4. 完全に異なる商品名の可能性
    "some_completely_different_product.zip",
    
    // 5. 部分的に一致するがアバター名が異なる
    "Shinra_Moises_Hair.zip",
    "Lemiel_Different_Hair.zip"
];

console.log("=== Lemiel[Moises_Hair].unitypackage 一致度分析 ===\n");
console.log(`対象ファイル: ${actualFile}\n`);

possibleLearnedFiles.forEach((learnedFile, index) => {
    console.log(`--- テストケース ${index + 1}: ${learnedFile} ---`);
    const similarity = calculateSimilarity(learnedFile, actualFile);
    const wouldMatch = similarity >= 0.80;
    
    console.log(`  📊 最終判定: ${(similarity * 100).toFixed(1)}% ${wouldMatch ? '✅ マッチ (サムネイル取得)' : '❌ 非マッチ (サムネイル取得しない)'}`);
    console.log("");
});

console.log("=== 問題の原因分析 ===");
console.log("1. 括弧 [Moises_Hair] が正規化で削除される");
console.log("2. 学習データの表記形式が異なる可能性");
console.log("3. HTMLファイルでの商品名とファイル名の差異");
console.log("4. 80%閾値により厳格な一致が必要");
console.log("");
console.log("=== 解決案 ===");
console.log("1. 学習データを確認して正確なファイル名を特定");
console.log("2. 手動でBooth URLを設定して学習データを更新");
console.log("3. 括弧内の情報も考慮するマッチング改善");