export interface Product {
  id: number;
  booth_url?: string;
  name: string;
  author?: string;
  price?: number;
  thumbnail_url?: string;
  category?: string;
  file_path?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  avatar_ids?: string; // comma-separated avatar IDs
}

export interface Avatar {
  id: number;
  name: string;
  booth_url?: string;
  thumbnail_url?: string;
  is_owned: boolean;
  created_at: string;
}

export interface ProductAvatarRelation {
  product_id: number;
  avatar_id: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface ProductTag {
  product_id: number;
  tag_id: number;
}

export interface CategoryFilter {
  id: string;
  name: string;
  checked: boolean;
}

export interface FilterState {
  categories: CategoryFilter[];
  avatars: number[];
  searchText: string;
}

// Form types
export interface ProductForm {
  booth_url?: string;
  name: string;
  author?: string;
  price?: number;
  thumbnail_url?: string;
  category?: string;
  file_path?: string;
  description?: string;
  avatar_ids?: number[];
}

export interface AvatarForm {
  name: string;
  booth_url?: string;
  thumbnail_url?: string;
  is_owned: boolean;
}

// API response types for Booth scraping
export interface BoothProductInfo {
  name: string;
  author: string;
  price: number;
  thumbnail_url: string;
  description: string;
}