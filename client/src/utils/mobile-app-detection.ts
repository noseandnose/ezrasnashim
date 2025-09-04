// Utility to detect if the app is running in a mobile app wrapper
export const isMobileApp = (): boolean => {
  const userAgent = navigator.userAgent;
  
  // Check for common mobile app wrapper indicators
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const hasNavigatorStandalone = (navigator as any).standalone === true;
  
  // Check for common WebView user agents
  const isWebView = /wv|WebView/i.test(userAgent) ||
                   /Instagram|FBAN|FBAV/i.test(userAgent) ||
                   userAgent.includes('Version/') && userAgent.includes('Mobile/');
  
  return isStandalone || hasNavigatorStandalone || isWebView;
};

// Check if specific permissions are available
export const checkPermissionSupport = () => {
  return {
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    permissions: 'permissions' in navigator
  };
};

// Get helpful permission guidance for mobile users
export const getPermissionGuidance = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) {
    return {
      location: "Go to Settings > Privacy & Security > Location Services, then enable for this app",
      notifications: "Go to Settings > Notifications, then enable for this app", 
      compass: "Location Services also enables compass functionality"
    };
  } else if (isAndroid) {
    return {
      location: "Go to Settings > Apps > [App Name] > Permissions and enable Location",
      notifications: "Go to Settings > Apps > [App Name] > Permissions and enable Notifications",
      compass: "Location permission also enables compass functionality"
    };
  } else {
    return {
      location: "Enable location permissions in your device settings",
      notifications: "Enable notification permissions in your device settings",
      compass: "Enable location permissions for compass functionality"
    };
  }
};