'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-[100dvh] flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-4xl mb-4">😵</p>
            <p className="text-white/80 font-display font-semibold text-lg mb-1">Something went wrong</p>
            <p className="text-white/35 text-sm font-body mb-8">An unexpected error occurred</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-display font-semibold [touch-action:manipulation]"
            >
              Try Again
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
