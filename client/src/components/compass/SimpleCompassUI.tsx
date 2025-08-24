/**
 * Simplified Compass UI Component
 * Single transform, minimal logic, clean design
 */

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { SimpleCompass, CompassState, calculateCompassRotation, getDeviceInfo } from '@/lib/compass';
import { MapPin, Compass as CompassIcon } from 'lucide-react';

// Import compass icons
import bhPinkIcon from '@assets/BH_Pink_1755681221620.png';
import bhGreenIcon from '@assets/BH_Green_1755681221619.png';

interface SimpleCompassUIProps {
  onClose?: () => void;
}

export function SimpleCompassUI({ onClose }: SimpleCompassUIProps) {
  const [compass] = useState(() => new SimpleCompass());
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
  
  useEffect(() => {
    const unsubscribe = compass.subscribe(setState);
    return () => {
      unsubscribe();
      compass.dispose();
    };
  }, [compass]);
  
  const deviceInfo = getDeviceInfo();
  
  const handleEnableCompass = async () => {
    await compass.requestPermission();
  };
  
  // Calculate the single rotation needed for the arrow
  const arrowRotation = state.location 
    ? calculateCompassRotation(state.bearing, state.deviceHeading)
    : 0;
  
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
          <Button onClick={() => window.location.reload()} variant="outline">
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
          {/* Static compass background */}
          <div className="w-full h-full rounded-full border-4 border-blush/20 bg-gradient-to-br from-white to-blush/5 shadow-lg relative">
            
            {/* Cardinal directions - static */}
            <div className="absolute inset-4 rounded-full border border-blush/10">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-black">N</div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-black">E</div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-black">S</div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-black">W</div>
            </div>
            
            {/* Single rotating arrow pointing to Jerusalem */}
            <div 
              className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
              style={{ 
                transform: `translate(-50%, -50%) rotate(${arrowRotation}deg)`,
                transition: state.hasPermission ? 'transform 0.3s ease-out' : 'none',
                willChange: 'transform'
              }}
            >
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-white flex items-center justify-center">
                  <img 
                    src={state.isAligned ? bhGreenIcon : bhPinkIcon}
                    alt="Jerusalem direction"
                    className={`w-8 h-8 ${state.isAligned ? 'animate-pulse' : ''}`}
                  />
                </div>
              </div>
            </div>
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blush rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
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
              <p className="text-blue-600 text-sm">Follow the pink marker</p>
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
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-black mb-2">The Kotel Compass</h2>
        <p className="text-sm text-gray-600">Simple. Accurate. Reliable.</p>
      </div>
      
      {/* iOS Permission Request */}
      {deviceInfo.needsPermission && !state.hasPermission && state.isSupported && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <p className="text-sm text-black mb-3">
            Enable compass access to show direction to Jerusalem
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
          <li>1. Allow location access when prompted</li>
          {deviceInfo.needsPermission && !state.hasPermission && (
            <li>2. Tap "Enable Compass" button above</li>
          )}
          <li>{deviceInfo.needsPermission && !state.hasPermission ? '3' : '2'}. Hold device upright and turn your body</li>
          <li>{deviceInfo.needsPermission && !state.hasPermission ? '4' : '3'}. The arrow points to Jerusalem from your location</li>
          <li>{deviceInfo.needsPermission && !state.hasPermission ? '5' : '4'}. When aligned, the marker turns green</li>
        </ol>
        
        {/* Device-specific tips */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="font-medium text-xs text-black mb-1">Tips:</p>
          <ul className="text-xs text-black/60 space-y-1">
            {deviceInfo.isAndroid ? (
              <>
                <li>• Hold phone flat like a traditional compass</li>
                <li>• Calibrate by moving in figure-8 motion if needed</li>
                <li>• Avoid magnetic interference (speakers, metal)</li>
              </>
            ) : (
              <>
                <li>• Keep device away from metal objects</li>
                <li>• Works best outdoors or near windows</li>
                <li>• Accuracy improves with device calibration</li>
              </>
            )}
          </ul>
        </div>
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