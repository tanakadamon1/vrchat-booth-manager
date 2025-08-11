import { test, expect } from '@playwright/test';

test.describe('Filtering Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Avatar filter works correctly', async ({ page }) => {
    // まずアバターを追加
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('テストアバター1');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // 商品を追加（アバターに関連付け）
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('テスト商品1');
    
    // アバターをチェック
    await page.locator('label:has-text("テストアバター1") input[type="checkbox"]').check();
    
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // 関連付けのない商品も追加
    await page.waitForTimeout(2000); // モーダルが完全に閉じるのを待つ
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('テスト商品2（関連なし）');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // フィルターなしで2つの商品が表示されることを確認
    await expect(page.locator('text=商品一覧 (2件)')).toBeVisible();

    // アバターフィルターを適用
    await page.locator('aside label:has-text("テストアバター1") input[type="checkbox"]').check();

    // フィルター後は1つの商品のみ表示
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("テスト商品1")')).toBeVisible();
    await expect(page.locator('h3:has-text("テスト商品2")')).not.toBeVisible();
  });

  test('Category filter works correctly', async ({ page }) => {
    // 異なるカテゴリの商品を追加
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('衣装商品');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    await page.waitForTimeout(2000); // モーダルが完全に閉じるのを待つ
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('アクセサリー商品');
    await page.locator('select[name="category"]').selectOption('アクセサリー');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // フィルターなしで両方表示
    await expect(page.locator('text=商品一覧 (2件)')).toBeVisible();

    // カテゴリフィルターを適用
    await page.locator('aside label:has-text("衣装") input[type="checkbox"]').check();

    // フィルター後は衣装のみ表示
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("衣装商品")')).toBeVisible();
    await expect(page.locator('h3:has-text("アクセサリー商品")')).not.toBeVisible();
  });

  test('Search filter works correctly', async ({ page }) => {
    // 検索用の商品を追加
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('検索テスト商品A');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    await page.waitForTimeout(2000); // モーダルが完全に閉じるのを待つ
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('別の商品B');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // 検索前は両方表示
    await expect(page.locator('text=商品一覧 (2件)')).toBeVisible();

    // 検索フィルターを適用
    await page.locator('input[placeholder="商品名・作者名で検索"]').fill('検索テスト');

    // 検索後は1つのみ表示
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("検索テスト商品A")')).toBeVisible();
    await expect(page.locator('h3:has-text("別の商品B")')).not.toBeVisible();
  });

  test('Multiple filters work together', async ({ page }) => {
    // アバターを追加
    await page.getByRole('button', { name: 'アバター追加', exact: true }).click();
    await page.locator('input[type="text"]').first().fill('フィルターアバター');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // 複数の商品を追加
    await page.waitForTimeout(2000); // モーダルが完全に閉じるのを待つ
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('衣装テストA');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('label:has-text("フィルターアバター") input[type="checkbox"]').check();
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    await page.waitForTimeout(2000); // モーダルが完全に閉じるのを待つ
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('衣装テストB');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    await page.waitForTimeout(2000); // モーダルが完全に閉じるのを待つ
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('アクセサリーテスト');
    await page.locator('select[name="category"]').selectOption('アクセサリー');
    await page.locator('label:has-text("フィルターアバター") input[type="checkbox"]').check();
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // 全商品表示
    await expect(page.locator('text=商品一覧 (3件)')).toBeVisible();

    // 複数フィルター適用（アバター + カテゴリ）
    await page.locator('aside label:has-text("フィルターアバター") input[type="checkbox"]').check();
    await page.locator('aside label:has-text("衣装") input[type="checkbox"]').check();

    // アバターに関連付けられた衣装のみ表示
    await expect(page.locator('text=商品一覧 (1件)')).toBeVisible();
    await expect(page.locator('h3:has-text("衣装テストA")')).toBeVisible();
  });

  test('Filter reset button works', async ({ page }) => {
    // 商品を追加
    await page.getByRole('button', { name: '商品を追加', exact: true }).click();
    await page.locator('input[name="name"]').fill('リセットテスト商品');
    await page.locator('select[name="category"]').selectOption('衣装');
    await page.locator('button[type="submit"]:has-text("追加")').click();
    await page.waitForTimeout(1000);

    // フィルターを適用
    await page.locator('aside label:has-text("衣装") input[type="checkbox"]').check();
    await page.locator('input[placeholder="商品名・作者名で検索"]').fill('リセット');

    // リセットボタンが表示される
    await expect(page.locator('button:has-text("フィルターをリセット")')).toBeVisible();

    // リセットボタンをクリック
    await page.locator('button:has-text("フィルターをリセット")').click();

    // フィルターがクリアされる
    await expect(page.locator('aside label:has-text("衣装") input[type="checkbox"]')).not.toBeChecked();
    await expect(page.locator('input[placeholder="商品名・作者名で検索"]')).toHaveValue('');
    
    // リセットボタンが非表示になる
    await expect(page.locator('button:has-text("フィルターをリセット")')).not.toBeVisible();
  });
});