import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F8F5] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#DDE7DF] rounded-xl p-8">
            <div className="flex items-center gap-3 text-[#B91C1C] mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-xl font-semibold text-[#143624]">
                Unable to load Plant Care Workspace
              </h1>
            </div>
            <p className="text-sm text-[#425A4C] leading-relaxed mb-5">
              A data or runtime error interrupted rendering. You can reload the application to restore your session.
            </p>
            <div className="bg-[#F7FAF8] border border-[#DDE7DF] rounded-lg p-3 text-xs font-mono text-[#425A4C] break-all mb-6">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
