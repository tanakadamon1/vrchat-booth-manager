import React, { useState } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onDataReload,
  onShowToast
}) => {
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const exportPath = await window.electronAPI.data.export();
        if (exportPath) {
          onShowToast?.(`データをエクスポートしました: ${exportPath}`, 'success');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      onShowToast?.('データのエクスポートに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!confirm('データをインポートすると、既存のデータに追加されます。続行しますか？')) {
      return;
    }

    setLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.data.import();
        if (result) {
          onShowToast?.(`データをインポートしました: 商品${result.products}件、アバター${result.avatars}件`, 'success');
          onDataReload();
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      onShowToast?.('データのインポートに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBoothProfile = () => {
    if (window.electronAPI) {
      window.electronAPI.shell.openExternal('https://booth.pm/');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* データ管理セクション */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">データ管理</h3>
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 rounded-md transition-colors text-left"
              >
                <div className="font-medium">データをエクスポート</div>
                <div className="text-sm text-gray-300">全てのデータをJSONファイルに保存</div>
              </button>
              
              <button
                onClick={handleImportData}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded-md transition-colors text-left"
              >
                <div className="font-medium">データをインポート</div>
                <div className="text-sm text-gray-300">JSONファイルからデータを読み込み</div>
              </button>
            </div>
          </div>

          {/* リンクセクション */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">便利なリンク</h3>
            <div className="space-y-3">
              <button
                onClick={handleOpenBoothProfile}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-md transition-colors text-left"
              >
                <div className="font-medium">Boothを開く</div>
                <div className="text-sm text-gray-300">ブラウザでBoothサイトを開きます</div>
              </button>
            </div>
          </div>

          {/* アプリ情報セクション */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">アプリ情報</h3>
            <div className="bg-gray-700 p-4 rounded-md">
              <div className="text-sm text-gray-300 space-y-1">
                <div><strong>VRChat Booth Manager</strong></div>
                <div>バージョン: 0.2.0 (ベータ版)</div>
                <div>VRChat改変向け商品管理ツール</div>
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div>開発: VRChat Booth Manager Team</div>
                  <div>ライセンス: MIT</div>
                  <div>更新: 2024年末 ベータリリース</div>
                </div>
              </div>
            </div>
          </div>

          {/* 使用方法・ヘルプセクション */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">使用方法・ヘルプ</h3>
            <div className="bg-gray-700 p-4 rounded-md text-sm text-gray-300 space-y-3">
              <div>
                <h4 className="font-medium text-white mb-2">基本的な使い方:</h4>
                <div className="space-y-1 ml-2">
                  <p>1. 「アバター追加」でお持ちのアバターを登録</p>
                  <p>2. 「商品を追加」でBooth商品を登録</p>
                  <p>3. Booth URLを入力すると自動でサムネイル取得</p>
                  <p>4. 対応アバターを選択して関連付け</p>
                  <p>5. フィルター機能で商品を整理・検索</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">便利な機能:</h4>
                <div className="space-y-1 ml-2">
                  <p>• 🎮ボタン: Unitypackageファイルを直接開く</p>
                  <p>• ✏️ボタン: 商品情報を編集</p>
                  <p>• 🗑️ボタン: 商品を削除</p>
                  <p>• 商品カードクリック: 詳細情報を表示</p>
                  <p>• データエクスポート/インポート: バックアップ作成</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">トラブルシューティング:</h4>
                <div className="space-y-1 ml-2">
                  <p>• サムネイル取得失敗: 手動でURLを入力</p>
                  <p>• ファイルが開けない: パスが正しいか確認</p>
                  <p>• データが消えた: エクスポートからインポート</p>
                  <p>• アプリが重い: 不要な商品を削除</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">ショートカット:</h4>
                <div className="space-y-1 ml-2">
                  <p>• Ctrl+N: 新しい商品を追加</p>
                  <p>• Ctrl+A: 新しいアバターを追加</p>
                  <p>• Ctrl+E: データをエクスポート</p>
                  <p>• Ctrl+I: データをインポート</p>
                  <p>• Escape: モーダルを閉じる</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 閉じるボタン */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};