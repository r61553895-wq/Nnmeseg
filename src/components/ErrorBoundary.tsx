import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Vesper ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="vesper-error-fallback"
          className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0c10] text-[#ededee] p-6 font-sans select-none"
        >
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#12141c] border border-zinc-800 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-5">
              <AlertTriangle size={28} />
            </div>

            <h1 className="text-xl font-bold text-zinc-100 mb-2">Vesper Messenger</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              An unexpected display issue occurred. You can safely reload the messenger or reset local temporary cache.
            </p>

            {this.state.error && (
              <div className="w-full p-3 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs font-mono text-zinc-400 text-left overflow-x-auto mb-6 max-h-24">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                id="error-boundary-reload-btn"
                onClick={this.handleReload}
                className="flex-1 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <RefreshCw size={15} />
                <span>Reload App</span>
              </button>

              <button
                id="error-boundary-reset-btn"
                onClick={this.handleReset}
                className="flex-1 w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Reset Cache</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-6">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Vesper Secure Client Recovery</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
