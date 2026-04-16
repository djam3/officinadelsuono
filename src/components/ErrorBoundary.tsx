import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Errore catturato:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest mb-2">
              Qualcosa è andato storto
            </h2>
            <p className="text-zinc-500 text-sm max-w-sm">
              Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
            </p>
            {this.state.error && (
              <p className="text-zinc-700 text-xs font-mono mt-3 max-w-sm break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-bold text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Riprova
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 glass text-zinc-300 hover:text-white rounded-full font-bold text-sm transition-colors"
            >
              Torna alla Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
