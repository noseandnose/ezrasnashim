import { useEffect, useRef } from 'react';
import { useModalStore } from '@/lib/types';
import { 
  registerModal, 
  unregisterModal, 
  isModalRegistered,
  isHandling,
  ensureBaseHistoryEntry,
  removeFromStackSilently
} from './use-shared-modal-history';

/**
 * Hook to ensure a base history entry exists on app mount.
 * This prevents the first back button press from exiting the app.
 */
export function useBaseHistoryEntry() {
  useEffect(() => {
    ensureBaseHistoryEntry();
  }, []);
}

/**
 * Modal history management for central store modals (Android back button support)
 * 
 * Uses the shared modal history manager to coordinate with local-state modals.
 * 
 * Strategy:
 * - When modal opens: register with shared manager (pushes history entry)
 * - When back button pressed: shared manager closes the topmost modal
 * - When modal closed via X/Escape: unregister (goes back in history)
 * - Handles modal replacement (A→B): unregisters A, registers B
 */
export function useModalHistory() {
  const activeModal = useModalStore(state => state.activeModal);
  const closeModal = useModalStore(state => state.closeModal);
  
  // Track previous modal state to detect transitions
  const prevModalRef = useRef<string | null>(null);
  
  // Create a stable close function reference
  const closeRef = useRef(closeModal);
  closeRef.current = closeModal;
  
  // Manage registration when modal state changes
  useEffect(() => {
    const prevModal = prevModalRef.current;
    const currentModal = activeModal;
    
    // Store IDs are prefixed to avoid collision with local modal IDs
    const prevId = prevModal ? `store-${prevModal}` : null;
    const currentId = currentModal ? `store-${currentModal}` : null;
    
    // Modal just opened (null → A)
    if (currentModal && !prevModal) {
      if (!isHandling()) {
        registerModal(currentId!, closeRef.current, 'store');
      }
    }
    
    // Modal just closed (A → null)
    else if (!currentModal && prevModal) {
      if (isModalRegistered(prevId!)) {
        unregisterModal(prevId!);
      }
    }
    
    // Modal replaced (A → B)
    else if (currentModal && prevModal && currentModal !== prevModal) {
      // Unregister the old modal silently (don't trigger history.back)
      removeFromStackSilently(prevId!);
      
      // Register the new modal
      if (!isHandling()) {
        registerModal(currentId!, closeRef.current, 'store');
      }
    }
    
    prevModalRef.current = currentModal;
  }, [activeModal]);
}
