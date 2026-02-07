import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="bg-tile border border-stroke rounded-lg p-6 text-center">
          <div className="text-sm font-medium text-heading mb-1">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </div>
          <div className="text-xs text-dim mb-3">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </div>
          <button
            onClick={this.handleRetry}
            className="text-sm text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
