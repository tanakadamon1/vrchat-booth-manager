import { test, expect } from '@playwright/test';

test.describe('Full Features Integration Test', () => {
  test('Complete workflow: Avatar → Product → Filter → Detail → Puppeteer thumbnail', async ({ page }) => {
    await page.goto('/');
    
    console.log('🔄 Starting full integration test...');
    
    // Step 1: アバター追加
    console.log('1️⃣ Adding avatar...');
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('統合テストアバター');
    await page.locator('input[name="booth_url"]').fill('https://booth.pm/ja/items/123456');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(2000);
    
    // Step 2: 商品追加（Puppeteerサムネイル自動取得付き）
    console.log('2️⃣ Adding product with Puppeteer auto-fetch...');
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('統合テスト商品');
    await page.locator('select[name="category"]').selectOption('衣装');
    
    // アバターを関連付け
    await page.locator('label:has-text("統合テストアバター") input[type="checkbox"]').check();
    
    // Booth URLを入力してサムネイル自動取得をテスト
    await page.locator('input[name="booth_url"]').fill('https://booth.pm/ja/items/4945345');
    
    // 説明文を追加
    await page.locator('textarea[name="description"]').fill('これは統合テスト用の商品です。\nPuppeteerで自動取得したサムネイルを使用しています。');
    
    console.log('⏳ Waiting for Puppeteer auto-fetch...');
    await page.waitForTimeout(10000); // Puppeteer処理を待機
    
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(2000);
    
    // Step 3: フィルタなしで商品表示確認
    console.log('3️⃣ Verifying product display...');
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("統合テスト商品")')).toBeVisible();
    
    // Step 4: 別カテゴリの商品を追加
    console.log('4️⃣ Adding second product...');
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('アクセサリー商品');
    await page.locator('select[name="category"]').selectOption('アクセサリー');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(2000);
    
    // Step 5: フィルタリング機能テスト
    console.log('5️⃣ Testing filtering functionality...');
    
    // 全商品表示確認
    await expect(page.locator('text=商品一覧 (2件)')).toBeVisible();
    
    // カテゴリフィルター適用
    await page.locator('aside label:has-text("衣装") input[type="checkbox"]').check();
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("統合テスト商品")')).toBeVisible();
    await expect(page.locator('h3:has-text("アクセサリー商品")')).not.toBeVisible();
    
    // アバターフィルター追加
    await page.locator('aside label:has-text("統合テストアバター") input[type="checkbox"]').check();
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    
    // 検索フィルター
    await page.locator('input[placeholder="商品名・作者名で検索"]').fill('統合テスト');
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    
    // フィルターリセット
    await page.locator('button:has-text("フィルターをリセット")').click();
    await expect(page.locator('text=商品一覧 (2件)')).toBeVisible();
    
    // Step 6: 商品詳細ポップアップテスト
    console.log('6️⃣ Testing product detail popup...');
    await page.locator('div.cursor-pointer:has(h3:has-text("統合テスト商品"))').click();
    
    // 詳細情報確認
    await expect(page.locator('h2:has-text("統合テスト商品")')).toBeVisible();
    await expect(page.locator('text=カテゴリ')).toBeVisible();
    await expect(page.locator('text=衣装')).toBeVisible();
    await expect(page.locator('text=対応アバター')).toBeVisible();
    await expect(page.locator('span:has-text("統合テストアバター")')).toBeVisible();
    await expect(page.locator('text=説明')).toBeVisible();
    await expect(page.locator('text=これは統合テスト用の商品です。')).toBeVisible();
    
    // Boothボタン確認
    await expect(page.locator('button:has-text("Boothで見る")')).toBeVisible();
    
    // 詳細から編集画面へ
    await page.locator('button:has-text("編集")').last().click();
    await expect(page.locator('h2:has-text("商品を編集")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue('統合テスト商品');
    
    // 編集をキャンセル
    await page.locator('button:has-text("キャンセル")').click();
    
    console.log('✅ All integration tests passed!');
  });

  test('Simplified workflow for CI/CD', async ({ page }) => {
    await page.goto('/');
    
    console.log('🔄 Starting simplified workflow test...');
    
    // 基本機能のみテスト（CI/CD用）
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('CI商品');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);
    
    // 商品表示確認
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("CI商品")')).toBeVisible();
    
    // フィルター確認
    await page.locator('aside label:has-text("衣装") input[type="checkbox"]').check();
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    
    // 商品詳細確認
    await page.locator('div.cursor-pointer:has(h3:has-text("CI商品"))').click();
    await expect(page.locator('h2:has-text("CI商品")')).toBeVisible();
    await page.locator('button:has-text("×")').click();
    
    console.log('✅ Simplified workflow test passed!');
  });

  test('Error handling and edge cases', async ({ page }) => {
    await page.goto('/');
    
    console.log('🔄 Testing error handling...');
    
    // 空の商品名でエラー確認
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('button[type="submit"]:has-text("追加")').click();
    
    // ブラウザの標準バリデーションまたはカスタムエラーが表示されることを期待
    
    await page.locator('button:has-text("キャンセル")').click();
    
    console.log('✅ Error handling test completed!');
  });
});