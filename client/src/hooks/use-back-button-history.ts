import { useEffect, useRef, useCallback } from 'react';
import { 
  registerModal, 
  unregisterModal, 
  isModalRegistered,
  isHandling,
  removeFromStackSilently,
  ensureBaseHistoryEntry as ensureBase
} from './use-shared-modal-history';

/**
 * Unified back button history management for Android WebView
 * 
 * This hook allows any component with local modal/overlay state to 
 * participate in browser history, enabling Android back button to 
 * close them instead of navigating away or exiting the app.
 * 
 * Uses the shared modal history manager to coordinate with central store modals.
 */

interface BackButtonHistoryOptions {
  /** Unique identifier for this modal/overlay */
  id: string;
  /** Callback when back button should close this modal */
  onClose: () => void;
  /** The current open state */
  isOpen?: boolean;
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
    if (isOpen === undefined) return;
    
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    
    // Modal just opened
    if (isOpen && !wasOpen) {
      registerModal(id, closeRef.current, 'local');
    }
    
    // Modal just closed (not via back button)
    if (!isOpen && wasOpen) {
      if (isModalRegistered(id)) {
        unregisterModal(id);
      }
    }
  }, [id, isOpen]);
  
  // Cleanup on unmount - silently remove without history navigation
  useEffect(() => {
    return () => {
      removeFromStackSilently(id);
    };
  }, [id]);
}

/**
 * Hook that provides controlled open/close functions
 * for components that want simpler integration
 */
export function useBackButtonModal(id: string) {
  const closeCallbackRef = useRef<(() => void) | null>(null);
  
  const open = useCallback((onClose: () => void) => {
    closeCallbackRef.current = onClose;
    registerModal(id, onClose, 'local');
  }, [id]);
  
  const close = useCallback(() => {
    if (isModalRegistered(id)) {
      unregisterModal(id);
      closeCallbackRef.current?.();
    }
  }, [id]);
  
  // Cleanup on unmount - silently remove without history navigation
  useEffect(() => {
    return () => {
      removeFromStackSilently(id);
    };
  }, [id]);
  
  return { open, close };
}

/**
 * Re-export for backwards compatibility
 */
export const ensureBaseHistoryEntry = ensureBase;

/**
 * Check if the system is currently handling a popstate
 */
export function isBackButtonHandling(): boolean {
  return isHandling();
}

// Legacy export for coordination
export function setBackButtonHandling(_value: boolean) {
  // No-op - now handled by shared manager
}
