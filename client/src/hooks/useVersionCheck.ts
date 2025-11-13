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
  
  // Get initial version on app load - ONLY on very first mount
  // Never refetch during session to prevent reload-on-resume behavior
  const { data: initialVersion } = useQuery<VersionInfo>({
    queryKey: ['/api/version'],
    refetchOnWindowFocus: false,
    refetchOnMount: false, // NEVER refetch - prevents version check when app resumes
    staleTime: Infinity, // Don't refetch automatically
    retry: false, // Don't retry failed version checks
    enabled: !currentVersion, // Only fetch if we don't have a version yet
  });
  
  // Store initial version
  useEffect(() => {
    if (initialVersion && !currentVersion) {
      setCurrentVersion(initialVersion);
      // Store in localStorage for persistence across sessions
      localStorage.setItem('app-version', JSON.stringify(initialVersion));
      
      // Clear any stale update prompts since we have fresh version info
      setShowUpdatePrompt(false);
    }
  }, [initialVersion, currentVersion]);
  
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
  
  // Aggressive version checking - on app start AND window focus with throttling
  // Checks for updates immediately on app load, then when user returns to app
  // Shows update prompt when there's a real update available
  // Never auto-reloads - always requires user click
  const lastCheckRef = useRef<number>(0);
  const hasCheckedOnStartRef = useRef<boolean>(false);
  
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!currentVersion) return;
      
      // Allow first check immediately on app start (no throttling)
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      const isFirstCheck = !hasCheckedOnStartRef.current;
      
      if (!isFirstCheck && now - lastCheckRef.current < fiveMinutes) {
        return;
      }
      
      hasCheckedOnStartRef.current = true;
      lastCheckRef.current = now;
      
      try {
        const response = await fetch(`/api/version?t=${now}`);
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
      // Force service worker to skip waiting and take control immediately
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Clear all caches to ensure fresh content loads
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✨ Cleared all caches for fresh update');
      }
      
      // Wait a moment for service worker to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
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