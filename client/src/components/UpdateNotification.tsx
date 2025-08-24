import { RefreshCw, X } from 'lucide-react';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function UpdateNotification() {
  const { showUpdatePrompt, refreshApp, dismissUpdate, currentVersion } = useVersionCheck();
  
  if (!showUpdatePrompt) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blush to-peach text-white p-4 shadow-lg z-50 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <RefreshCw className="h-5 w-5 text-white animate-spin" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold text-sm">🚀 New Update Available</h3>
            <p className="text-xs opacity-90">
              Tap refresh to get the latest features & improvements
            </p>
            {currentVersion && (
              <p className="text-xs opacity-75 mt-1">
                Current: v{currentVersion.version}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={refreshApp}
            className="bg-white text-blush px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <RefreshCw className="h-4 w-4 inline mr-1" />
            Refresh Now
          </button>
          <button
            onClick={dismissUpdate}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss update notification"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}