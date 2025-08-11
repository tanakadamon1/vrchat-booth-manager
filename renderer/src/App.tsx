import { useState, useEffect } from 'react';
import { Product, Avatar } from './types/electron.d';
import { ProductForm } from './components/ProductForm';
import { AvatarForm } from './components/AvatarForm';
import { ProductDetail } from './components/ProductDetail';
import { Settings } from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  
  // フォームの状態管理
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null);
  
  // フィルタリング状態
  const [selectedAvatars, setSelectedAvatars] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 商品詳細表示状態
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  
  // 設定画面表示状態
  const [showSettings, setShowSettings] = useState(false);
  
  // Toast機能
  const { toasts, removeToast, success, error, warning, info } = useToast();

  // データ再読み込み関数
  const reloadData = async () => {
    try {
      if (window.electronAPI) {
        const [productsData, avatarsData] = await Promise.all([
          window.electronAPI.database.getProducts(),
          window.electronAPI.database.getAvatars()
        ]);
        setProducts(productsData);
        setAvatars(avatarsData);
      }
    } catch (error) {
      console.error('Failed to reload data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.electronAPI) {
          const [productsData, avatarsData] = await Promise.all([
            window.electronAPI.database.getProducts(),
            window.electronAPI.database.getAvatars()
          ]);
          setProducts(productsData);
          setAvatars(avatarsData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            handleAddProduct();
            break;
          case 'a':
            event.preventDefault();
            handleAddAvatar();
            break;
          case 'e':
            event.preventDefault();
            if (window.electronAPI) {
              window.electronAPI.data.export().then(path => {
                if (path) success(`データをエクスポートしました: ${path}`);
              }).catch(() => error('エクスポートに失敗しました'));
            }
            break;
          case 'i':
            event.preventDefault();
            if (window.electronAPI) {
              window.electronAPI.data.import().then(async result => {
                if (result) {
                  success(`データをインポートしました: 商品${result.products}件、アバター${result.avatars}件`);
                  await reloadData();
                }
              }).catch(() => error('インポートに失敗しました'));
            }
            break;
          case ',':
            event.preventDefault();
            setShowSettings(true);
            break;
        }
      } else if (event.key === 'Escape') {
        if (showProductForm) {
          setShowProductForm(false);
          setEditingProduct(null);
        }
        if (showAvatarForm) {
          setShowAvatarForm(false);
          setEditingAvatar(null);
        }
        if (showProductDetail) {
          setShowProductDetail(false);
          setSelectedProduct(null);
        }
        if (showSettings) setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProductForm, showAvatarForm, showProductDetail, showSettings, success, error]);

  // 商品関連のハンドラー
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductSubmit = async (productData: any) => {
    if (window.electronAPI) {
      try {
        if (editingProduct) {
          await window.electronAPI.database.updateProduct(editingProduct.id, productData);
        } else {
          await window.electronAPI.database.addProduct(productData);
        }
        await reloadData();
        setShowProductForm(false);
        setEditingProduct(null);
      } catch (err) {
        console.error('Failed to save product:', err);
        error('商品の保存に失敗しました');
        throw err;
      }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`「${product.name}」を削除しますか？`)) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.database.deleteProduct(product.id);
          await reloadData();
        }
      } catch (err) {
        console.error('Failed to delete product:', err);
        error('商品の削除に失敗しました');
      }
    }
  };

  // アバター関連のハンドラー
  const handleAddAvatar = () => {
    setEditingAvatar(null);
    setShowAvatarForm(true);
  };

  // const handleEditAvatar = (avatar: Avatar) => {
  //   setEditingAvatar(avatar);
  //   setShowAvatarForm(true);
  // };

  const handleAvatarSubmit = async (avatarData: any) => {
    if (window.electronAPI) {
      try {
        if (editingAvatar) {
          // アバター更新はまだ実装していないため、新規追加のみ
          await window.electronAPI.database.addAvatar(avatarData);
        } else {
          await window.electronAPI.database.addAvatar(avatarData);
        }
        await reloadData();
        setShowAvatarForm(false);
        setEditingAvatar(null);
        success(editingAvatar ? 'アバターを更新しました' : 'アバターを追加しました');
      } catch (err) {
        console.error('Failed to save avatar:', err);
        error('アバターの保存に失敗しました');
        throw err;
      }
    }
  };

  // Unity連携
  const handleOpenInUnity = async (product: Product) => {
    console.log('handleOpenInUnity called with product:', product);
    console.log('File path:', product.file_path);
    console.log('electronAPI available:', !!window.electronAPI);
    
    if (product.file_path && window.electronAPI) {
      try {
        console.log('Attempting to open file:', product.file_path);
        await window.electronAPI.shell.openFile(product.file_path);
        success('ファイルを開きました');
      } catch (err) {
        console.error('Failed to open file:', err);
        error(`ファイルを開けませんでした: ${err}`);
      }
    } else {
      const message = !product.file_path ? 'ファイルパスが設定されていません' : 'Electron APIが利用できません';
      error(message);
      console.error(message);
    }
  };

  // 商品詳細を表示
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // 商品詳細から編集へ
  const handleEditFromDetail = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  // フィルタリングされた商品を計算
  const filteredProducts = products.filter(product => {
    // アバターフィルタ
    if (selectedAvatars.length > 0) {
      const productAvatarIds = product.avatar_ids ? product.avatar_ids.split(',').map(id => parseInt(id)) : [];
      const hasMatchingAvatar = selectedAvatars.some(avatarId => productAvatarIds.includes(avatarId));
      if (!hasMatchingAvatar) return false;
    }
    
    // カテゴリフィルタ
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category || '')) {
      return false;
    }
    
    // 検索フィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(query);
      const authorMatch = product.author?.toLowerCase().includes(query);
      const descriptionMatch = product.description?.toLowerCase().includes(query);
      if (!nameMatch && !authorMatch && !descriptionMatch) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {(showProductForm || showAvatarForm || showProductDetail || showSettings) && (
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setShowAvatarForm(false);
                  setShowProductDetail(false);
                  setShowSettings(false);
                  setEditingProduct(null);
                  setEditingAvatar(null);
                  setSelectedProduct(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors text-sm flex items-center gap-2"
                title="戻る"
              >
                ← 戻る
              </button>
            )}
            <h1 className="text-2xl font-bold">VRChat Booth商品管理</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors text-sm"
            title="設定"
          >
            ⚙️ 設定
          </button>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">フィルター</h2>
            
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">アバター</h3>
              <div className="space-y-2">
                {avatars.map((avatar) => (
                  <label key={avatar.id} className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={selectedAvatars.includes(avatar.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAvatars([...selectedAvatars, avatar.id]);
                        } else {
                          setSelectedAvatars(selectedAvatars.filter(id => id !== avatar.id));
                        }
                      }}
                    />
                    <span className="text-sm">{avatar.name}</span>
                  </label>
                ))}
                {avatars.length === 0 && (
                  <p className="text-gray-400 text-sm">アバターが登録されていません</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">カテゴリ</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes('アバター本体')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, 'アバター本体']);
                      } else {
                        setSelectedCategories(selectedCategories.filter(cat => cat !== 'アバター本体'));
                      }
                    }}
                  />
                  <span className="text-sm">アバター本体</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes('衣装')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, '衣装']);
                      } else {
                        setSelectedCategories(selectedCategories.filter(cat => cat !== '衣装'));
                      }
                    }}
                  />
                  <span className="text-sm">衣装</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes('アクセサリー')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, 'アクセサリー']);
                      } else {
                        setSelectedCategories(selectedCategories.filter(cat => cat !== 'アクセサリー'));
                      }
                    }}
                  />
                  <span className="text-sm">アクセサリー</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes('髪型')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, '髪型']);
                      } else {
                        setSelectedCategories(selectedCategories.filter(cat => cat !== '髪型'));
                      }
                    }}
                  />
                  <span className="text-sm">髪型</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes('その他')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, 'その他']);
                      } else {
                        setSelectedCategories(selectedCategories.filter(cat => cat !== 'その他'));
                      }
                    }}
                  />
                  <span className="text-sm">その他</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium mb-2">検索</h3>
              <input
                type="text"
                placeholder="商品名・作者名で検索"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* フィルターリセットボタン */}
            {(selectedAvatars.length > 0 || selectedCategories.length > 0 || searchQuery) && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSelectedAvatars([]);
                    setSelectedCategories([]);
                    setSearchQuery('');
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors text-sm"
                >
                  フィルターをリセット
                </button>
              </div>
            )}
          </aside>

          {/* Main content */}
          <section className="lg:col-span-3">
            <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-xl font-semibold">商品一覧 ({filteredProducts.length}件)</h2>
              <div className="flex gap-2 button-group">
                <button 
                  onClick={handleAddAvatar}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors"
                >
                  アバター追加
                </button>
                <button 
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                >
                  商品を追加
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <p className="text-gray-400 mb-4">商品が登録されていません</p>
                <button 
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md transition-colors"
                >
                  最初の商品を追加する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group relative cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* 画像部分 */}
                    <div className="aspect-square bg-gray-700 flex items-center justify-center relative">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">
                          画像なし
                        </div>
                      )}
                      
                    </div>
                    
                    {/* テキスト部分 - 完全分離 */}
                    <div className="p-3 bg-gray-800 min-h-[60px] flex flex-col justify-center">
                      <h3 className="font-medium text-sm text-white mb-1" title={product.name}>
                        {product.name}
                      </h3>
                      {product.author && product.author !== '' && (
                        <p className="text-gray-400 text-xs" title={product.author}>
                          {product.author}
                        </p>
                      )}
                      {/* デバッグ: 全データを表示 */}
                      <div className="text-red-400 text-xs">
                        DEBUG: {JSON.stringify(product)}
                      </div>
                      
                      {/* アクションボタン */}
                      <div className="flex gap-1 mt-2">
                        {product.file_path && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInUnity(product);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                            title="Unityで開く"
                          >
                            🎮
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* フォーム */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={editingProduct}
      />

      <AvatarForm
        isOpen={showAvatarForm}
        onClose={() => {
          setShowAvatarForm(false);
          setEditingAvatar(null);
        }}
        onSubmit={handleAvatarSubmit}
        avatar={editingAvatar}
      />
      
      {/* 商品詳細 */}
      <ProductDetail
        product={selectedProduct}
        avatars={avatars}
        isOpen={showProductDetail}
        onClose={() => {
          setShowProductDetail(false);
          setSelectedProduct(null);
        }}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteProduct}
        onOpenFile={handleOpenInUnity}
      />
      
      {/* 設定画面 */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onDataReload={reloadData}
        onShowToast={(message, type) => {
          if (type === 'success') success(message);
          else if (type === 'error') error(message);
          else if (type === 'warning') warning(message);
          else info(message);
        }}
      />
      
      {/* Toast通知 */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      </div>
    </ErrorBoundary>
  );
}

export default App
