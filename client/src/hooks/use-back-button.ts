import { useEffect } from 'react';

/**
 * Hook to handle Android back button navigation
 * Ensures back button works properly by managing history state
 */
export function useBackButton() {
  useEffect(() => {
    // Ensure there's always a history entry when app loads
    // This prevents immediate exit on first back press
    if (window.history.length === 1) {
      window.history.pushState(null, '', window.location.href);
    }
  }, []);
}
