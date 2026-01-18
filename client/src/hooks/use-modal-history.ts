import { useEffect, useRef } from 'react';
import { useModalStore } from '@/lib/types';

/**
 * History state structure for modal tracking
 */
interface ModalHistoryState {
  type: 'modal';
  modalId: string;
  timestamp: number;
}


/**
 * Hook that manages browser history for modals
 * - Pushes history entry when modal opens
 * - Closes modal when back button is pressed
 * - Works with Android WebView back button
 */
export function useModalHistory() {
  const activeModal = useModalStore(state => state.activeModal);
  const closeModal = useModalStore(state => state.closeModal);
  
  // Track the previous modal to detect changes
  const prevModalRef = useRef<string | null>(null);
  
  // Track if we're currently handling a popstate (to prevent loops)
  const handlingPopstateRef = useRef(false);
  
  // Track the history state we pushed
  const pushedStateRef = useRef<string | null>(null);
  
  useEffect(() => {
    const handlePopstate = (_event: PopStateEvent) => {
      // If current modal is open and back was pressed, close it
      if (activeModal && !handlingPopstateRef.current) {
        handlingPopstateRef.current = true;
        
        // Close the modal
        closeModal();
        
        // Reset flag after a short delay
        setTimeout(() => {
          handlingPopstateRef.current = false;
        }, 100);
      }
    };
    
    // Add the popstate listener
    window.addEventListener('popstate', handlePopstate);
    
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [activeModal, closeModal]);
  
  // Push history state when modal opens
  useEffect(() => {
    const prevModal = prevModalRef.current;
    
    // Modal just opened (null -> something)
    if (activeModal && !prevModal && !handlingPopstateRef.current) {
      // Push a new history entry for the modal
      const modalState: ModalHistoryState = {
        type: 'modal',
        modalId: activeModal,
        timestamp: Date.now()
      };
      
      // Push state with the modal info
      window.history.pushState(modalState, '', window.location.href);
      pushedStateRef.current = activeModal;
    }
    
    // Modal just closed (something -> null) and we didn't trigger it via popstate
    // We need to go back in history to match the UI state
    if (!activeModal && prevModal && pushedStateRef.current === prevModal && !handlingPopstateRef.current) {
      // The modal was closed programmatically (not via back button)
      // We need to remove the history entry we pushed
      // But we can't remove it, so we'll just leave it - the next back press will be a no-op
      pushedStateRef.current = null;
    }
    
    // Modal changed to a different modal (modal A -> modal B)
    if (activeModal && prevModal && activeModal !== prevModal && !handlingPopstateRef.current) {
      // Replace the current state with the new modal
      const modalState: ModalHistoryState = {
        type: 'modal',
        modalId: activeModal,
        timestamp: Date.now()
      };
      
      window.history.replaceState(modalState, '', window.location.href);
      pushedStateRef.current = activeModal;
    }
    
    prevModalRef.current = activeModal;
  }, [activeModal]);
  
  return { activeModal };
}

/**
 * Hook to ensure there's always a base history entry
 * This prevents the app from exiting on the first back press
 */
export function useBaseHistoryEntry() {
  useEffect(() => {
    // Push a base entry if we're at the start of history
    // This is a safety net for the very first page load
    if (window.history.length <= 1) {
      window.history.pushState({ type: 'base', timestamp: Date.now() }, '', window.location.href);
    }
  }, []);
}
