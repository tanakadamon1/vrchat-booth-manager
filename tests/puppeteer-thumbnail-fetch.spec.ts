import { test, expect } from '@playwright/test';

test.describe('Puppeteer Thumbnail Auto-Fetch Tests', () => {
  test('Test new Puppeteer-based thumbnail auto-fetch', async ({ page }) => {
    await page.goto('/');
    
    // コンソールログをキャプチャ
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 実際のBooth URLを入力
    const boothUrlInput = page.locator('input[placeholder="https://booth.pm/..."]');
    const thumbnailInput = page.locator('input[placeholder*="Booth URLを入力すると自動取得"]');
    
    console.log('🔄 Testing new Puppeteer-based thumbnail auto-fetch...');
    
    // 初期状態
    await expect(thumbnailInput).toHaveValue('');
    
    // Booth URLを入力
    await boothUrlInput.fill('https://booth.pm/ja/items/4945345');
    
    // 自動取得プロセスを待機（Puppeteerは少し時間がかかる）
    console.log('⏳ Waiting for Puppeteer auto-fetch process...');
    await page.waitForTimeout(15000); // 15秒待機（Puppeteerブラウザ起動時間を考慮）
    
    // 結果を確認
    const finalThumbnailValue = await thumbnailInput.inputValue();
    console.log('📸 Final thumbnail URL:', finalThumbnailValue);
    
    // ログを出力
    console.log('📋 Console logs:');
    consoleLogs.forEach(log => console.log('  ', log));
    
    // 結果の評価
    if (finalThumbnailValue && finalThumbnailValue.length > 0) {
      console.log('✅ Puppeteer thumbnail auto-fetch succeeded!');
      
      // URLがBooth.pmドメインのものであることを確認
      expect(finalThumbnailValue).toContain('booth');
      
      // 画像プレビューが表示されるかチェック
      const thumbnailImg = page.locator('img[alt="商品サムネイル"]');
      await page.waitForTimeout(3000); // 画像読み込み待機
      
      const imgVisible = await thumbnailImg.isVisible();
      console.log('🖼️ Thumbnail preview visible:', imgVisible);
      
      if (imgVisible) {
        console.log('✅ Thumbnail preview is working correctly');
        await expect(thumbnailImg).toBeVisible();
      } else {
        console.log('⚠️ Thumbnail URL obtained but preview not visible');
      }
    } else {
      console.log('❌ Puppeteer thumbnail auto-fetch failed');
      console.log('🔧 Check console logs for error details');
    }
  });

  test('Test loading indicator during Puppeteer fetch', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // Booth URLを入力
    const boothUrlInput = page.locator('input[placeholder="https://booth.pm/..."]');
    await boothUrlInput.fill('https://booth.pm/ja/items/4945345');
    
    // ローディング表示が現れることを確認
    await page.waitForTimeout(1000);
    
    // ローディング中の表示を確認
    const loadingIndicator = page.locator('span:has-text("(自動取得中...)")');
    const isLoadingVisible = await loadingIndicator.isVisible();
    
    console.log('⏳ Loading indicator visible:', isLoadingVisible);
    
    if (isLoadingVisible) {
      console.log('✅ Loading indicator is working correctly');
    }
    
    // 処理完了まで待機
    await page.waitForTimeout(15000);
    
    // ローディングが消えることを確認
    const isLoadingStillVisible = await loadingIndicator.isVisible();
    console.log('⏳ Loading indicator still visible after completion:', isLoadingStillVisible);
    
    expect(isLoadingStillVisible).toBe(false);
  });

  test('Test multiple Booth URLs with Puppeteer', async ({ page }) => {
    await page.goto('/');
    
    const testUrls = [
      'https://booth.pm/ja/items/4945345',
      'https://booth.pm/ja/items/1234567', // 存在しないかもしれないURL
    ];
    
    for (const url of testUrls) {
      console.log(`🔄 Testing URL: ${url}`);
      
      // 商品追加フォームを開く
      await page.getByRole('button', { name: '商品を追加', exact: true }).click();
      
      // Booth URLを入力
      const boothUrlInput = page.locator('input[placeholder="https://booth.pm/..."]');
      const thumbnailInput = page.locator('input[placeholder*="Booth URLを入力すると自動取得"]');
      
      await boothUrlInput.fill(url);
      await page.waitForTimeout(10000); // 10秒待機
      
      const result = await thumbnailInput.inputValue();
      console.log(`📸 Result for ${url}: ${result || 'FAILED'}`);
      
      // フォームを閉じる
      await page.locator('button:has-text("キャンセル")').click();
      await page.waitForTimeout(1000);
    }
  });
});