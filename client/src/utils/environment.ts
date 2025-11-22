// Utility to detect web view and other environment specifics

/**
 * Detects if the app is running inside a web view (Flutter, React Native, etc.)
 * Web views often have limited JavaScript event loop behavior when backgrounded.
 */
export function isWebView(): boolean {
  // Check if we're in a browser environment at all
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common web view indicators in user agent
  const webViewIndicators = [
    'wv',           // Android WebView
    'flutter',      // Flutter web view
    'dart',         // Dart runtime
    'flutterflow',  // FlutterFlow
    'react-native', // React Native WebView
    'webview'       // Generic WebView
  ];
  
  const hasWebViewUA = webViewIndicators.some(indicator => 
    userAgent.includes(indicator)
  );
  
  // Flutter-specific detection
  const hasFlutterAPI = !!(window as any).flutter_inappwebview;
  
  // Visual viewport is often missing in web views
  const missingVisualViewport = !window.visualViewport;
  
  // Standalone mode check (PWA vs web view)
  // In web views, navigator.standalone might be false with no visual viewport
  const standaloneCheck = 'standalone' in navigator && 
    navigator.standalone === false && 
    missingVisualViewport;
  
  // If any strong indicator is present, we're likely in a web view
  return hasWebViewUA || hasFlutterAPI || standaloneCheck || 
    // Fallback: missing visual viewport in a mobile environment
    (missingVisualViewport && /mobile|android|iphone/i.test(userAgent));
}

/**
 * Hook to use web view detection in React components
 */
export function useIsWebView(): boolean {
  return isWebView();
}

/**
 * Detects if the app is running as an installed PWA
 */
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check display mode
  const displayMode = window.matchMedia('(display-mode: standalone)').matches ||
                     window.matchMedia('(display-mode: fullscreen)').matches ||
                     window.matchMedia('(display-mode: minimal-ui)').matches;
  
  // iOS-specific PWA detection
  const iosStandalone = 'standalone' in navigator && navigator.standalone === true;
  
  return displayMode || iosStandalone;
}

/**
 * Get environment type for debugging
 */
export function getEnvironmentType(): string {
  if (isWebView()) return 'webview';
  if (isInstalledPWA()) return 'pwa';
  return 'browser';
}