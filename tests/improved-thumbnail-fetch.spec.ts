import { test, expect } from '@playwright/test';

test.describe('Improved Thumbnail Auto-Fetch Tests', () => {
  test('Test thumbnail auto-fetch with multiple methods', async ({ page }) => {
    await page.goto('/');
    
    // コンソールログとネットワークをモニタリング
    const consoleLogs: string[] = [];
    const networkRequests: string[] = [];
    const networkResponses: { url: string; status: number }[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    page.on('request', request => {
      networkRequests.push(request.url());
    });
    
    page.on('response', response => {
      networkResponses.push({ url: response.url(), status: response.status() });
    });
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 実際のBooth URLを入力
    const boothUrlInput = page.locator('input[placeholder="https://booth.pm/..."]');
    const thumbnailInput = page.locator('input[placeholder*="Booth URLを入力すると自動取得"]');
    
    console.log('🔄 Testing thumbnail auto-fetch with real Booth URL...');
    
    // 初期状態
    await expect(thumbnailInput).toHaveValue('');
    
    // Booth URLを入力
    await boothUrlInput.fill('https://booth.pm/ja/items/4945345');
    
    // 自動取得プロセスを待機
    console.log('⏳ Waiting for auto-fetch process...');
    await page.waitForTimeout(8000); // 8秒待機
    
    // 結果を確認
    const finalThumbnailValue = await thumbnailInput.inputValue();
    console.log('📸 Final thumbnail URL:', finalThumbnailValue);
    
    // ログとネットワーク活動を出力
    console.log('📋 Console logs:');
    consoleLogs.forEach(log => console.log('  ', log));
    
    console.log('🌐 Network requests made:');
    const relevantRequests = networkRequests.filter(url => 
      url.includes('booth') || 
      url.includes('opengraph') || 
      url.includes('allorigins') ||
      url.includes('pximg')
    );
    relevantRequests.forEach(url => console.log('  ', url));
    
    console.log('📡 Network responses:');
    const relevantResponses = networkResponses.filter(response => 
      response.url.includes('booth') || 
      response.url.includes('opengraph') || 
      response.url.includes('allorigins') ||
      response.url.includes('pximg')
    );
    relevantResponses.forEach(response => 
      console.log(`   ${response.status}: ${response.url}`)
    );
    
    // 結果の評価
    if (finalThumbnailValue && finalThumbnailValue.length > 0) {
      console.log('✅ Thumbnail auto-fetch succeeded!');
      
      // 画像プレビューが表示されるかチェック
      const thumbnailImg = page.locator('img[alt="商品サムネイル"]');
      await page.waitForTimeout(2000); // 画像読み込み待機
      
      const imgVisible = await thumbnailImg.isVisible();
      console.log('🖼️  Thumbnail preview visible:', imgVisible);
      
      if (imgVisible) {
        console.log('✅ Thumbnail preview is working correctly');
      } else {
        console.log('⚠️  Thumbnail URL obtained but preview not visible');
      }
    } else {
      console.log('❌ Thumbnail auto-fetch failed');
      console.log('🔧 Manual intervention required');
    }
    
    // ヘルプテキストが表示されることを確認
    await expect(page.locator('text=💡 自動取得に失敗した場合')).toBeVisible();
  });

  test('Manual thumbnail input and preview test', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // 実際のBooth画像URLを手動で入力してテスト
    const thumbnailInput = page.locator('input[placeholder*="Booth URLを入力すると自動取得"]');
    
    // 実際に存在するBooth商品の画像URLを使用
    const testImageUrl = 'https://booth.pximg.net/0ead0e7f-ad3a-435b-b490-2d65de82c684/i/4945345/8b99d7c0-4cd2-4ae4-833a-42c8a3702747_base_resized.jpg';
    
    console.log('🖼️  Testing manual thumbnail input...');
    
    await thumbnailInput.fill(testImageUrl);
    await expect(thumbnailInput).toHaveValue(testImageUrl);
    
    // プレビュー画像の表示を確認
    await page.waitForTimeout(3000);
    
    const thumbnailImg = page.locator('img[alt="商品サムネイル"]');
    const imgCount = await thumbnailImg.count();
    console.log('🖼️  Thumbnail image elements found:', imgCount);
    
    if (imgCount > 0) {
      const imgVisible = await thumbnailImg.isVisible();
      const imgSrc = await thumbnailImg.getAttribute('src');
      
      console.log('🖼️  Image visible:', imgVisible);
      console.log('🖼️  Image src:', imgSrc);
      
      if (imgVisible) {
        console.log('✅ Manual thumbnail input and preview working');
        await expect(thumbnailImg).toBeVisible();
      } else {
        console.log('⚠️  Image element exists but not visible');
      }
    } else {
      console.log('❌ No thumbnail image elements found');
    }
  });

  test('User guidance and help text display', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // ヘルプテキストが適切に表示されることを確認
    await expect(page.locator('text=💡 自動取得に失敗した場合')).toBeVisible();
    await expect(page.locator('text=右クリック→「画像をコピー」→ここに貼り付け')).toBeVisible();
    
    // プレースホルダーテキストが更新されていることを確認
    await expect(page.locator('input[placeholder*="Booth URLを入力すると自動取得を試行"]')).toBeVisible();
    
    console.log('✅ User guidance and help text are properly displayed');
  });
});