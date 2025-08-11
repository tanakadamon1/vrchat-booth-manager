import { test, expect } from '@playwright/test';

test('VRChat Booth Manager App loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // ページタイトルを確認
  await expect(page).toHaveTitle(/VRChat/);
  
  // メインヘッダーを確認
  await expect(page.locator('h1')).toContainText('VRChat Booth商品管理');
  
  // 商品追加ボタンを確認（サイドバーの正確なボタン）
  await expect(page.getByRole('button', { name: '商品を追加', exact: true })).toBeVisible();
  
  // アバター追加ボタンを確認  
  await expect(page.getByRole('button', { name: 'アバター追加', exact: true })).toBeVisible();
});

test('Product form opens', async ({ page }) => {
  await page.goto('/');
  
  // 商品追加ボタンをクリック
  await page.getByRole('button', { name: '商品を追加', exact: true }).click();
  
  // フォームが開くことを確認
  await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
  
  // フォーム内の必要な要素が表示されることを確認
  await expect(page.locator('label:has-text("商品名")')).toBeVisible();
  await expect(page.locator('label:has-text("カテゴリ")')).toBeVisible();
  await expect(page.locator('label:has-text("Booth URL")')).toBeVisible();
});

test('Avatar form opens', async ({ page }) => {
  await page.goto('/');
  
  // アバター追加ボタンをクリック
  await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
  
  // フォームが開くことを確認
  await expect(page.locator('h2:has-text("アバターを追加")')).toBeVisible();
  
  // フォーム内の必要な要素が表示されることを確認
  await expect(page.locator('label:has-text("アバター名")')).toBeVisible();
  await expect(page.locator('label:has-text("Booth URL")')).toBeVisible();
});