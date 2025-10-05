import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <div 
      className={`fixed top-16 left-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
          : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700'
      } ${
        showOfflineMessage ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'
      }`}
      data-testid={isOnline ? "status-online" : "status-offline"}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online! Content syncing...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Previously loaded content remains available.</span>
          </>
        )}
      </div>
    </div>
  );
}