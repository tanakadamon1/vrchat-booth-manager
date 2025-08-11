import { test, expect } from '@playwright/test';

test.describe('Product Detail Popup Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // テスト用の商品を追加
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('詳細テスト商品');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('input[name="booth_url"]').fill('https://booth.pm/ja/items/123456');
    await page.locator('input[name="thumbnail_url"]').fill('https://example.com/image.jpg');
    await page.locator('textarea[name="description"]').fill('これは商品詳細のテスト説明文です。\n複数行の説明も可能です。');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);
  });

  test('Product detail popup opens on click', async ({ page }) => {
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // 詳細ポップアップが表示される
    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
    await expect(page.locator('h2:has-text("詳細テスト商品")')).toBeVisible();
  });

  test('Product detail shows all information', async ({ page }) => {
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // 各情報が表示される
    await expect(page.locator('text=カテゴリ')).toBeVisible();
    await expect(page.locator('text=衣装')).toBeVisible();
    
    await expect(page.locator('text=説明')).toBeVisible();
    await expect(page.locator('text=これは商品詳細のテスト説明文です。')).toBeVisible();
    
    // 日付情報
    await expect(page.locator('text=作成日:')).toBeVisible();
    await expect(page.locator('text=更新日:')).toBeVisible();
  });

  test('Booth link button works', async ({ page }) => {
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // Boothで見るボタンが表示される
    await expect(page.locator('button:has-text("Boothで見る")')).toBeVisible();
  });

  test('Edit button in detail opens edit form', async ({ page }) => {
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // 編集ボタンをクリック
    await page.locator('button:has-text("編集")').last().click();
    
    // 編集フォームが開く
    await expect(page.locator('h2:has-text("商品を編集")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue('詳細テスト商品');
  });

  test('Delete button in detail shows confirmation', async ({ page }) => {
    // ダイアログハンドラーを設定
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss(); // キャンセル
    });
    
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // 削除ボタンをクリック
    await page.locator('button:has-text("削除")').last().click();
    
    // 確認ダイアログが表示される
    expect(dialogMessage).toContain('詳細テスト商品');
    expect(dialogMessage).toContain('削除してもよろしいですか');
  });

  test('Close button closes detail popup', async ({ page }) => {
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // 詳細ポップアップが表示される
    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
    
    // ×ボタンをクリック
    await page.locator('button:has-text("×")').click();
    
    // ポップアップが閉じる
    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
  });

  test('Background click closes detail popup', async ({ page }) => {
    // 商品カードをクリック
    await page.locator('div.cursor-pointer:has(h3:has-text("詳細テスト商品"))').click();
    
    // 詳細ポップアップが表示される
    await expect(page.locator('div.fixed.inset-0')).toBeVisible();
    
    // 背景をクリック
    await page.locator('div.fixed.inset-0').click({ position: { x: 10, y: 10 } });
    
    // ポップアップが閉じる
    await expect(page.locator('div.fixed.inset-0')).not.toBeVisible();
  });

  test('Product with avatar shows avatar tags', async ({ page }) => {
    // アバターを追加
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('テストアバター');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);
    
    // アバター付き商品を追加
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('アバター付き商品');
    await page.locator('label:has-text("テストアバター") input[type="checkbox"]').check();
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);
    
    // 商品詳細を開く
    await page.locator('div.cursor-pointer:has(h3:has-text("アバター付き商品"))').click();
    
    // アバタータグが表示される
    await expect(page.locator('text=対応アバター')).toBeVisible();
    await expect(page.locator('span:has-text("テストアバター")')).toBeVisible();
  });
});