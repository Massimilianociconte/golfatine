import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Sdrogo ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      if (typeof window !== 'undefined') {
        // Clear potential corrupted storage keys
        localStorage.removeItem('sdrogo_user_profile_v4');
        localStorage.removeItem('sdrogo_offline_queue_v1');
        sessionStorage.clear();
      }
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[350px] p-6 sm:p-10 my-6 rounded-3xl bg-[#0d1210] border-2 border-red-500/30 shadow-2xl flex flex-col items-center justify-center text-center space-y-5 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30">
              Tilt del Mental • Recupero Automatico
            </span>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
              {this.props.fallbackTitle || 'Qualcosa è andato storto sul green'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Nessun disastro da 14 colpi è irreparabile. L'app ha intercettato l'eccezione per proteggere la sessione e prevenire schermate bianche.
            </p>
          </div>

          {this.state.error && (
            <div className="w-full max-w-lg p-3 rounded-xl bg-black/60 border border-white/[0.08] text-left overflow-x-auto">
              <span className="text-[10px] font-mono text-slate-500 block mb-1">Dettaglio Errore:</span>
              <code className="text-xs font-mono text-rose-400 break-words">
                {this.state.error.name}: {this.state.error.message}
              </code>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Riprova Componente</span>
            </button>

            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-[#141d18] border border-white/[0.1] text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-[#1a2620] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Ricarica Pagina</span>
            </button>

            <button
              onClick={this.handleHardReset}
              className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-red-900/40 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reset Cache & Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
