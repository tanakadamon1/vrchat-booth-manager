import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { Product, Avatar } from '../types/types';

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    let finalDbPath: string;
    
    if (dbPath) {
      finalDbPath = dbPath;
    } else {
      try {
        const userDataPath = app.getPath('userData');
        finalDbPath = path.join(userDataPath, 'booth-manager.db');
      } catch (error) {
        // テスト環境やapp未初期化の場合
        finalDbPath = path.join(process.cwd(), 'test-data', 'booth-manager.db');
      }
    }
    
    this.db = new Database(finalDbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booth_url TEXT,
        name TEXT NOT NULL,
        author TEXT,
        price INTEGER,
        thumbnail_url TEXT,
        category TEXT,
        file_path TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Avatars table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS avatars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        booth_url TEXT,
        thumbnail_url TEXT,
        is_owned BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Product-Avatar relations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_avatar_relations (
        product_id INTEGER,
        avatar_id INTEGER,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (avatar_id) REFERENCES avatars (id) ON DELETE CASCADE,
        PRIMARY KEY (product_id, avatar_id)
      )
    `);

    // Tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // Product-Tags relations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_tags (
        product_id INTEGER,
        tag_id INTEGER,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
        PRIMARY KEY (product_id, tag_id)
      )
    `);
  }

  // Product methods
  getProducts(): Product[] {
    const stmt = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(pa.avatar_id) as avatar_ids
      FROM products p
      LEFT JOIN product_avatar_relations pa ON p.id = pa.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return stmt.all() as Product[];
  }

  getProductById(id: number): Product | undefined {
    const stmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
    return stmt.get(id) as Product | undefined;
  }

  addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO products (booth_url, name, author, price, thumbnail_url, category, file_path, description)
      VALUES (@booth_url, @name, @author, @price, @thumbnail_url, @category, @file_path, @description)
    `);
    const result = stmt.run(product);
    return result.lastInsertRowid as number;
  }

  updateProduct(id: number, product: Partial<Product>): boolean {
    const fields = Object.keys(product).filter(key => key !== 'id' && key !== 'created_at');
    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    
    const stmt = this.db.prepare(`
      UPDATE products 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    
    const result = stmt.run({ ...product, id });
    return result.changes > 0;
  }

  deleteProduct(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Avatar methods
  getAvatars(): Avatar[] {
    const stmt = this.db.prepare('SELECT * FROM avatars ORDER BY name');
    return stmt.all() as Avatar[];
  }

  addAvatar(avatar: Omit<Avatar, 'id' | 'created_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO avatars (name, booth_url, thumbnail_url, is_owned)
      VALUES (@name, @booth_url, @thumbnail_url, @is_owned)
    `);
    const result = stmt.run(avatar);
    return result.lastInsertRowid as number;
  }

  // Relation methods
  addProductAvatarRelation(productId: number, avatarId: number): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO product_avatar_relations (product_id, avatar_id)
      VALUES (?, ?)
    `);
    stmt.run(productId, avatarId);
  }

  removeProductAvatarRelation(productId: number, avatarId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM product_avatar_relations 
      WHERE product_id = ? AND avatar_id = ?
    `);
    stmt.run(productId, avatarId);
  }

  getProductsByAvatar(avatarId: number): Product[] {
    const stmt = this.db.prepare(`
      SELECT p.* FROM products p
      JOIN product_avatar_relations pa ON p.id = pa.product_id
      WHERE pa.avatar_id = ?
      ORDER BY p.created_at DESC
    `);
    return stmt.all(avatarId) as Product[];
  }

  close(): void {
    this.db.close();
  }
}