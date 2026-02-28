import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
    this.setState((s) => ({ ...s, componentStack: errorInfo.componentStack ?? '' }));
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      const { error, componentStack } = this.state;
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-red-300 text-sm mb-2 font-mono break-all">
              {error.message}
            </p>
            {componentStack && (
              <pre className="text-gray-500 text-xs whitespace-pre-wrap break-all mb-4 overflow-auto max-h-40">
                {componentStack}
              </pre>
            )}
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null, componentStack: '' })}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
