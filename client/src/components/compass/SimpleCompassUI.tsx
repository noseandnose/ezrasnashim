/**
 * Simplified Compass UI Component
 * Single transform, minimal logic, clean design
 */

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { SimpleCompass, CompassState } from '@/lib/compass';
import { MapPin, Compass as CompassIcon, Heart } from 'lucide-react';

// Import compass icons
import bhPinkIcon from '@assets/BH_Pink_1755681221620.png';
import bhGreenIcon from '@assets/BH_Green_1755681221619.png';

interface SimpleCompassUIProps {
  onClose?: () => void;
}

export function SimpleCompassUI({ onClose }: SimpleCompassUIProps) {
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
  const [debugMode] = useState(new URLSearchParams(window.location.search).get('debug') === 'compass');
  const [vibrationInterval, setVibrationInterval] = useState<NodeJS.Timeout | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    // Detect iOS and standalone mode
    const userAgent = navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    setIsIOS(isiOS);
    setIsStandalone(standalone);
  }, []);
  
  useEffect(() => {
    const unsubscribe = compass.subscribe(setState);
    return () => {
      unsubscribe();
      compass.dispose();
      if (vibrationInterval) {
        clearInterval(vibrationInterval);
      }
    };
  }, [compass, vibrationInterval]);
  
  // Handle vibration when aligned - synced with heart animation (1.5s cycle, lub-dub pattern)
  useEffect(() => {
    if (state.isAligned && navigator.vibrate) {
      if (isIOS && !isStandalone) {
        // iOS Safari has severe Vibration API limitations:
        // 1. Doesn't support patterns (arrays)
        // 2. Requires user gesture to trigger vibration
        // 3. Automatic events (like alignment) get blocked
        // Solution: Single vibration on alignment change (may still not work in browser)
        navigator.vibrate(200);
      } else {
        // Android and iOS PWA: Use full heartbeat pattern
        // Heart animation: 1500ms cycle with pulses at 14% (210ms) and 42% (630ms)
        const heartbeatPattern = [210, 80, 340, 80, 790]; // Total = 1500ms
        
        // Start vibration immediately
        navigator.vibrate(heartbeatPattern);
        
        // Repeat pattern every 1500ms to match animation
        const interval = setInterval(() => {
          navigator.vibrate(heartbeatPattern);
        }, 1500);
        
        setVibrationInterval(interval);
      }
    } else {
      // Stop vibration when not aligned
      if (vibrationInterval) {
        clearInterval(vibrationInterval);
        setVibrationInterval(null);
      }
      if (navigator.vibrate) {
        navigator.vibrate(0); // Cancel any ongoing vibration
      }
    }
    
    return () => {
      if (vibrationInterval) {
        clearInterval(vibrationInterval);
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, [state.isAligned, isIOS, isStandalone]);
  
  // Removed device-specific detection
  
  const handleEnableCompass = async () => {
    await compass.requestPermission();
  };

  const handleRetry = async () => {
    // Clean up old compass
    compass.dispose();
    
    // Clear current error state
    setState({
      deviceHeading: 0,
      bearing: 0,
      isAligned: false,
      location: null,
      hasPermission: false,
      isSupported: false,
      error: null
    });
    
    // Create new compass instance to fully restart
    const newCompass = new SimpleCompass();
    setCompass(newCompass);
    
    // Request permission on new instance
    await newCompass.requestPermission();
  };
  
  // Calculate rotations for Jerusalem arrow and device heading line
  const jerusalemArrowRotation = state.location ? state.bearing : 0;
  const deviceHeadingRotation = state.deviceHeading;
  
  const renderDebugInfo = () => {
    if (!debugMode || !state.debugInfo) return null;
    
    return (
      <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono mt-4">
        <div className="text-white mb-2 font-bold">🧭 Debug Info</div>
        <div>Raw Alpha: {state.debugInfo.rawAlpha.toFixed(1)}°</div>
        <div>Raw Absolute: {state.debugInfo.rawAbsolute ? 'Yes' : 'No'}</div>
        <div>Event Type: {state.debugInfo.eventType}</div>
        <div>Device Type: {state.debugInfo.deviceType}</div>
        <div>Device Heading: {state.deviceHeading}°</div>
        <div>Jerusalem Bearing: {state.bearing.toFixed(1)}°</div>
        <div>Arrow Rotation: {state.debugInfo.computedRotation.toFixed(1)}°</div>
        <div>Buffer Size: {state.debugInfo.filterBuffer.length}</div>
        <div>Event Rate: {state.debugInfo.eventRate.toFixed(1)} Hz</div>
        <div>Location: {state.location ? `${state.location.lat.toFixed(4)}, ${state.location.lng.toFixed(4)}` : 'None'}</div>
        <div>Aligned: {state.isAligned ? 'YES' : 'No'} (±10°)</div>
      </div>
    );
  };
  
  const renderCompass = () => {
    if (!state.isSupported) {
      return (
        <div className="text-center py-8">
          <CompassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Compass not supported on this device</p>
        </div>
      );
    }
    
    if (state.error) {
      return (
        <div className="text-center py-8">
          <div className="bg-red-50 rounded-2xl p-4 mb-4">
            <MapPin className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 text-sm">{state.error}</p>
          </div>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }
    
    if (!state.location) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-blush/20 border-t-blush rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Compass Display */}
        <div className="relative w-64 h-64 mx-auto">
          {/* Rotating compass background */}
          <div 
            className="w-full h-full rounded-full border-4 border-blush/20 bg-gradient-to-br from-white to-blush/5 shadow-lg relative select-none"
            style={{ 
              transform: `rotate(${-deviceHeadingRotation}deg)`,
              transition: state.hasPermission ? 'transform 0.3s ease-out' : 'none',
              willChange: 'transform',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            
            {/* Cardinal directions - rotate with compass */}
            <div className="absolute inset-4 rounded-full border border-blush/10">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-black">N</div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-black">E</div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-black">S</div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-black">W</div>
            </div>
            
            
            {/* Jerusalem direction marker - rotates with compass */}
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
                      transform: `rotate(${deviceHeadingRotation - jerusalemArrowRotation}deg)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Fixed center line - BEHIND everything */}
          <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
            {/* Line extending upward from center */}
            <div 
              className={`w-1.5 h-16 ${
                state.isAligned 
                  ? 'bg-blush' 
                  : 'bg-gray-400'
              }`}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
          
          {/* Fixed center heart - ON TOP of everything */}
          <div className="absolute top-1/2 left-1/2 z-40 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
            {/* Heart at the exact center */}
            <Heart 
              className="w-7 h-7 text-blush fill-blush"
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
        
        {/* Status and alignment message */}
        <div className="text-center space-y-2">
          {state.isAligned ? (
            <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
              <p className="text-green-800 font-medium">Your heart is in the right place</p>
              <p className="text-green-600 text-sm">Aligned with Jerusalem ✓</p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <p className="text-blue-800 font-medium">Turn to align with Jerusalem</p>
              <p className="text-blue-600 text-sm">Turn your body until the line points to the BH icon</p>
            </div>
          )}
          
          {/* Direction info */}
          <p className="text-gray-600 text-sm">
            Jerusalem bearing: {state.bearing.toFixed(0)}° • Device heading: {state.deviceHeading}°
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <style>{`
        @keyframes heartPulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          14% { transform: translate(-50%, -50%) scale(1.3); }
          28% { transform: translate(-50%, -50%) scale(1); }
          42% { transform: translate(-50%, -50%) scale(1.3); }
          70% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-black mb-2">The Kotel Compass</h2>
        <p className="text-sm text-gray-600">Beta. Currently in testing</p>
      </div>
      
      {/* Permission Request */}
      {!state.hasPermission && state.isSupported && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <p className="text-sm text-black mb-3">
            For accurate direction to Jerusalem, please enable compass access
          </p>
          <Button
            onClick={handleEnableCompass}
            className="w-full bg-gradient-to-r from-blush to-peach text-white py-2 rounded-xl font-medium"
          >
            Enable Compass
          </Button>
        </div>
      )}
      
      {/* Main compass display */}
      {renderCompass()}
      
      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <h4 className="font-bold text-sm text-black mb-2">How to Use:</h4>
        <ol className="text-xs text-black/70 space-y-1">
          <li>1. Allow location access for accurate direction</li>
          {!state.hasPermission && (
            <li>2. Enable compass access when prompted</li>
          )}
          <li>{!state.hasPermission ? '3' : '2'}. Hold device upright and turn your body</li>
          <li>{!state.hasPermission ? '4' : '3'}. Turn your body until the center line points to the BH icon</li>
          <li>{!state.hasPermission ? '5' : '4'}. When aligned, the heart and line will pulse</li>
        </ol>
        
        {/* Device-specific tips */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="font-medium text-xs text-black mb-1">Device-Specific Tips:</p>
          <ul className="text-xs text-black/60 space-y-1">
            {state.debugInfo?.deviceType === 'iOS' && (
              <>
                <li>• iPhone 15/16: Uses native compass - most accurate</li>
                <li>• iPhone 12-14: Good compass support with webkitCompassHeading</li>
                <li>• iPhone 6-11: May need figure-8 calibration if inaccurate</li>
                <li>• Keep away from MagSafe accessories during use</li>
              </>
            )}
            {state.debugInfo?.deviceType === 'Android' && (
              <>
                <li>• Uses deviceorientationabsolute for best accuracy</li>
                <li>• Calibrate by moving phone in figure-8 motion</li>
                <li>• Avoid magnetic cases or metal objects</li>
                <li>• Some Android devices may need manual calibration</li>
              </>
            )}
            {!state.debugInfo?.deviceType && (
              <>
                <li>• Keep device away from metal objects</li>
                <li>• Works best outdoors or near windows</li>
                <li>• Calibrate by moving in figure-8 motion if needed</li>
                <li>• Avoid magnetic interference (speakers, metal)</li>
              </>
            )}
          </ul>
        </div>
        
        {/* General tips */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="font-medium text-xs text-black mb-1">General Tips:</p>
          <ul className="text-xs text-black/60 space-y-1">
            <li>• Works best outdoors or near windows</li>
            <li>• Avoid magnetic interference (speakers, metal)</li>
            <li>• If inaccurate, try figure-8 calibration motion</li>
            <li>• Restart compass if readings seem wrong</li>
          </ul>
        </div>
        
        {isIOS && !isStandalone && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="font-medium text-xs text-black mb-1">📳 Vibration Note (iOS):</p>
            <p className="text-xs text-black/60">
              All iOS browsers restrict vibration. For the full heartbeat vibration experience, install this app to your home screen (tap Share → Add to Home Screen in Safari)
            </p>
          </div>
        )}
      </div>
      
      {/* Debug info */}
      {renderDebugInfo()}
      
      {/* Close button */}
      {onClose && (
        <Button onClick={onClose} variant="outline" className="w-full">
          Close Compass
        </Button>
      )}
    </div>
  );
}