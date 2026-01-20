import { useEffect, useRef, useCallback } from 'react';

/**
 * Unified back button history management for Android WebView
 * 
 * This hook allows any component with local modal/overlay state to 
 * participate in browser history, enabling Android back button to 
 * close them instead of navigating away or exiting the app.
 * 
 * Usage:
 *   const { isOpen, open, close } = useBackButtonHistory({
 *     id: 'search-modal',
 *     onClose: () => setShowSearchModal(false)
 *   });
 * 
 * Or for controlled components:
 *   useBackButtonHistory({
 *     id: 'mini-compass',
 *     isOpen: compassOpen,
 *     onClose: () => setCompassOpen(false)
 *   });
 */

interface BackButtonHistoryOptions {
  /** Unique identifier for this modal/overlay */
  id: string;
  /** Callback when back button should close this modal */
  onClose: () => void;
  /** For controlled components - the current open state */
  isOpen?: boolean;
}

// Global registry to track all active back-button-aware modals
const activeModals = new Map<string, { close: () => void }>();

// Track the history state we've pushed
let historyDepth = 0;

// Flag to prevent loops during programmatic navigation
let isNavigating = false;

// Single global popstate listener
let popstateListenerAdded = false;

function handleGlobalPopstate() {
  if (isNavigating) return;
  
  // Find the most recently opened modal and close it
  const modalIds = Array.from(activeModals.keys());
  if (modalIds.length > 0) {
    const lastModal = modalIds[modalIds.length - 1];
    const modal = activeModals.get(lastModal);
    if (modal) {
      isNavigating = true;
      modal.close();
      activeModals.delete(lastModal);
      historyDepth = Math.max(0, historyDepth - 1);
      setTimeout(() => {
        isNavigating = false;
      }, 50);
    }
  }
}

function ensurePopstateListener() {
  if (!popstateListenerAdded && typeof window !== 'undefined') {
    window.addEventListener('popstate', handleGlobalPopstate);
    popstateListenerAdded = true;
  }
}

/**
 * Hook for components with their own isOpen state
 * Registers for back button handling when open
 */
export function useBackButtonHistory({ id, onClose, isOpen }: BackButtonHistoryOptions) {
  const wasOpenRef = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  
  useEffect(() => {
    ensurePopstateListener();
  }, []);
  
  useEffect(() => {
    if (isOpen === undefined) return;
    
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    
    // Modal just opened
    if (isOpen && !wasOpen) {
      if (!isNavigating) {
        // Push history entry
        window.history.pushState({ modal: id, depth: historyDepth + 1 }, '');
        historyDepth++;
        activeModals.set(id, { close: closeRef.current });
      }
    }
    
    // Modal just closed (not via back button)
    if (!isOpen && wasOpen) {
      if (activeModals.has(id)) {
        activeModals.delete(id);
        
        // Go back to remove our history entry
        if (!isNavigating && historyDepth > 0) {
          isNavigating = true;
          historyDepth--;
          window.history.back();
          setTimeout(() => {
            isNavigating = false;
          }, 50);
        }
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (activeModals.has(id)) {
        activeModals.delete(id);
      }
    };
  }, [id, isOpen]);
}

/**
 * Hook that provides controlled open/close functions
 * for components that want simpler integration
 */
export function useBackButtonModal(id: string) {
  const closeCallbackRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    ensurePopstateListener();
  }, []);
  
  const open = useCallback((onClose: () => void) => {
    if (!isNavigating) {
      closeCallbackRef.current = onClose;
      window.history.pushState({ modal: id, depth: historyDepth + 1 }, '');
      historyDepth++;
      activeModals.set(id, { close: onClose });
    }
  }, [id]);
  
  const close = useCallback(() => {
    if (activeModals.has(id)) {
      activeModals.delete(id);
      closeCallbackRef.current?.();
      
      if (!isNavigating && historyDepth > 0) {
        isNavigating = true;
        historyDepth--;
        window.history.back();
        setTimeout(() => {
          isNavigating = false;
        }, 50);
      }
    }
  }, [id]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeModals.has(id)) {
        activeModals.delete(id);
      }
    };
  }, [id]);
  
  return { open, close };
}

/**
 * Ensure there's always a base history entry to prevent 
 * immediate app exit on first back button press.
 * 
 * Call this once at app startup.
 */
export function ensureBaseHistoryEntry() {
  if (typeof window === 'undefined') return;
  
  // If we're at the very start with no state, push a base entry
  // so back button has somewhere to go before exiting
  if (!window.history.state || !window.history.state.base) {
    // First, mark current state as having our base marker
    window.history.replaceState({ base: true, app: 'ezras-nashim' }, '');
    
    // Then push an additional entry so we have room to navigate back
    window.history.pushState({ base: true, buffer: true, app: 'ezras-nashim' }, '');
  }
}

/**
 * Get the number of currently active modals in history
 */
export function getActiveModalCount(): number {
  return activeModals.size;
}
