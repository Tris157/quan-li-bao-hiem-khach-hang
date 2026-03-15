import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-stone-900">Đã có lỗi xảy ra</h1>
          <p className="mt-2 max-w-md text-stone-500">
            Hệ thống gặp sự cố không mong muốn. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
          >
            <RefreshCcw className="h-5 w-5" />
            Tải lại trang
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 max-w-full overflow-auto rounded-lg bg-stone-100 p-4 text-left text-xs text-red-800">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}
