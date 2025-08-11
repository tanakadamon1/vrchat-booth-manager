import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-red-400 mb-2">エラーが発生しました</h1>
              <p className="text-gray-300">
                アプリケーションで予期しないエラーが発生しました。
              </p>
            </div>
            
            {this.state.error && (
              <div className="mb-6">
                <details className="bg-gray-700 p-4 rounded-md">
                  <summary className="cursor-pointer text-sm font-medium text-gray-300 mb-2">
                    エラー詳細
                  </summary>
                  <div className="text-xs text-gray-400 font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
              >
                再読み込み
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                アプリを再起動
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-400 text-center">
              問題が解決しない場合は、設定からデータをエクスポートして
              開発者に報告してください。
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}