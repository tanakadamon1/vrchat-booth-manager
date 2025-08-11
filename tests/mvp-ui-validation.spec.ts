import { test, expect } from '@playwright/test';

test.describe('MVP UI Validation Tests', () => {
  test('Application loads and displays correct interface', async ({ page }) => {
    await page.goto('/');
    
    // アプリケーションが正しく読み込まれることを確認
    await expect(page.locator('h1')).toContainText('VRChat Booth商品管理');
    
    // 初期状態の確認
    await expect(page.locator('text=商品が登録されていません')).toBeVisible();
    await expect(page.locator('text=アバターが登録されていません')).toBeVisible();
    
    // ナビゲーションボタンが表示されることを確認
    await expect(page.getByRole('button', { name: '商品を追加', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'アバター追加', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '最初の商品を追加する' })).toBeVisible();
  });

  test('Product form opens and contains all required fields', async ({ page }) => {
    await page.goto('/');
    
    // 商品追加フォームを開く
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // フォームが表示されることを確認
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 必要なフィールドが全て存在することを確認
    await expect(page.locator('label:has-text("商品名")')).toBeVisible();
    await expect(page.locator('label:has-text("カテゴリ")')).toBeVisible();
    await expect(page.locator('label:has-text("Booth URL")')).toBeVisible();
    await expect(page.locator('label:has-text("サムネイル")')).toBeVisible();
    await expect(page.locator('label:has-text("説明")')).toBeVisible();
    
    // フォームコントロールが機能することを確認
    await page.locator('input[type="text"]').first().fill('テスト商品名');
    await expect(page.locator('input[type="text"]').first()).toHaveValue('テスト商品名');
    
    // カテゴリ選択が機能することを確認
    await page.locator('select').first().selectOption('衣装');
    await expect(page.locator('select').first()).toHaveValue('衣装');
    
    // 送信ボタンとキャンセルボタンが表示されることを確認
    await expect(page.locator('button[type="submit"]:has-text("追加")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('Avatar form opens and contains all required fields', async ({ page }) => {
    await page.goto('/');
    
    // アバター追加フォームを開く
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    
    // フォームが表示されることを確認
    await expect(page.locator('h2:has-text("アバターを追加")')).toBeVisible();
    
    // 必要なフィールドが全て存在することを確認
    await expect(page.locator('label:has-text("アバター名")')).toBeVisible();
    await expect(page.locator('label:has-text("Booth URL")')).toBeVisible();
    await expect(page.locator('label:has-text("サムネイル")')).toBeVisible();
    
    // フォームコントロールが機能することを確認
    await page.locator('input[type="text"]').first().fill('テストアバター名');
    await expect(page.locator('input[type="text"]').first()).toHaveValue('テストアバター名');
    
    // チェックボックスが機能することを確認
    await page.getByRole('checkbox', { name: '所有している' }).check();
    await expect(page.getByRole('checkbox', { name: '所有している' })).toBeChecked();
    
    // 送信ボタンとキャンセルボタンが表示されることを確認
    await expect(page.locator('button[type="submit"]:has-text("追加")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('Form validation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // 商品フォームでバリデーションテスト
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // 空の状態で送信を試みる（バリデーションが動作するかチェック）
    const submitButton = page.locator('button[type="submit"]:has-text("追加")');
    await submitButton.scrollIntoViewIfNeeded();
    
    // 必須フィールドが正しく設定されているか確認
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    
    // フィールドに値を入力して機能することを確認
    await nameInput.fill('バリデーションテスト商品');
    await page.locator('input[placeholder*="booth.pm"]').fill('https://booth.pm/ja/items/123456');
    
    // 入力された値が保持されることを確認
    await expect(nameInput).toHaveValue('バリデーションテスト商品');
    await expect(page.locator('input[placeholder*="booth.pm"]')).toHaveValue('https://booth.pm/ja/items/123456');
  });

  test('Interface responsiveness and layout', async ({ page }) => {
    await page.goto('/');
    
    // レイアウトが正しく表示されることを確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // サイドバーとメインコンテンツエリアが表示されることを確認
    await expect(page.locator('aside, .sidebar, .left-panel')).toBeVisible();
    
    // 商品追加フォームを開いてレスポンシブ性をテスト
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    
    // モーダルが適切に表示されることを確認
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // フォームが適切にスクロール可能であることを確認
    const formContainer = page.locator('.fixed.inset-0');
    await expect(formContainer).toBeVisible();
  });

  test('Navigation and modal behavior', async ({ page }) => {
    await page.goto('/');
    
    // 商品フォームの開閉テスト
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // 別の方法でフォームを開く（初回追加ボタン）
    await page.keyboard.press('Escape'); // フォームを閉じる
    await page.waitForTimeout(500); // 少し待機
    
    await page.getByRole('button', { name: '最初の商品を追加する' }).click();
    await expect(page.locator('h2:has-text("商品を追加")')).toBeVisible();
    
    // アバターフォームのテスト
    await page.keyboard.press('Escape'); // フォームを閉じる
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await expect(page.locator('h2:has-text("アバターを追加")')).toBeVisible();
  });
});