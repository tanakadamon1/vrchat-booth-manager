import { test, expect } from '@playwright/test';

test.describe('MVP Integration Tests', () => {
  test('Complete product registration workflow', async ({ page }) => {
    await page.goto('/');
    
    // 初期状態の確認
    await expect(page.locator('h1')).toContainText('VRChat Booth商品管理');
    await expect(page.locator('text=商品が登録されていません')).toBeVisible();
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 商品情報を入力
    await page.locator('input[type="text"]').first().fill('テストVRChat衣装');
    await page.locator('input[type="text"]').nth(1).fill('TestCreator');
    await page.locator('input[type="number"]').fill('2500');
    
    // カテゴリを選択
    await page.locator('select').first().selectOption('衣装');
    
    // URL情報を入力
    await page.locator('input[placeholder="https://booth.pm/..."]').fill('https://booth.pm/test-product');
    await page.locator('input[placeholder="https://..."]').fill('https://example.com/thumbnail.jpg');
    
    // 説明を入力
    await page.locator('textarea[placeholder="商品の説明"]').fill('これはテスト用のVRChat衣装です。アバターにフィットするデザインです。');
    
    // フォーム送信
    const submitButton = page.locator('button[type="submit"]:has-text("追加")');
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });
    
    // 商品が追加されたことを確認（商品一覧に表示される）
    await expect(page.locator('text=テストVRChat衣装')).toBeVisible();
    await expect(page.locator('text=TestCreator')).toBeVisible();
    await expect(page.locator('text=¥2,500')).toBeVisible();
  });

  test('Complete avatar registration workflow', async ({ page }) => {
    await page.goto('/');
    
    // アバター追加フォームを開く
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await expect(page.locator('h2:has-text("アバターを追加")')).toBeVisible();
    
    // アバター情報を入力
    await page.locator('input[type="text"]').first().fill('テストアバター');
    await page.locator('input[placeholder="https://booth.pm/..."]').fill('https://booth.pm/test-avatar');
    await page.locator('input[placeholder="https://..."]').fill('https://example.com/avatar-thumb.jpg');
    
    // 所有状況を設定
    await page.getByRole('checkbox', { name: '所有している' }).check();
    
    // フォーム送信
    const submitButton = page.locator('button[type="submit"]:has-text("追加")');
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });
    
    // アバターが追加されたことを確認
    await expect(page.locator('text=テストアバター')).toBeVisible();
  });

  test('Product and Avatar interaction workflow', async ({ page }) => {
    await page.goto('/');
    
    // まずアバターを追加
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('メインアバター');
    await page.locator('input[placeholder="https://booth.pm/..."]').fill('https://booth.pm/main-avatar');
    await page.getByRole('checkbox', { name: '所有している' }).check();
    await page.locator('button[type="submit"]:has-text("追加")').click();
    
    // アバターが表示されることを確認
    await expect(page.locator('text=メインアバター')).toBeVisible();
    
    // 商品を追加（アバターとの関連付けテスト）
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('アバター用衣装');
    await page.locator('input[type="text"]').nth(1).fill('FashionCreator');
    await page.locator('input[type="number"]').fill('1800');
    await page.locator('textarea[placeholder="商品の説明"]').fill('メインアバター専用の衣装です');
    
    // アバター選択（追加したアバターが選択肢に含まれているか確認）
    const avatarSelect = page.locator('select').last();
    await expect(avatarSelect.locator('option:has-text("メインアバター")')).toBeVisible();
    
    await page.locator('button[type="submit"]:has-text("追加")').click();
    
    // 商品とアバターの両方が表示されることを確認
    await expect(page.locator('text=アバター用衣装')).toBeVisible();
    await expect(page.locator('text=メインアバター')).toBeVisible();
  });

  test('Data persistence check', async ({ page }) => {
    await page.goto('/');
    
    // データがない状態から開始
    await expect(page.locator('text=商品が登録されていません')).toBeVisible();
    
    // 簡単な商品を追加
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('永続化テスト商品');
    await page.locator('input[type="text"]').nth(1).fill('TestUser');
    await page.locator('input[type="number"]').fill('1000');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    
    // 商品が表示されることを確認
    await expect(page.locator('text=永続化テスト商品')).toBeVisible();
    
    // ページをリロード
    await page.reload();
    
    // リロード後も商品が表示されることを確認（データベース永続化）
    await expect(page.locator('text=永続化テスト商品')).toBeVisible();
    await expect(page.locator('text=TestUser')).toBeVisible();
  });

  test('Empty state and initial setup', async ({ page }) => {
    await page.goto('/');
    
    // 空状態の確認
    await expect(page.locator('text=商品が登録されていません')).toBeVisible();
    await expect(page.locator('text=アバターが登録されていません')).toBeVisible();
    
    // 初回商品追加ボタンの確認
    await expect(page.getByRole('button', { name: '最初の商品を追加する' })).toBeVisible();
    
    // サイドバーのボタンも機能することを確認
    await expect(page.getByRole('button', { name: '商品を追加', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'アバター追加', exact: true })).toBeVisible();
  });
});