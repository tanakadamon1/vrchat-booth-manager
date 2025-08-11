import { test, expect } from '@playwright/test';

test.describe('Quick Feature Check', () => {
  test('App loads and basic elements are visible', async ({ page }) => {
    await page.goto('/');
    
    // アプリが読み込まれることを確認
    await expect(page.locator('h1:has-text("VRChat Booth商品管理")')).toBeVisible();
    
    // サイドバーのフィルターが表示される
    await expect(page.locator('h2:has-text("フィルター")')).toBeVisible();
    await expect(page.locator('h3:has-text("アバター")')).toBeVisible();
    await expect(page.locator('h3:has-text("カテゴリ")')).toBeVisible();
    await expect(page.locator('h3:has-text("検索")')).toBeVisible();
    
    // 追加ボタンが表示される
    await expect(page.getByRole('button', { name: 'アバター追加' })).toBeVisible();
    await expect(page.getByRole('button', { name: '商品を追加' })).toBeVisible();
    
    // 商品一覧エリア
    await expect(page.locator('text=商品一覧')).toBeVisible();
    
    console.log('✅ App basic elements are working correctly');
  });

  test('Forms can be opened', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    await page.locator('button:has-text("キャンセル")').click();
    
    // アバター追加フォームを開く
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await expect(page.locator('h2:has-text("アバターを追加")')).toBeVisible();
    await page.locator('button:has-text("キャンセル")').click();
    
    console.log('✅ Forms can be opened correctly');
  });

  test('Filter checkboxes work', async ({ page }) => {
    await page.goto('/');
    
    // カテゴリフィルターをチェック
    await page.locator('aside label:has-text("衣装") input[type="checkbox"]').check();
    await expect(page.locator('aside label:has-text("衣装") input[type="checkbox"]')).toBeChecked();
    
    // 検索ボックスに入力
    await page.locator('input[placeholder="商品名・作者名で検索"]').fill('test');
    await expect(page.locator('input[placeholder="商品名・作者名で検索"]')).toHaveValue('test');
    
    // リセットボタンが表示される
    await expect(page.locator('button:has-text("フィルターをリセット")')).toBeVisible();
    
    // リセット
    await page.locator('button:has-text("フィルターをリセット")').click();
    await expect(page.locator('aside label:has-text("衣装") input[type="checkbox"]')).not.toBeChecked();
    await expect(page.locator('input[placeholder="商品名・作者名で検索"]')).toHaveValue('');
    
    console.log('✅ Filter functionality is working correctly');
  });
});