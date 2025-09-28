import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }
    
    // Show user-friendly error message
    toast({
      title: "Something went wrong",
      description: "We've encountered an unexpected error. Please refresh the page.",
      variant: "destructive",
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="text-6xl mb-4">🌸</div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We've encountered an unexpected error. Please refresh the page to continue.
          </p>
          <button 
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;