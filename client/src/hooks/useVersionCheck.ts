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
    retry: false, // Don't retry failed version checks
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
  
  // Periodic version checking (every 1 hour)
  useEffect(() => {
    const checkForUpdates = async () => {
      if (!currentVersion) return;
      
      try {
        console.log('🔍 Checking for app updates...');
        // Use the same API base URL as the rest of the app
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const apiUrl = `${baseUrl}/api/version?t=${Date.now()}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const latestVersion: VersionInfo = await response.json();
        
        console.log('📊 Version comparison:', {
          current: { 
            timestamp: currentVersion.timestamp, 
            date: new Date(currentVersion.timestamp).toISOString() 
          },
          latest: { 
            timestamp: latestVersion.timestamp, 
            date: new Date(latestVersion.timestamp).toISOString() 
          },
          isNewer: latestVersion.timestamp > currentVersion.timestamp
        });
        
        // Compare timestamps to detect updates
        if (latestVersion.timestamp > currentVersion.timestamp) {
          console.log('🚀 New version detected! Showing update prompt.');
          setShowUpdatePrompt(true);
          
          // Update stored version for future comparisons
          localStorage.setItem('app-version', JSON.stringify(latestVersion));
        } else {
          console.log('✅ App is up to date.');
        }
      } catch (error) {
        // Silently handle version check failures to avoid console noise
        if (import.meta.env.MODE === 'development') {
          console.warn('⚠️ Version check failed:', error);
        }
      }
    };
    
    // Start checking after 2 minutes, then every 1 hour
    const startDelay = setTimeout(() => {
      checkForUpdates();
      intervalRef.current = setInterval(checkForUpdates, 60 * 60 * 1000); // 1 hour
    }, 2 * 60 * 1000); // 2 minute delay
    
    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentVersion]);
  
  const refreshApp = () => {
    console.log('🔄 Performing app refresh with progress preservation...');
    
    // Dismiss the update prompt immediately
    setShowUpdatePrompt(false);
    
    // Update service workers and clear browser caches, but preserve user data
    const performRefresh = async () => {
      try {
        // Update service worker registrations
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log('🔧 Updating service workers...', registrations.length);
            await Promise.all(
              registrations.map(registration => registration.update())
            );
          } catch (error) {
            console.warn('⚠️ Service worker update failed:', error);
          }
        }
        
        // Clear browser caches (but NOT localStorage)
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            console.log('🗑️ Clearing browser caches...', cacheNames);
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          } catch (error) {
            console.warn('⚠️ Cache clearing failed:', error);
          }
        }
        
        // Show loading state briefly
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; color: white; font-family: system-ui;">
            <div style="text-align: center;">
              <div style="width: 40px; height: 40px; border: 4px solid #fff3; border-top: 4px solid #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <div>Updating to latest version...</div>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Note: We explicitly do NOT clear localStorage to preserve:
        // - modalCompletions (daily modal completion tracking)
        // - dailyCompletion (daily task progress)
        // - tzedaka_button_completions (tzedaka progress)
        // - share-button-clicked (user preferences)  
        // - message-read-* (daily message read status)
        // - lastDonationEmail (donation form data)
        // - ezras-nashim-compass-location* (location cache)
        // - app-version (version tracking)
        
        console.log('✨ Performing hard refresh to load latest version...');
        
        // Small delay to show loading state
        setTimeout(() => {
          // Force hard page reload to get fresh content (bypasses cache)
          window.location.reload(); // Hard refresh
        }, 800);
        
      } catch (error) {
        console.error('❌ Refresh failed:', error);
        // Fallback to simple reload
        window.location.reload();
      }
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