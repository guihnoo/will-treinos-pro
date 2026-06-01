"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black px-4">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
            <div className="mb-5 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="h-7 w-7 text-amber-400" />
              </div>
            </div>
            <h2 className="mb-2 text-lg font-black text-white">Algo deu errado</h2>
            {this.state.error?.message && (
              <p className="mb-6 text-sm text-zinc-500 leading-relaxed">
                {this.state.error.message}
              </p>
            )}
            <button
              data-testid="error-boundary-retry"
              onClick={() => window.location.reload()}
              className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-400 transition-colors hover:bg-amber-500/20 active:scale-95"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
