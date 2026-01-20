import { useEffect, useRef } from 'react';
import { useModalStore } from '@/lib/types';

/**
 * Simple, robust modal history management for Android back button support
 * 
 * Strategy:
 * - When modal opens: push a history entry
 * - When back button pressed: popstate fires, we close the modal
 * - When modal closed via X/Escape: we go back in history
 * 
 * Uses a simple tracking approach without complex depth management.
 */
export function useModalHistory() {
  const activeModal = useModalStore(state => state.activeModal);
  const closeModal = useModalStore(state => state.closeModal);
  
  // Track previous modal state to detect transitions
  const prevModalRef = useRef<string | null>(null);
  
  // Track if we have a modal entry in history
  const hasModalEntryRef = useRef(false);
  
  // Flag to prevent loops when we trigger navigation
  const isClosingRef = useRef(false);
  
  // Handle back button (popstate event)
  useEffect(() => {
    const handlePopstate = () => {
      // If we're in the middle of programmatic close, ignore
      if (isClosingRef.current) {
        return;
      }
      
      // If modal is open and we got a popstate, user pressed back
      if (activeModal && hasModalEntryRef.current) {
        isClosingRef.current = true;
        hasModalEntryRef.current = false;
        closeModal();
        
        // Reset flag after close completes
        setTimeout(() => {
          isClosingRef.current = false;
        }, 100);
      }
    };
    
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [activeModal, closeModal]);
  
  // Manage history entries when modal state changes
  useEffect(() => {
    const prevModal = prevModalRef.current;
    const currentModal = activeModal;
    
    // Modal just opened
    if (currentModal && !prevModal) {
      if (!isClosingRef.current) {
        // Push a history entry for the modal
        window.history.pushState({ modal: currentModal }, '');
        hasModalEntryRef.current = true;
      }
    }
    
    // Modal just closed
    else if (!currentModal && prevModal) {
      // If we have a modal entry and this wasn't triggered by back button
      if (hasModalEntryRef.current && !isClosingRef.current) {
        isClosingRef.current = true;
        hasModalEntryRef.current = false;
        
        // Go back to remove our entry
        window.history.back();
        
        setTimeout(() => {
          isClosingRef.current = false;
        }, 100);
      }
    }
    
    // Modal changed (switched from one to another)
    else if (currentModal && prevModal && currentModal !== prevModal) {
      // Just replace the current state with new modal info
      if (hasModalEntryRef.current) {
        window.history.replaceState({ modal: currentModal }, '');
      }
    }
    
    prevModalRef.current = currentModal;
  }, [activeModal]);
  
  return { activeModal };
}

/**
 * Ensures there's a base history entry so back button doesn't exit app immediately.
 * This pushes an actual buffer entry, not just replacing the current state.
 */
export function useBaseHistoryEntry() {
  useEffect(() => {
    // Only set up once on mount - need to push a buffer entry
    // so Android back button has somewhere to go before exiting
    if (!window.history.state || !window.history.state.base) {
      // Mark current entry as base
      window.history.replaceState({ base: true, app: 'ezras-nashim' }, '');
      // Push a buffer entry so first back press doesn't exit
      window.history.pushState({ base: true, buffer: true, app: 'ezras-nashim' }, '');
    }
  }, []);
}
