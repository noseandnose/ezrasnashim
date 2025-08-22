// Network resilience utilities for handling offline/slow connections
export class NetworkResilience {
  private static retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff

  public static async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const delay = this.retryDelays[i] || 8000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  public static isOnline(): boolean {
    return navigator.onLine;
  }

  public static onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}