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
  avatar_ids?: string;
}

export interface Avatar {
  id: number;
  name: string;
  booth_url?: string;
  thumbnail_url?: string;
  is_owned: boolean;
  created_at: string;
}

export interface ElectronAPI {
  database: {
    getProducts: () => Promise<Product[]>;
    addProduct: (product: any) => Promise<number>;
    updateProduct: (id: number, product: any) => Promise<boolean>;
    deleteProduct: (id: number) => Promise<boolean>;
    getAvatars: () => Promise<Avatar[]>;
    addAvatar: (avatar: any) => Promise<number>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    openFile: (filePath: string) => Promise<void>;
  };
  dialog: {
    selectFile: () => Promise<string | null>;
    selectMultipleFiles: () => Promise<string[]>;
    selectDirectory: () => Promise<string | null>;
  };
  file: {
    archive: (filePath: string) => Promise<{
      success: boolean;
      originalPath?: string;
      archivedPath?: string;
      archiveDir?: string;
      error?: string;
    }>;
  };
  fetch: {
    thumbnail: (boothUrl: string) => Promise<string | null>;
  };
  data: {
    export: () => Promise<string | null>;
    import: () => Promise<{ products: number; avatars: number } | null>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}