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
        console.error('Error parsing stored version:', error);
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
          console.log('New version detected:', latestVersion);
          setShowUpdatePrompt(true);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
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
    // Clear service worker cache and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }
    
    // Clear app cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Force reload
    window.location.reload();
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