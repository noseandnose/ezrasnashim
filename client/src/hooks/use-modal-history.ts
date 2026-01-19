import { useEffect, useRef } from 'react';
import { useModalStore } from '@/lib/types';

/**
 * Unique key to identify modal history entries
 */
const MODAL_HISTORY_KEY = '__ezras_modal__';

/**
 * History state structure for modal tracking
 */
interface ModalHistoryState {
  [MODAL_HISTORY_KEY]: true;
  modalId: string;
  depth: number; // Track modal stack depth
}

/**
 * Check if a history state is our modal state
 */
function isOurModalState(state: unknown): state is ModalHistoryState {
  return (
    typeof state === 'object' &&
    state !== null &&
    MODAL_HISTORY_KEY in state &&
    (state as ModalHistoryState)[MODAL_HISTORY_KEY] === true
  );
}

// Global modal depth counter - persists across hook instances
let globalModalDepth = 0;

/**
 * Hook that manages browser history for modals
 * Provides Android back button support for modal navigation
 * 
 * Strategy:
 * - Track modal depth to match history entries with modal state
 * - On modal open: push entry with depth marker
 * - On back: check if we're leaving a modal entry (via state depth matching)
 * - On close: only navigate back if current state matches our modal entry
 */
export function useModalHistory() {
  const activeModal = useModalStore(state => state.activeModal);
  const closeModal = useModalStore(state => state.closeModal);
  
  // Track the previous modal to detect transitions
  const prevModalRef = useRef<string | null>(null);
  
  // Track the depth when we pushed the current modal entry
  const pushedDepthRef = useRef<number | null>(null);
  
  // Flag to prevent re-entry
  const isNavigatingRef = useRef(false);
  
  // Handle popstate (back button pressed)
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      // Ignore if we triggered this navigation
      if (isNavigatingRef.current) {
        return;
      }
      
      // Check if we're leaving a modal state
      // event.state is the state we're navigating TO
      // We need to check if we WERE in a modal state and are now leaving it
      
      // If we have an active modal AND we pushed a history entry for it,
      // AND the state we're navigating to is NOT our modal state (or is a different depth),
      // then back was pressed and we should close the modal
      if (activeModal && pushedDepthRef.current !== null) {
        const targetState = event.state;
        
        // If the target state is not our modal or has a different depth, the modal was "backed out"
        const isLeavingModal = !isOurModalState(targetState) || 
          (targetState.depth !== pushedDepthRef.current);
        
        if (isLeavingModal) {
          isNavigatingRef.current = true;
          pushedDepthRef.current = null; // Clear since we're closing via back
          globalModalDepth = Math.max(0, globalModalDepth - 1);
          
          closeModal();
          
          requestAnimationFrame(() => {
            isNavigatingRef.current = false;
          });
        }
      }
    };
    
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [activeModal, closeModal]);
  
  // Manage history entries based on modal state changes
  useEffect(() => {
    const prevModal = prevModalRef.current;
    const currentModal = activeModal;
    
    // Modal just opened (null -> modalId)
    if (currentModal && !prevModal) {
      if (!isNavigatingRef.current) {
        globalModalDepth++;
        const depth = globalModalDepth;
        
        const modalState: ModalHistoryState = {
          [MODAL_HISTORY_KEY]: true,
          modalId: currentModal,
          depth
        };
        
        window.history.pushState(modalState, '');
        pushedDepthRef.current = depth;
      }
    }
    
    // Modal just closed (modalId -> null)
    else if (!currentModal && prevModal) {
      // Only clean up history if this wasn't triggered by popstate (back button)
      if (!isNavigatingRef.current && pushedDepthRef.current !== null) {
        // Verify the current state matches what we pushed
        const currentState = window.history.state;
        
        if (isOurModalState(currentState) && currentState.depth === pushedDepthRef.current) {
          isNavigatingRef.current = true;
          globalModalDepth = Math.max(0, globalModalDepth - 1);
          
          window.history.back();
          
          requestAnimationFrame(() => {
            isNavigatingRef.current = false;
          });
        }
        
        pushedDepthRef.current = null;
      }
    }
    
    // Modal changed (modalA -> modalB)
    else if (currentModal && prevModal && currentModal !== prevModal) {
      // Replace the history entry with the new modal (keep same depth)
      if (pushedDepthRef.current !== null) {
        const modalState: ModalHistoryState = {
          [MODAL_HISTORY_KEY]: true,
          modalId: currentModal,
          depth: pushedDepthRef.current
        };
        window.history.replaceState(modalState, '');
      }
    }
    
    prevModalRef.current = currentModal;
  }, [activeModal]);
  
  return { activeModal };
}

/**
 * Hook to ensure there's always a base history entry
 * This prevents the app from exiting on the first back press
 */
export function useBaseHistoryEntry() {
  useEffect(() => {
    // Mark initial state as base if not already marked
    if (!window.history.state) {
      window.history.replaceState({ type: 'base' }, '');
    }
    
    // Ensure at least some history depth for safety
    if (window.history.length <= 1) {
      window.history.pushState({ type: 'base', safety: true }, '');
    }
  }, []);
}
