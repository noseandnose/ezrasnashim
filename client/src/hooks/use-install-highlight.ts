import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage PWA install highlight state
 * Tracks whether to show pink pulse borders on menu and install button
 * to guide users toward installing the app
 */

type InstallHighlightStatus = 'pending' | 'dismissed' | 'installed';

const STORAGE_KEY = 'pwa-install-highlight';

type InstallPromptResult = 'accepted' | 'dismissed' | 'unavailable';

interface UseInstallHighlightReturn {
  shouldHighlight: boolean;
  markDismissed: () => void;
  markInstalled: () => void;
  triggerInstallPrompt: () => Promise<InstallPromptResult>;
  isStandalone: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isWebview: boolean;
}

export function useInstallHighlight(): UseInstallHighlightReturn {
  const [status, setStatus] = useState<InstallHighlightStatus>('pending');
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isWebview, setIsWebview] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  // Initialize state from localStorage and detect environment
  useEffect(() => {
    // Detect if running inside a mobile app webview (FlutterFlow or other app wrappers)
    const userAgent = navigator.userAgent.toLowerCase();
    const isInWebview = 
      // FlutterFlow webview
      document.referrer.includes('android-app://') ||
      // Other common webview indicators
      userAgent.includes('wv') ||
      userAgent.includes('webview') ||
      // Check if running in an app wrapper (not Safari/Chrome)
      ((/iphone|ipod|ipad/.test(userAgent) && !userAgent.includes('safari')) ||
       (/android/.test(userAgent) && !userAgent.includes('chrome')));
    setIsWebview(isInWebview);
    
    // Check if app is in standalone mode (already installed as PWA)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Load saved status from localStorage
    const savedStatus = localStorage.getItem(STORAGE_KEY) as InstallHighlightStatus | null;
    
    // If app is in standalone mode, mark as installed
    if (isStandaloneMode) {
      setStatus('installed');
      localStorage.setItem(STORAGE_KEY, 'installed');
    } else if (savedStatus) {
      setStatus(savedStatus);
    } else {
      // First visit - set to pending
      setStatus('pending');
      localStorage.setItem(STORAGE_KEY, 'pending');
    }

    // Listen for media query changes (if user switches to standalone mode)
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setStatus('installed');
        localStorage.setItem(STORAGE_KEY, 'installed');
      }
    };

    standaloneMediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      standaloneMediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Listen for beforeinstallprompt event (Android/Chrome)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for appinstalled event
  useEffect(() => {
    const handleAppInstalled = () => {
      setStatus('installed');
      localStorage.setItem(STORAGE_KEY, 'installed');
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const markDismissed = () => {
    setStatus('dismissed');
    localStorage.setItem(STORAGE_KEY, 'dismissed');
  };

  const markInstalled = () => {
    setStatus('installed');
    localStorage.setItem(STORAGE_KEY, 'installed');
  };

  const triggerInstallPrompt = async (): Promise<InstallPromptResult> => {
    // If app is already installed, do nothing
    if (isStandalone) {
      return 'unavailable';
    }

    // Try native install prompt (Android/Chrome)
    if (deferredPromptRef.current) {
      const promptEvent = deferredPromptRef.current;
      
      // Clear the reference immediately - the event can only be used once
      // Future attempts will return 'unavailable' and show manual instructions
      deferredPromptRef.current = null;
      setCanInstall(false);
      
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        
        if (outcome === 'accepted') {
          markInstalled();
          return 'accepted';
        } else {
          // User dismissed the native prompt
          markDismissed();
          return 'dismissed';
        }
      } catch (error) {
        // If prompt() throws (already used, etc.), fall through to unavailable
        console.warn('Install prompt failed:', error);
      }
    }
    
    // For iOS or browsers without beforeinstallprompt, 
    // return unavailable so the calling component can show manual instructions
    return 'unavailable';
  };

  // Determine if we should show the highlight
  const shouldHighlight = status === 'pending' && !isStandalone;

  return {
    shouldHighlight,
    markDismissed,
    markInstalled,
    triggerInstallPrompt,
    isStandalone,
    canInstall,
    isIOS,
    isWebview,
  };
}
