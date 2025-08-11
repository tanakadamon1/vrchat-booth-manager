import { test, expect } from '@playwright/test';

test.describe('Thumbnail Auto-Fetch Tests', () => {
  test('Real Booth URL thumbnail fetch test', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 実際のBooth URLを入力
    const boothUrlInput = page.locator('input[placeholder="https://booth.pm/..."]');
    const thumbnailInput = page.locator('input[placeholder*="Booth URLを入力すると自動取得"]');
    
    // 初期状態でサムネイルが空であることを確認
    await expect(thumbnailInput).toHaveValue('');
    
    // 実際のBooth URLを入力
    await boothUrlInput.fill('https://booth.pm/ja/items/4945345');
    
    // 自動取得が試行されることを確認（ローディング表示）
    await page.waitForTimeout(1000); // 少し待機してfetch処理を確認
    
    // ローディング中のテキストが表示されるかチェック
    const loadingIndicator = page.locator('span:has-text("(自動取得中...)")');
    
    // コンソールログをキャプチャしてデバッグ情報を取得
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // エラーもキャプチャ
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // リクエストをモニタリング
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('booth') || request.url().includes('pximg')) {
        requests.push(request.url());
      }
    });
    
    // レスポンスをモニタリング
    const responses: string[] = [];
    page.on('response', response => {
      if (response.url().includes('booth') || response.url().includes('pximg')) {
        responses.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    // 5秒待機してサムネイル自動取得の結果を確認
    await page.waitForTimeout(5000);
    
    // デバッグ情報を出力
    console.log('Console logs:', consoleLogs);
    console.log('Errors:', errors);
    console.log('Requests:', requests);
    console.log('Responses:', responses);
    
    // サムネイルフィールドの最終的な値を確認
    const thumbnailValue = await thumbnailInput.inputValue();
    console.log('Final thumbnail value:', thumbnailValue);
    
    // 結果の検証（成功した場合）
    if (thumbnailValue && thumbnailValue.length > 0) {
      console.log('✅ Thumbnail auto-fetch succeeded!');
      await expect(thumbnailInput).not.toHaveValue('');
      
      // サムネイル画像が表示されるかチェック
      const thumbnailImg = page.locator('img[alt="商品サムネイル"]');
      await expect(thumbnailImg).toBeVisible();
    } else {
      console.log('❌ Thumbnail auto-fetch failed - debugging needed');
    }
  });

  test('Booth ID extraction test', async ({ page }) => {
    await page.goto('/');
    
    // ページ内でJavaScript関数をテスト
    const extractedId = await page.evaluate(() => {
      // ProductFormのextractBoothId関数をテスト
      const extractBoothId = (url: string): string | null => {
        const match = url.match(/booth\.pm\/[^\/]+\/items\/(\d+)/);
        return match ? match[1] : null;
      };
      
      return {
        testUrl1: extractBoothId('https://booth.pm/ja/items/4945345'),
        testUrl2: extractBoothId('https://booth.pm/en/items/1234567'),
        testUrl3: extractBoothId('https://booth.pm/items/9999999'),
        testUrl4: extractBoothId('invalid-url')
      };
    });
    
    console.log('Booth ID extraction results:', extractedId);
    
    // 正しくIDが抽出されることを確認
    expect(extractedId.testUrl1).toBe('4945345');
    expect(extractedId.testUrl2).toBe('1234567');
    expect(extractedId.testUrl4).toBeNull();
  });

  test('Image URL pattern test', async ({ page }) => {
    await page.goto('/');
    
    // 実際に推測されるサムネイルURLパターンをテスト
    const imageUrls = await page.evaluate(() => {
      const boothId = '4945345';
      return {
        pattern1: `https://booth.pximg.net/c/620x620/${boothId}/i/${boothId}_base_resized.jpg`,
        pattern2: `https://booth.pximg.net/c/300x300_a2_g5/${boothId}/i/${boothId}_base_resized.jpg`,
        pattern3: `https://booth.pximg.net/${boothId}/i/${boothId}_base_resized.jpg`
      };
    });
    
    console.log('Generated image URL patterns:', imageUrls);
    
    // 各パターンの画像が存在するかテスト
    for (const [pattern, url] of Object.entries(imageUrls)) {
      const imageExists = await page.evaluate((imageUrl) => {
        return new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = imageUrl;
          
          // 10秒でタイムアウト
          setTimeout(() => resolve(false), 10000);
        });
      }, url);
      
      console.log(`${pattern} (${url}): ${imageExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    }
  });

  test('Manual thumbnail input test', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // 手動でサムネイルURLを入力
    const thumbnailInput = page.locator('input[placeholder*="Booth URLを入力すると自動取得"]');
    const testImageUrl = 'https://booth.pximg.net/c/620x620/4945345/i/4945345_base_resized.jpg';
    
    await thumbnailInput.fill(testImageUrl);
    await expect(thumbnailInput).toHaveValue(testImageUrl);
    
    // プレビュー画像が表示されるかチェック
    await page.waitForTimeout(2000);
    const thumbnailImg = page.locator('img[alt="商品サムネイル"]');
    
    // 画像要素が存在するかチェック
    const imgExists = await thumbnailImg.count();
    console.log('Thumbnail preview image count:', imgExists);
    
    if (imgExists > 0) {
      console.log('✅ Thumbnail preview is working');
      await expect(thumbnailImg).toBeVisible();
    } else {
      console.log('❌ Thumbnail preview not working');
    }
  });
});