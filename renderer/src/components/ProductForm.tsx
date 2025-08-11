import React, { useState, useEffect } from 'react';
import { Product, Avatar } from '../types/electron.d';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: any) => void;
  product?: Product | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '衣装',
    booth_url: '',
    thumbnail_url: '',
    file_path: '',
    description: '',
    avatar_ids: [] as number[]
  });
  
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingThumbnail, setFetchingThumbnail] = useState(false);

  // アバター一覧を取得
  useEffect(() => {
    const loadAvatars = async () => {
      if (window.electronAPI) {
        try {
          const avatarsData = await window.electronAPI.database.getAvatars();
          setAvatars(avatarsData);
        } catch (error) {
        }
      }
    };
    
    if (isOpen) {
      loadAvatars();
    }
  }, [isOpen]);

  // 編集時のデータ設定
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '衣装',
        booth_url: product.booth_url || '',
        thumbnail_url: product.thumbnail_url || '',
        file_path: product.file_path || '',
        description: product.description || '',
        avatar_ids: product.avatar_ids ? product.avatar_ids.split(',').map(Number) : []
      });
    } else {
      // 新規作成時はフォームをリセット
      setFormData({
        name: '',
        category: '衣装',
        booth_url: '',
        thumbnail_url: '',
        file_path: '',
        description: '',
        avatar_ids: []
      });
    }
  }, [product, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Booth URLが入力された場合、自動でサムネイルを取得
    if (name === 'booth_url' && value && value.includes('booth.pm')) {
      fetchThumbnailFromUrl(value);
    }
  };

  const fetchThumbnailFromUrl = async (url: string) => {
    setFetchingThumbnail(true);
    try {
      if (window.electronAPI) {
        
        const thumbnailUrl = await window.electronAPI.fetch.thumbnail(url);
        
        if (thumbnailUrl) {
          setFormData(prev => ({
            ...prev,
            thumbnail_url: thumbnailUrl
          }));
        } else {
        }
      } else {
      }
    } catch (error) {
    } finally {
      setFetchingThumbnail(false);
    }
  };


  const handleAvatarChange = (avatarId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      avatar_ids: checked 
        ? [...prev.avatar_ids, avatarId]
        : prev.avatar_ids.filter(id => id !== avatarId)
    }));
  };

  const handleFileSelect = async () => {
    if (window.electronAPI) {
      try {
        const filePath = await window.electronAPI.dialog.selectFile();
        if (filePath) {
          setFormData(prev => ({
            ...prev,
            file_path: filePath
          }));
        }
      } catch (error) {
      }
    }
  };

  const handleArchiveFile = async () => {
    if (!formData.file_path) {
      alert('アーカイブするファイルが選択されていません');
      return;
    }

    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.file.archive(formData.file_path);
        
        if (result.success) {
          alert(`ファイルをアーカイブしました。\n\n元のパス: ${result.originalPath}\n\nアーカイブ先: ${result.archivedPath}`);
          // ファイルパスをクリア
          setFormData(prev => ({
            ...prev,
            file_path: ''
          }));
        } else {
          alert(`アーカイブに失敗しました: ${result.error}`);
        }
      } catch (error) {
        alert('ファイルのアーカイブ中にエラーが発生しました');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('商品名を入力してください');
      return;
    }

    setLoading(true);
    
    try {
      const productData = {
        ...formData,
        author: '', // 今後自動取得予定
      };
      
      await onSubmit(productData);
      onClose();
    } catch (error) {
      alert('商品の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {product ? '商品を編集' : '商品を追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 商品名 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              商品名 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              カテゴリ
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="アバター本体">アバター本体</option>
              <option value="衣装">衣装</option>
              <option value="アクセサリー">アクセサリー</option>
              <option value="髪型">髪型</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* Booth URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Booth URL
            </label>
            <input
              type="url"
              name="booth_url"
              value={formData.booth_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="https://booth.pm/..."
            />
          </div>

          {/* サムネイル URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              サムネイル URL {fetchingThumbnail && <span className="text-blue-400">(自動取得中...)</span>}
            </label>
            <input
              type="url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="Booth URLを入力すると自動取得を試行します"
              disabled={fetchingThumbnail}
            />
            <div className="mt-1 text-xs text-gray-400">
              💡 自動取得に失敗した場合：Boothページで右クリック→「画像をコピー」→ここに貼り付け
            </div>
            {formData.thumbnail_url && (
              <div className="mt-2">
                <img 
                  src={formData.thumbnail_url} 
                  alt="商品サムネイル" 
                  className="w-20 h-20 object-cover rounded-md border border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                  }}
                />
              </div>
            )}
          </div>

          {/* ファイルパス */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unitypackageファイル
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="file_path"
                value={formData.file_path}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="ファイルパス"
              />
              <button
                type="button"
                onClick={handleFileSelect}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                選択
              </button>
              {formData.file_path && (
                <button
                  type="button"
                  onClick={handleArchiveFile}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                  title="元ファイルをarchiveフォルダに移動します"
                >
                  アーカイブ
                </button>
              )}
            </div>
            {formData.file_path && (
              <div className="mt-1 text-xs text-gray-400">
                💡 アーカイブボタンで元ファイルをタイムスタンプ付きでarchiveフォルダに整理できます
              </div>
            )}
          </div>

          {/* 対応アバター */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              対応アバター
            </label>
            <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md p-3">
              {avatars.length === 0 ? (
                <p className="text-gray-400 text-sm">アバターが登録されていません</p>
              ) : (
                <div className="space-y-2">
                  {avatars.map((avatar) => (
                    <label key={avatar.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.avatar_ids.includes(avatar.id)}
                        onChange={(e) => handleAvatarChange(avatar.id, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-white">{avatar.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              説明
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="商品の説明"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '保存中...' : (product ? '更新' : '追加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};