import { DatabaseManager } from './database';
import { Product, Avatar } from '../types/types';

// テスト用のダミーデータ
const testProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
  name: 'テスト商品',
  author: 'テスト作者',
  price: 1000,
  category: '衣装',
  booth_url: 'https://booth.pm/test',
  thumbnail_url: 'https://example.com/test.jpg',
  file_path: 'C:/test/product.unitypackage',
  description: 'これはテスト用の商品です'
};

const testAvatar: Omit<Avatar, 'id' | 'created_at'> = {
  name: 'テストアバター',
  booth_url: 'https://booth.pm/avatar',
  thumbnail_url: 'https://example.com/avatar.jpg',
  is_owned: true
};

export function testDatabase() {
  console.log('=== データベーステスト開始 ===');
  
  try {
    // テスト用のデータベースパスを指定
    const testDbPath = './test-data/test-booth-manager.db';
    const db = new DatabaseManager(testDbPath);
    
    // 1. アバター追加テスト
    console.log('1. アバター追加テスト');
    const avatarId = db.addAvatar(testAvatar);
    console.log(`アバター追加完了: ID ${avatarId}`);
    
    // 2. 商品追加テスト
    console.log('2. 商品追加テスト');
    const productId = db.addProduct(testProduct);
    console.log(`商品追加完了: ID ${productId}`);
    
    // 3. 商品とアバターの関連付け
    console.log('3. 商品とアバターの関連付け');
    db.addProductAvatarRelation(productId, avatarId);
    console.log('関連付け完了');
    
    // 4. データ取得テスト
    console.log('4. データ取得テスト');
    const products = db.getProducts();
    const avatars = db.getAvatars();
    
    console.log(`商品数: ${products.length}`);
    console.log(`アバター数: ${avatars.length}`);
    
    if (products.length > 0) {
      console.log('商品データ:', products[0]);
    }
    
    if (avatars.length > 0) {
      console.log('アバターデータ:', avatars[0]);
    }
    
    // 5. アバター別商品取得テスト
    console.log('5. アバター別商品取得テスト');
    const avatarProducts = db.getProductsByAvatar(avatarId);
    console.log(`アバター${avatarId}の商品数: ${avatarProducts.length}`);
    
    db.close();
    console.log('=== データベーステスト完了 ===');
    
    return true;
  } catch (error) {
    console.error('データベーステストエラー:', error);
    return false;
  }
}

// テスト実行
if (require.main === module) {
  testDatabase();
}