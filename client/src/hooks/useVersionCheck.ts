import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface VersionInfo {
  timestamp: number;
  version: string;
  buildDate: string;
}

export function useVersionCheck() {
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get initial version on app load
  const { data: initialVersion } = useQuery<VersionInfo>({
    queryKey: ['/api/version'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity, // Don't refetch automatically
  });
  
  // Store initial version
  useEffect(() => {
    if (initialVersion && !currentVersion) {
      setCurrentVersion(initialVersion);
      // Store in localStorage for persistence across sessions
      localStorage.setItem('app-version', JSON.stringify(initialVersion));
    }
  }, [initialVersion, currentVersion]);
  
  // Load version from localStorage on mount
  useEffect(() => {
    const storedVersion = localStorage.getItem('app-version');
    if (storedVersion && !currentVersion) {
      try {
        setCurrentVersion(JSON.parse(storedVersion));
      } catch (error) {
        // Clear corrupted version data
        localStorage.removeItem('app-version');
      }
    }
  }, [currentVersion]);
  
  // Periodic version checking (every 5 minutes)
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!currentVersion) return;
      
      try {
        const response = await fetch('/api/version');
        const latestVersion: VersionInfo = await response.json();
        
        // Compare timestamps to detect updates
        if (latestVersion.timestamp > currentVersion.timestamp) {
          setShowUpdatePrompt(true);
        }
      } catch (error) {
        // Silently fail update checks to avoid console noise
      }
    };
    
    // Start checking after 1 minute, then every 5 minutes
    const startDelay = setTimeout(() => {
      checkForUpdates();
      intervalRef.current = setInterval(checkForUpdates, 5 * 60 * 1000); // 5 minutes
    }, 60 * 1000); // 1 minute delay
    
    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentVersion]);
  
  const refreshApp = () => {
    // Update service workers and clear browser caches, but preserve user data
    const performRefresh = async () => {
      // Update service worker registrations
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.update())
          );
        } catch (error) {
          // Service worker update failed, continue with page refresh
        }
      }
      
      // Clear browser caches (but NOT localStorage)
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          // Cache clearing failed, continue with page refresh
        }
      }
      
      // Note: We explicitly do NOT clear localStorage to preserve:
      // - modalCompletions (daily modal completion tracking)
      // - dailyCompletion (daily task progress)
      // - share-button-clicked (user preferences)  
      // - message-read-* (daily message read status)
      // - lastDonationEmail (donation form data)
      // - ezras-nashim-compass-location* (location cache)
      // - app-version (version tracking)
      
      // Force page reload to get fresh content
      window.location.reload();
    };
    
    performRefresh();
  };
  
  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };
  
  return {
    showUpdatePrompt,
    refreshApp,
    dismissUpdate,
    currentVersion
  };
}