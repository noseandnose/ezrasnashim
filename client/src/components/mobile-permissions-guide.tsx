import { useState, useEffect } from 'react';
import { X, Settings, MapPin, Bell, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isMobileApp, checkPermissionSupport, getPermissionGuidance } from '@/utils/mobile-app-detection';

interface MobilePermissionsGuideProps {
  isOpen: boolean;
  onClose: () => void;
  permissionType: 'location' | 'notifications' | 'compass';
}

export function MobilePermissionsGuide({ isOpen, onClose, permissionType }: MobilePermissionsGuideProps) {
  const [showGuide, setShowGuide] = useState(false);
  
  useEffect(() => {
    // Only show guide if we're in a mobile app and permissions aren't working
    if (isOpen && isMobileApp()) {
      const support = checkPermissionSupport();
      
      // Show guide if the feature isn't working properly
      if (permissionType === 'location' && !support.geolocation) {
        setShowGuide(true);
      } else if (permissionType === 'notifications' && !support.notifications) {
        setShowGuide(true);
      } else if (permissionType === 'compass' && !support.deviceOrientation) {
        setShowGuide(true);
      } else {
        setShowGuide(false);
      }
    } else {
      setShowGuide(false);
    }
  }, [isOpen, permissionType]);

  if (!showGuide) return null;

  const guidance = getPermissionGuidance();
  const icons = {
    location: MapPin,
    notifications: Bell,
    compass: Compass
  };
  
  const Icon = icons[permissionType];
  
  const titles = {
    location: 'Location Permission Needed',
    notifications: 'Notification Permission Needed', 
    compass: 'Compass Permission Needed'
  };

  const descriptions = {
    location: 'To show accurate prayer times for your location, please enable location permissions.',
    notifications: 'To receive prayer time reminders, please enable notification permissions.',
    compass: 'To use the Kotel compass for prayer direction, please enable location permissions.'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blush/10 rounded-lg">
              <Icon className="w-6 h-6 text-blush" />
            </div>
            <h2 className="text-lg platypi-bold text-black">{titles[permissionType]}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700 platypi-regular">
            {descriptions[permissionType]}
          </p>
          
          <div className="bg-gradient-to-r from-lavender-50 to-rose-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blush mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="platypi-medium text-black mb-2">How to Enable:</h3>
                <p className="text-sm text-gray-700 platypi-regular">
                  {guidance[permissionType]}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 platypi-regular">
            <p>After enabling permissions, please restart the app for changes to take effect.</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-feminine text-white platypi-medium rounded-xl py-3 hover:scale-105 transition-transform"
          >
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}