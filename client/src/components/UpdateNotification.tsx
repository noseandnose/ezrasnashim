import { RefreshCw, X, Sparkles, Clock } from 'lucide-react';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { useState, useEffect } from 'react';

export default function UpdateNotification() {
  const { showUpdatePrompt, refreshApp, dismissUpdate, currentVersion, updateInfo } = useVersionCheck();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (updateInfo?.isCritical && showUpdatePrompt) {
      setCountdown(300);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            refreshApp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [updateInfo?.isCritical, showUpdatePrompt, refreshApp]);

  if (!showUpdatePrompt) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed top-0 left-0 right-0 ${updateInfo?.isCritical ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-blush to-peach'} text-white shadow-lg z-50 animate-in slide-in-from-top duration-300`}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-shrink-0">
              {updateInfo?.isCritical ? (
                <>
                  <Sparkles className="h-5 w-5 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </>
              ) : (
                <RefreshCw className="h-5 w-5 text-white animate-spin" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">
                  {updateInfo?.isCritical ? '⚡ Critical Update Required' : '🚀 New Update Available'}
                </h3>
                {countdown !== null && (
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(countdown)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs opacity-90">
                {updateInfo?.isCritical
                  ? 'This update contains critical security fixes and will auto-refresh soon'
                  : 'Tap refresh to get the latest features & improvements'}
              </p>
              {currentVersion && (
                <p className="text-xs opacity-75 mt-1">
                  Current: v{currentVersion.version} → Latest: v{updateInfo?.version || 'Unknown'}
                </p>
              )}

              {updateInfo?.releaseNotes && (
                <div className="mt-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs underline opacity-90 hover:opacity-100"
                  >
                    {isExpanded ? 'Hide' : 'Show'} what's new
                  </button>
                  {isExpanded && (
                    <div className="mt-2 text-xs bg-white/10 rounded p-2 max-h-32 overflow-y-auto">
                      {updateInfo.releaseNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={refreshApp}
              className="bg-white text-blush px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              {updateInfo?.isCritical ? 'Update Now' : 'Refresh Now'}
            </button>
            {!updateInfo?.isCritical && (
              <button
                onClick={dismissUpdate}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss update notification"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}