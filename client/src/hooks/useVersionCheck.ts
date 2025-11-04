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
  
  // Smart version checking on window focus with throttling
  // Checks for updates when user returns to app, but only once every 5 minutes
  // Shows update prompt only when there's a real update available
  // Never auto-reloads - always requires user click
  const lastCheckRef = useRef<number>(0);
  
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!currentVersion) return;
      
      // Throttle checks to once every 5 minutes
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      if (now - lastCheckRef.current < fiveMinutes) {
        return;
      }
      
      lastCheckRef.current = now;
      
      try {
        const response = await fetch(`/api/version?t=${now}`);
        if (!response.ok) return;
        
        const latestVersion: VersionInfo = await response.json();
        
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
    
    // Check on window focus (when user returns to app)
    const handleFocus = () => {
      checkForUpdates();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentVersion]);
  
  const refreshApp = () => {
    console.log('🔄 User requested app refresh...');
    
    // Update current version in localStorage before refresh
    const latestVersionFromStorage = localStorage.getItem('latest-app-version');
    if (latestVersionFromStorage) {
      localStorage.setItem('app-version', latestVersionFromStorage);
      localStorage.removeItem('latest-app-version');
    }
    
    // Dismiss the update prompt immediately
    setShowUpdatePrompt(false);
    
    // Simple, non-disruptive reload
    // Let the browser handle caching naturally
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