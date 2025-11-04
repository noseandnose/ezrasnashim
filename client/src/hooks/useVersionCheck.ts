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
  
  // Periodic version checking - COMPLETELY DISABLED
  // Version checks were causing app freezes and unwanted reloads when resuming from background
  // Updates will happen naturally via service worker on next full app launch
  // No version checks during active sessions
  
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