import React from 'react';
import { Product, Avatar } from '../types/electron.d';

interface ProductDetailProps {
  product: Product | null;
  avatars: Avatar[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onOpenFile: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  avatars,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onOpenFile
}) => {
  if (!isOpen || !product) return null;

  // 関連アバターを取得
  const relatedAvatarIds = product.avatar_ids ? product.avatar_ids.split(',').map(id => parseInt(id)) : [];
  const relatedAvatars = avatars.filter(avatar => relatedAvatarIds.includes(avatar.id));

  const handleBoothOpen = async () => {
    if (product.booth_url && window.electronAPI) {
      await window.electronAPI.shell.openExternal(product.booth_url);
    }
  };

  const handleEdit = () => {
    onEdit(product);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`「${product.name}」を削除してもよろしいですか？`)) {
      onDelete(product);
      onClose();
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Image */}
          <div className="flex justify-center">
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="product-detail-image rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-base">画像なし</span>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-4">
            {/* Category */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">カテゴリ</h3>
              <p className="text-white">{product.category || '-'}</p>
            </div>

            {/* Author */}
            {product.author && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">作者</h3>
                <p className="text-white">{product.author}</p>
              </div>
            )}


            {/* Related Avatars */}
            {relatedAvatars.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">対応アバター</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedAvatars.map(avatar => (
                    <span 
                      key={avatar.id}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white"
                    >
                      {avatar.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">説明</h3>
                <p className="text-white whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* File Path */}
            {product.file_path && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">ファイルパス</h3>
                <p className="text-white text-xs font-mono break-all bg-gray-700 p-2 rounded">
                  {product.file_path}
                </p>
              </div>
            )}

            {/* Created/Updated */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div>
                <span>作成日: </span>
                <span>{new Date(product.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
              <div>
                <span>更新日: </span>
                <span>{new Date(product.updated_at).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between items-center">
          <div className="flex gap-2">
            {product.booth_url && (
              <button
                onClick={handleBoothOpen}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Boothで見る
              </button>
            )}
            {product.file_path && (
              <button
                onClick={() => {
                  console.log('ファイルを開きます:', product.file_path);
                  onOpenFile(product);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md transition-colors flex items-center gap-2 text-white font-semibold"
                title={`ファイルを開く: ${product.file_path}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                🎮 ファイルを開く
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};