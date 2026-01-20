import { useEffect, useState, useCallback, useRef } from 'react';
import { X, Heart } from 'lucide-react';
import type { SimpleCompass as SimpleCompassType, CompassState } from '@/lib/compass';
import bhPinkIcon from '@assets/BH_Pink_1755681221620.png';
import bhGreenIcon from '@assets/BH_Green_1755681221619.png';
import { Button } from '@/components/ui/button';

interface MiniCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCompassModal({ isOpen, onClose }: MiniCompassModalProps) {
  const [compass, setCompass] = useState<SimpleCompassType | null>(null);
  const [state, setState] = useState<CompassState>({
    deviceHeading: 0,
    bearing: 0,
    isAligned: false,
    location: null,
    hasPermission: false,
    isSupported: false,
    error: null
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // Track if modal is still mounted during async operations
  const mountedRef = useRef(true);
  const permissionPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    setIsIOS(isiOS);
    setIsStandalone(standalone);
  }, []);

  // Track mounted state for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load compass module when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setIsLoading(true);
    setLoadError(null);
    import('@/lib/compass')
      .then(({ SimpleCompass }) => {
        if (mounted && mountedRef.current) {
          const newCompass = new SimpleCompass();
          setCompass(newCompass);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('[MiniCompass] Failed to load compass module:', error);
        if (mounted && mountedRef.current) {
          setLoadError('Failed to load compass. Please try again.');
          setIsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [isOpen]);
  
  // Handle visibility changes during permission prompts
  // When the OS permission dialog appears, the page loses focus
  // When it returns, we need to ensure the modal is still responsive
  useEffect(() => {
    if (!isOpen) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        // Reset permission requesting state if we return from a permission prompt
        setIsRequestingPermission(false);
        
        // Force a state update to ensure UI is responsive
        setState(prev => ({ ...prev }));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !compass) return;

    const unsubscribe = compass.subscribe(setState);
    return () => {
      unsubscribe();
      // Dispose compass when modal closes to free resources
      compass.dispose();
    };
  }, [compass, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (state.isAligned && navigator.vibrate) {
      if (isIOS && !isStandalone) {
        navigator.vibrate(200);
      } else {
        const heartbeatPattern = [210, 80, 340, 80, 790];
        navigator.vibrate(heartbeatPattern);
      }
    }

    return () => {
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, [state.isAligned, isIOS, isStandalone, isOpen]);

  // Handle permission request with proper state management
  // Ensures modal stays open and responsive during/after OS permission prompts
  const handleEnableCompass = useCallback(async () => {
    if (!compass || isRequestingPermission) return;
    
    setIsRequestingPermission(true);
    
    try {
      // Store the promise so we can track it
      permissionPromiseRef.current = compass.requestPermission();
      const granted = await permissionPromiseRef.current;
      
      // Only update state if still mounted and modal is open
      if (mountedRef.current) {
        if (!granted) {
          setState(prev => ({
            ...prev,
            error: 'Compass permission was denied. Please enable in your device settings.',
            hasPermission: false
          }));
        }
      }
    } catch (error) {
      console.error('[MiniCompass] Permission request failed:', error);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: 'Failed to request compass permission. Please try again.',
          hasPermission: false
        }));
      }
    } finally {
      if (mountedRef.current) {
        setIsRequestingPermission(false);
      }
      permissionPromiseRef.current = null;
    }
  }, [compass, isRequestingPermission]);

  const handleRetry = useCallback(async () => {
    if (compass) compass.dispose();
    setState({
      deviceHeading: 0,
      bearing: 0,
      isAligned: false,
      location: null,
      hasPermission: false,
      isSupported: false,
      error: null
    });
    
    try {
      const { SimpleCompass } = await import('@/lib/compass');
      if (mountedRef.current) {
        const newCompass = new SimpleCompass();
        setCompass(newCompass);
        // Don't auto-request permission on retry - let user click button
      }
    } catch (error) {
      console.error('[MiniCompass] Retry failed:', error);
      if (mountedRef.current) {
        setLoadError('Failed to reinitialize compass. Please try again.');
      }
    }
  }, [compass]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const jerusalemArrowRotation = state.location ? state.bearing : 0;
  const deviceHeadingRotation = state.deviceHeading;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        data-bridge-container
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black platypi-bold">Direct your Heart Home</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-3 border-blush/20 border-t-blush rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading compass...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-6">
            <div className="bg-red-50 rounded-2xl p-4 mb-4">
              <p className="text-red-700 text-sm">{loadError}</p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        ) : !state.isSupported ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Compass not supported on this device</p>
          </div>
        ) : state.error ? (
          <div className="text-center py-6">
            <div className="bg-red-50 rounded-2xl p-4 mb-4">
              <p className="text-red-700 text-sm">{state.error}</p>
            </div>
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
          </div>
        ) : !state.location ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-3 border-blush/20 border-t-blush rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Getting your location...</p>
          </div>
        ) : !state.hasPermission ? (
          <div className="text-center py-6">
            <p className="text-sm text-black mb-3">
              {/Android/i.test(navigator.userAgent)
                ? 'Tap the button below to activate motion sensors'
                : 'Please enable compass access'}
            </p>
            <Button
              onClick={handleEnableCompass}
              className="w-full bg-gradient-to-r from-blush to-peach text-white py-2 rounded-xl font-medium"
            >
              {/Android/i.test(navigator.userAgent) ? 'Activate Sensors' : 'Enable Compass'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-56 h-56 mx-auto">
              <div 
                className="w-full h-full rounded-full border-4 border-blush/20 bg-gradient-to-br from-white to-blush/5 shadow-lg relative select-none"
                style={{ 
                  transform: `rotate(${-deviceHeadingRotation}deg)`,
                  transition: 'transform 0.3s ease-out',
                  willChange: 'transform',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                <div className="absolute inset-4 rounded-full border border-blush/10">
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-black">N</div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-black">E</div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-black">S</div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-black">W</div>
                </div>

                <div 
                  className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none z-30"
                  style={{ 
                    transform: `translate(-50%, -50%) rotate(${jerusalemArrowRotation}deg)`
                  }}
                >
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-white flex items-center justify-center z-30">
                      <img 
                        src={state.isAligned ? bhGreenIcon : bhPinkIcon}
                        alt="Jerusalem direction"
                        className="w-8 h-8"
                        style={{
                          transform: `rotate(${deviceHeadingRotation - jerusalemArrowRotation}deg)`,
                          animation: state.isAligned ? 'bhPulse 1.5s ease-in-out infinite' : 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
                <div 
                  className={`w-1.5 h-16 ${state.isAligned ? 'bg-blush' : 'bg-gray-400'}`}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>

              <div className="absolute top-1/2 left-1/2 z-40 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
                {/* Heart with white background circle */}
                <div 
                  className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: state.isAligned ? 'heartPulse 1.5s ease-in-out infinite' : 'none'
                  }}
                >
                  <Heart 
                    className={`w-7 h-7 ${state.isAligned ? 'text-rose-500 fill-rose-500' : 'text-blush fill-blush'}`}
                  />
                </div>
              </div>
            </div>

            {state.isAligned ? (
              <div className="bg-green-50 rounded-2xl p-3 border border-green-200 text-center">
                <p className="text-green-800 font-medium text-sm">Your heart is in the right place</p>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-200 text-center">
                <p className="text-blue-800 font-medium text-sm">Turn to align with Jerusalem</p>
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes heartPulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            14% { transform: translate(-50%, -50%) scale(1.3); }
            28% { transform: translate(-50%, -50%) scale(1); }
            42% { transform: translate(-50%, -50%) scale(1.3); }
            70% { transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes bhPulse {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(0deg) scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
}
