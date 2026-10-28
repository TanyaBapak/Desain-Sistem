import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    componentStack: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack || undefined });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Terjadi Kendala Memuat Data</h3>
              <p className="text-xs text-slate-400 mt-1">
                Aplikasi mendeteksi kendala pada antarmuka. Silakan muat ulang halaman.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-red-400 font-mono text-left overflow-x-auto whitespace-pre-wrap max-h-60 space-y-2">
                  <div className="font-bold text-red-300">{this.state.error.message}</div>
                  {this.state.componentStack && (
                    <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                      <strong>Komponen:</strong>
                      <div>{this.state.componentStack}</div>
                    </div>
                  )}
                  {this.state.error.stack && (
                    <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1 opacity-70">
                      <strong>Stack trace:</strong>
                      <div>{this.state.error.stack}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={this.handleReload}
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Muat Ulang Halaman</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

