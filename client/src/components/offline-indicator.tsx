import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      
      // Only show "back online" if we were previously offline
      if (wasOffline.current) {
        setShowReconnectedMessage(true);
        wasOffline.current = false;
        
        // Hide the reconnected message after 3 seconds
        setTimeout(() => {
          setShowReconnectedMessage(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
      wasOffline.current = true;
    };

    // Check initial state
    if (!navigator.onLine) {
      wasOffline.current = true;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show if online and no reconnected message, or if dismissed
  if ((isOnline && !showReconnectedMessage) || (dismissed && !isOnline)) {
    // Show a subtle persistent indicator when offline and dismissed
    if (!isOnline && dismissed) {
      return (
        <button
          onClick={() => setDismissed(false)}
          className="fixed top-16 right-4 z-50 p-2 rounded-full bg-orange-100/90 dark:bg-orange-900/90 shadow-lg border border-orange-200 dark:border-orange-700 transition-all duration-300 hover:scale-105"
          data-testid="status-offline-mini"
          aria-label="You're offline - tap for details"
        >
          <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-300" />
        </button>
      );
    }
    return null;
  }

  return (
    <div 
      className={`fixed top-16 left-4 right-4 z-50 p-3 rounded-xl shadow-lg transition-all duration-300 animate-in slide-in-from-top-2 ${
        isOnline 
          ? 'bg-green-50/95 dark:bg-green-900/95 text-green-800 dark:text-green-200 border border-green-200/50 dark:border-green-700/50 backdrop-blur-sm' 
          : 'bg-orange-50/95 dark:bg-orange-900/95 text-orange-800 dark:text-orange-200 border border-orange-200/50 dark:border-orange-700/50 backdrop-blur-sm'
      }`}
      data-testid={isOnline ? "status-online" : "status-offline"}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 flex-shrink-0" />
              <span>Back online! Content syncing...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>You're offline. Previously loaded content is still available.</span>
            </>
          )}
        </div>
        {!isOnline && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-orange-200/50 dark:hover:bg-orange-700/50 transition-colors"
            aria-label="Dismiss offline notification"
            data-testid="button-dismiss-offline"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}