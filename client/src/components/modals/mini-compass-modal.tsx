import { useEffect, useState } from 'react';
import { X, Heart } from 'lucide-react';
import { SimpleCompass, CompassState } from '@/lib/compass';
import bhPinkIcon from '@assets/BH_Pink_1755681221620.png';
import bhGreenIcon from '@assets/BH_Green_1755681221619.png';
import { Button } from '@/components/ui/button';

interface MiniCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCompassModal({ isOpen, onClose }: MiniCompassModalProps) {
  const [compass, setCompass] = useState(() => new SimpleCompass());
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

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    setIsIOS(isiOS);
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = compass.subscribe(setState);
    return () => {
      unsubscribe();
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

  const handleEnableCompass = async () => {
    await compass.requestPermission();
  };

  const handleRetry = async () => {
    compass.dispose();
    setState({
      deviceHeading: 0,
      bearing: 0,
      isAligned: false,
      location: null,
      hasPermission: false,
      isSupported: false,
      error: null
    });
    const newCompass = new SimpleCompass();
    setCompass(newCompass);
    await newCompass.requestPermission();
  };

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

        {!state.isSupported ? (
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
                <Heart 
                  className="w-8 h-8 text-blush fill-blush"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: state.isAligned 
                      ? 'translate(-50%, -50%) scale(1.2)' 
                      : 'translate(-50%, -50%)',
                    transition: state.isAligned ? 'transform 0.6s ease-in-out' : 'none',
                    animation: state.isAligned ? 'heartPulse 1.5s ease-in-out infinite' : 'none'
                  }}
                />
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
