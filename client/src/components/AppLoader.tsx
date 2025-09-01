import { useState, useEffect, useCallback } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import SplashScreen from './SplashScreen';
import UpdateNotification from './UpdateNotification';
import { AutoNotificationPrompt } from './auto-notification-prompt';
import ErrorBoundary from "@/components/ui/error-boundary";
import Router from '@/components/Router';

// Critical resources to preload for faster initial render
const preloadCriticalResources = () => {
  // Get current date string once
  const today = new Date().toISOString().split('T')[0];
  
  // Only preload truly essential endpoints that block rendering
  const criticalAPIs = [
    '/api/version'
  ];
  
  // Preload other APIs in background without blocking
  const backgroundAPIs = [
    `/api/sponsors/daily/${today}`,
    `/api/zmanim/31.7/34.98`, // Approximate Israel coordinates for faster initial load
  ];
  
  // Immediate preload of critical resources
  criticalAPIs.forEach(endpoint => {
    fetch(endpoint).catch(() => {}); // Silent preload
  });
  
  // Background preload with delay to not block initial render
  setTimeout(() => {
    backgroundAPIs.forEach(endpoint => {
      fetch(endpoint).catch(() => {}); // Silent background preload
    });
  }, 100);
};

export default function AppLoader() {
  const [showSplash, setShowSplash] = useState(true);

  // Preload critical resources immediately
  useEffect(() => {
    preloadCriticalResources();
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Splash screen shown initially */}
          <SplashScreen 
            isVisible={showSplash} 
            onComplete={handleSplashComplete}
          />
          
          {/* Main app - shown after splash completes */}
          {!showSplash && (
            <div className="opacity-100">
              <UpdateNotification />
              <AutoNotificationPrompt />
              <Router />
              <Toaster />
            </div>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}