import React, { useState, useEffect } from 'react';
import { Avatar } from '../types/electron.d';

interface AvatarFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (avatar: any) => void;
  avatar?: Avatar | null;
}

export const AvatarForm: React.FC<AvatarFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  avatar
}) => {
  const [formData, setFormData] = useState({
    name: '',
    booth_url: '',
    thumbnail_url: '',
    is_owned: true
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingThumbnail, setFetchingThumbnail] = useState(false);

  // 編集時のデータ設定
  useEffect(() => {
    if (avatar) {
      setFormData({
        name: avatar.name || '',
        booth_url: avatar.booth_url || '',
        thumbnail_url: avatar.thumbnail_url || '',
        is_owned: avatar.is_owned
      });
    } else {
      // 新規作成時はフォームをリセット
      setFormData({
        name: '',
        booth_url: '',
        thumbnail_url: '',
        is_owned: true
      });
    }
  }, [avatar, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        console.log('Puppeteerでサムネイル自動取得を開始:', url);
        
        const thumbnailUrl = await window.electronAPI.fetch.thumbnail(url);
        
        if (thumbnailUrl) {
          setFormData(prev => ({
            ...prev,
            thumbnail_url: thumbnailUrl
          }));
          console.log('✅ サムネイル自動取得成功:', thumbnailUrl);
        } else {
          console.log('❌ サムネイル自動取得に失敗しました。手動でサムネイルURLを入力してください。');
        }
      } else {
        console.log('Electron API が利用できません');
      }
    } catch (error) {
      console.error('サムネイル取得エラー:', error);
    } finally {
      setFetchingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('アバター名を入力してください');
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      alert('アバターの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {avatar ? 'アバターを編集' : 'アバターを追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* アバター名 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              アバター名 *
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
              サムネイル URL
            </label>
            <input
              type="url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder={fetchingThumbnail ? "サムネイル自動取得中..." : "Booth URLを入力すると自動取得を試行します"}
              disabled={fetchingThumbnail}
            />
            {fetchingThumbnail && (
              <div className="text-xs text-gray-400 mt-1">
                💡 自動取得に失敗した場合：Boothページで右クリック→「画像をコピー」→ここに貼り付け
              </div>
            )}
          </div>

          {/* 所有フラグ */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_owned"
                checked={formData.is_owned}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">所有している</span>
            </label>
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
              {loading ? '保存中...' : (avatar ? '更新' : '追加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};