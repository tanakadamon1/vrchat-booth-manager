import { test, expect } from '@playwright/test';

test('Product form can be filled with data', async ({ page }) => {
  await page.goto('/');
  
  // 商品追加ボタンをクリック
  await page.getByRole('button', { name: '商品を追加', exact: true }).click();
  
  // フォームが開くことを確認
  await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
  
  // フォームにデータを入力
  await page.locator('input[type="text"]').first().fill('テスト商品');
  await page.locator('input[type="text"]').nth(1).fill('テスト作者');
  await page.locator('input[type="number"]').fill('1000');
  
  // フォーム内の追加ボタンがクリック可能であることを確認
  await expect(page.locator('button[type="submit"]:has-text("追加")')).toBeVisible();
});

test('Avatar form can be filled with data', async ({ page }) => {
  await page.goto('/');
  
  // アバター追加ボタンをクリック
  await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
  
  // フォームが開くことを確認
  await expect(page.locator('h2:has-text("アバターを追加")')).toBeVisible();
  
  // フォームにデータを入力
  await page.locator('input[type="text"]').first().fill('テストアバター');
  await page.locator('input[placeholder="https://booth.pm/..."]').fill('https://booth.pm/test');
  
  // フォーム内の追加ボタンがクリック可能であることを確認
  await expect(page.locator('button[type="submit"]:has-text("追加")')).toBeVisible();
});

test('Empty state displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // 空状態のメッセージが表示されることを確認
  await expect(page.locator('text=商品が登録されていません')).toBeVisible();
  await expect(page.locator('text=アバターが登録されていません')).toBeVisible();
  
  // 初回商品追加ボタンが表示されることを確認
  await expect(page.getByRole('button', { name: '最初の商品を追加する' })).toBeVisible();
});