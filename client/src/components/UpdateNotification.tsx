import { RefreshCw, X } from 'lucide-react';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function UpdateNotification() {
  const { showUpdatePrompt, refreshApp, dismissUpdate } = useVersionCheck();
  
  if (!showUpdatePrompt) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-blush text-white p-4 shadow-lg z-50">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-white animate-spin" />
          <div>
            <h3 className="font-semibold text-sm">New Update Available</h3>
            <p className="text-xs opacity-90">Tap refresh to get the latest features</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={refreshApp}
            className="bg-white text-blush px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Refresh
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