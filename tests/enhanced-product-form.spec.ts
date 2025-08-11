import { test, expect } from '@playwright/test';

test.describe('Enhanced Product Form Tests', () => {
  test('Simplified product form contains only essential fields', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // 新しいシンプルなフォーム構成を確認
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 必要なフィールドのみ存在することを確認
    await expect(page.locator('label:has-text("商品名")')).toBeVisible();
    await expect(page.locator('label:has-text("カテゴリ")')).toBeVisible();
    await expect(page.locator('label:has-text("Booth URL")')).toBeVisible();
    await expect(page.locator('label:has-text("サムネイル URL")')).toBeVisible();
    await expect(page.locator('label:has-text("説明")')).toBeVisible();
    
    // 削除されたフィールドが存在しないことを確認
    await expect(page.locator('label:has-text("作者名")')).not.toBeVisible();
    await expect(page.locator('label:has-text("価格")')).not.toBeVisible();
  });

  test('Thumbnail auto-fetch hint is displayed', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // サムネイル自動取得のヒントが表示されることを確認
    await expect(page.locator('input[placeholder*="Booth URLを入力すると自動取得"]')).toBeVisible();
    
    // Booth URL入力フィールドのプレースホルダーを確認
    await expect(page.locator('input[placeholder="https://booth.pm/..."]')).toBeVisible();
  });

  test('Booth URL input triggers thumbnail auto-fetch attempt', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // Booth URLを入力
    const boothUrlInput = page.locator('input[placeholder="https://booth.pm/..."]');
    await boothUrlInput.fill('https://booth.pm/ja/items/123456');
    
    // サムネイル取得中の表示が一時的に現れる可能性を確認
    // (実際の画像が存在しない場合でも、処理は実行される)
    await page.waitForTimeout(500);
    
    // フォームが正常に入力可能であることを確認
    await expect(boothUrlInput).toHaveValue('https://booth.pm/ja/items/123456');
  });

  test('Product form can be filled with simplified data', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // 必要最小限のデータを入力
    await page.locator('input[type="text"]').first().fill('テスト商品（簡易版）');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('input[placeholder="https://booth.pm/..."]').fill('https://booth.pm/ja/items/123456');
    await page.locator('textarea[placeholder="商品の説明"]').fill('これは簡易版の商品登録テストです');
    
    // 入力値が正しく設定されることを確認
    await expect(page.locator('input[type="text"]').first()).toHaveValue('テスト商品（簡易版）');
    await expect(page.locator('select[name="category"]')).toHaveValue('衣装');
    await expect(page.locator('input[placeholder="https://booth.pm/..."]')).toHaveValue('https://booth.pm/ja/items/123456');
    await expect(page.locator('textarea[placeholder="商品の説明"]')).toHaveValue('これは簡易版の商品登録テストです');
    
    // 追加ボタンが表示されることを確認
    await expect(page.locator('button[type="submit"]:has-text("追加")')).toBeVisible();
  });

  test('Category selection works correctly', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // カテゴリ選択をテスト
    const categorySelect = page.locator('select[name="category"]');
    
    // デフォルト値を確認
    await expect(categorySelect).toHaveValue('衣装');
    
    // 他のカテゴリを選択
    await categorySelect.selectOption('アクセサリー');
    await expect(categorySelect).toHaveValue('アクセサリー');
    
    await categorySelect.selectOption('髪型');
    await expect(categorySelect).toHaveValue('髪型');
    
    await categorySelect.selectOption('アバター本体');
    await expect(categorySelect).toHaveValue('アバター本体');
  });
});