import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isRecovering: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isRecovering: false
  };

  public componentDidMount() {
    // Clear chunk recovery flag on successful mount (app loaded successfully)
    sessionStorage.removeItem('chunk-recovery-attempt');
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isRecovering: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Check if this is a chunk load error (common in WebViews with stale cache)
    const isChunkError = 
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Importing a module script failed') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.name === 'ChunkLoadError';
    
    if (isChunkError && !sessionStorage.getItem('chunk-recovery-attempt')) {
      // Mark recovery attempt to prevent infinite loops
      sessionStorage.setItem('chunk-recovery-attempt', 'true');
      this.setState({ isRecovering: true });
      
      // Clear caches and reload
      this.handleChunkRecovery();
      return;
    }
    
    // Show user-friendly error message for non-chunk errors
    toast({
      title: "Something went wrong",
      description: "We've encountered an unexpected error. Please refresh the page.",
      variant: "destructive",
    });
  }
  
  private async handleChunkRecovery() {
    try {
      console.log('[ErrorBoundary] Attempting chunk load recovery...');
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Force hard reload bypassing cache
      console.log('[ErrorBoundary] Caches cleared, reloading...');
      window.location.reload();
    } catch (e) {
      console.error('[ErrorBoundary] Recovery failed:', e);
      this.setState({ isRecovering: false });
      sessionStorage.removeItem('chunk-recovery-attempt');
    }
  }

  public render() {
    if (this.state.isRecovering) {
      return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
          <img 
            src="/icon-192.png" 
            alt="Loading..." 
            className="w-24 h-24 object-contain animate-pulse"
          />
          <p className="text-sm text-gray-500 mt-4">Updating app...</p>
        </div>
      );
    }
    
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