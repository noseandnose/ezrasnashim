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
  
  // Get initial version on app load
  const { data: initialVersion } = useQuery<VersionInfo>({
    queryKey: ['/api/version'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity, // Don't refetch automatically
    retry: false, // Don't retry failed version checks
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
  
  // Periodic version checking - DISABLED to prevent interrupting users
  // Version updates will happen naturally when user closes/reopens the app
  useEffect(() => {
    // Only check for critical updates in production, and very infrequently
    // Never interrupt the user's current session
    const checkForUpdates = async () => {
      if (!currentVersion) return;
      
      try {
        // Use the same API base URL as the rest of the app
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const apiUrl = `${baseUrl}/api/version?t=${Date.now()}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const latestVersion: VersionInfo = await response.json();
        
        // Compare timestamps to detect updates
        const timeDifference = latestVersion.timestamp - currentVersion.timestamp;
        const minimumUpdateThreshold = 5 * 60 * 1000; // 5 minutes
        
        if (timeDifference > minimumUpdateThreshold) {
          // Only show prompt for CRITICAL updates, otherwise just store silently
          if (latestVersion.isCritical) {
            console.log('⚠️ Critical update available');
            setUpdateInfo(latestVersion);
            setShowUpdatePrompt(true);
          } else {
            // Silently store update info, user will get it on next app launch
            console.log('ℹ️ Update available (will apply on next app launch)');
          }
          localStorage.setItem('latest-app-version', JSON.stringify(latestVersion));
        }
      } catch (error) {
        // Silently handle version check failures
        if (import.meta.env.MODE === 'development') {
          console.warn('⚠️ Version check failed:', error);
        }
      }
    };
    
    // Only check once per session, after 24 hours
    // This prevents interrupting users mid-session
    const checkOnce = setTimeout(() => {
      checkForUpdates();
    }, 24 * 60 * 60 * 1000); // Check after 24 hours
    
    return () => {
      clearTimeout(checkOnce);
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