import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface VersionInfo {
  timestamp: number;
  version: string;
  buildDate: string;
  buildNumber?: number;
  releaseNotes?: string;
  isCritical?: boolean;
  changesSummary?: string;
}

export function useVersionCheck() {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Get initial version on app load - ONLY on very first mount
  // Fetch once when component mounts, then never again
  const { data: initialVersion } = useQuery<VersionInfo>({
    queryKey: ['/api/version'],
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Fetch on first mount to get initial version
    staleTime: Infinity, // Don't refetch automatically
    retry: false, // Don't retry failed version checks
    enabled: !hasInitialized, // Only fetch if we haven't initialized yet
  });
  
  // Store initial version - runs whenever query succeeds
  useEffect(() => {
    if (initialVersion) {
      // Always mark as initialized when query succeeds
      setHasInitialized(true);
      
      // Update current version from server (even if localStorage had one)
      // This ensures we have the latest server version before polling starts
      setCurrentVersion(initialVersion);
      
      // Store in localStorage for persistence across sessions
      localStorage.setItem('app-version', JSON.stringify(initialVersion));
      
      // Only clear update prompt if we don't have a pending update
      // This prevents the initial fetch from wiping out an update detected by polling
      // If updateInfo exists, it means polling detected a newer version - preserve the prompt
      if (!updateInfo) {
        setShowUpdatePrompt(false);
      }
    }
  }, [initialVersion, updateInfo]);
  
  // Load version from localStorage on mount
  useEffect(() => {
    const storedVersion = localStorage.getItem('app-version');
    if (storedVersion && !currentVersion) {
      try {
        const parsedVersion = JSON.parse(storedVersion);
        // Only use stored version if it's recent (within 24 hours)
        const oneDay = 24 * 60 * 60 * 1000;
        const isRecent = Date.now() - parsedVersion.timestamp < oneDay;
        
        if (isRecent) {
          setCurrentVersion(parsedVersion);
          // Don't set hasInitialized here - let the query run to check for updates
        } else {
          // Clear old version data
          localStorage.removeItem('app-version');
          localStorage.removeItem('latest-app-version');
        }
      } catch (error) {
        // Clear corrupted version data
        localStorage.removeItem('app-version');
        localStorage.removeItem('latest-app-version');
      }
    }
  }, [currentVersion]);
  
  // Aggressive version checking - on app start AND window focus (no throttling)
  // Checks for updates immediately on app load, then EVERY time user returns to app
  // Shows update prompt when there's a real update available
  // Never auto-reloads - always requires user click
  const hasCheckedOnStartRef = useRef<boolean>(false);
  
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!currentVersion) return;
      
      // No throttling - check every time for immediate update detection
      // The endpoint is cheap and already fully cache-busted
      hasCheckedOnStartRef.current = true;
      const now = Date.now();
      
      try {
        const response = await fetch(`/api/version?t=${now}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (!response.ok) return;
        
        // Validate response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.debug('Version check skipped: Invalid content type', contentType);
          return;
        }
        
        const latestVersion: VersionInfo = await response.json();
        
        // Validate response structure
        if (!latestVersion || typeof latestVersion.timestamp !== 'number') {
          console.debug('Version check skipped: Invalid response structure');
          return;
        }
        
        // Detect any new version by timestamp increase
        // Accept ANY timestamp difference to catch quick hotfixes and critical updates
        if (latestVersion.timestamp > currentVersion.timestamp) {
          console.log('📦 Update available:', latestVersion.version);
          setUpdateInfo(latestVersion);
          setShowUpdatePrompt(true);
          localStorage.setItem('latest-app-version', JSON.stringify(latestVersion));
        }
      } catch (error) {
        // Silently handle version check failures - don't interrupt user
        console.debug('Version check skipped:', error);
      }
    };
    
    // Check immediately on app start (when currentVersion is first set)
    if (!hasCheckedOnStartRef.current) {
      checkForUpdates();
    }
    
    // Also check on window focus (when user returns to app)
    const handleFocus = () => {
      checkForUpdates();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentVersion]);
  
  const refreshApp = async () => {
    console.log('🔄 User requested app refresh...');
    
    // Update current version in localStorage before refresh
    const latestVersionFromStorage = localStorage.getItem('latest-app-version');
    if (latestVersionFromStorage) {
      localStorage.setItem('app-version', latestVersionFromStorage);
      localStorage.removeItem('latest-app-version');
    }
    
    // Dismiss the update prompt immediately
    setShowUpdatePrompt(false);
    
    try {
      // Wait for service worker to be ready before updating
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        
        // Force service worker to skip waiting and take control immediately
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Wait for new service worker to take control (1s to ensure activation on slow devices)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Only clear this app's caches (those matching our naming pattern)
        // This preserves other apps' caches and avoids offline state
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const appCacheNames = cacheNames.filter(name => 
            name.startsWith('app-shell-') || 
            name.startsWith('prayers-') || 
            name.startsWith('torah-') || 
            name.startsWith('api-') || 
            name.startsWith('static-')
          );
          await Promise.all(appCacheNames.map(name => caches.delete(name)));
          console.log('✨ Cleared app caches for fresh update');
        }
      }
      
    } catch (error) {
      console.debug('[Update] Cache clear failed, continuing with reload:', error);
    }
    
    // Hard reload to bypass any remaining cache
    console.log('✨ Reloading to apply update...');
    window.location.reload();
  };
  
  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Add manual test function for development
  const testUpdateNotification = () => {
    if (import.meta.env.MODE === 'development') {
      console.log('🧪 Testing update notification...');
      setShowUpdatePrompt(true);
    }
  };
  
  return {
    showUpdatePrompt,
    refreshApp,
    dismissUpdate,
    currentVersion,
    updateInfo,
    testUpdateNotification: import.meta.env.MODE === 'development' ? testUpdateNotification : undefined
  };
}