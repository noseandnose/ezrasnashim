/**
 * Shared Modal History Manager
 * 
 * This module provides a unified history stack for all modals in the app,
 * regardless of whether they use the central modal store or local state.
 * This prevents conflicts and ensures proper ordering when closing modals
 * via the Android back button.
 */

interface ModalEntry {
  id: string;
  close: () => void;
  source: 'store' | 'local';
}

// Ordered stack of open modals (LIFO - last opened is first to close)
const modalStack: ModalEntry[] = [];

// Flag to prevent loops during programmatic navigation
let isHandlingPopstate = false;

// Single global popstate listener
let listenerAdded = false;

function handlePopstate() {
  if (isHandlingPopstate) return;
  
  // Close the most recently opened modal
  const topModal = modalStack.pop();
  if (topModal) {
    isHandlingPopstate = true;
    topModal.close();
    
    // Reset flag after a brief delay
    setTimeout(() => {
      isHandlingPopstate = false;
    }, 50);
  }
}

function ensureListener() {
  if (!listenerAdded && typeof window !== 'undefined') {
    window.addEventListener('popstate', handlePopstate);
    listenerAdded = true;
  }
}

/**
 * Register a modal with the shared history stack
 * Call when modal opens
 */
export function registerModal(id: string, close: () => void, source: 'store' | 'local' = 'local') {
  ensureListener();
  
  // Don't register if we're handling a popstate
  if (isHandlingPopstate) return;
  
  // If already registered, update the close function but don't push new history
  const existingIndex = modalStack.findIndex(m => m.id === id);
  if (existingIndex !== -1) {
    modalStack[existingIndex].close = close;
    return;
  }
  
  // Push history entry
  window.history.pushState({ modal: id, sharedHistory: true }, '');
  
  // Add to stack
  modalStack.push({ id, close, source });
}

/**
 * Unregister a modal from the history stack
 * Call when modal closes (not via back button)
 * Only goes back in history if this is the topmost modal
 */
export function unregisterModal(id: string) {
  const index = modalStack.findIndex(m => m.id === id);
  if (index === -1) return;
  
  const isTopmost = index === modalStack.length - 1;
  
  // Remove from stack
  modalStack.splice(index, 1);
  
  // Only go back in history if this was the topmost modal
  // For non-topmost modals, we have a history desync but it's better than breaking UX
  if (isTopmost && !isHandlingPopstate) {
    isHandlingPopstate = true;
    window.history.back();
    setTimeout(() => {
      isHandlingPopstate = false;
    }, 50);
  }
}

/**
 * Silently remove a modal from the stack without affecting history
 * Use for cleanup on unmount when modal is already closed
 */
export function removeFromStackSilently(id: string) {
  const index = modalStack.findIndex(m => m.id === id);
  if (index !== -1) {
    modalStack.splice(index, 1);
  }
}

/**
 * Check if a specific modal is registered
 */
export function isModalRegistered(id: string): boolean {
  return modalStack.some(m => m.id === id);
}

/**
 * Check if any modal is currently handling popstate
 */
export function isHandling(): boolean {
  return isHandlingPopstate;
}

/**
 * Get count of active modals
 */
export function getActiveCount(): number {
  return modalStack.length;
}

/**
 * Ensure there's a base history entry to prevent immediate app exit
 */
export function ensureBaseHistoryEntry() {
  if (typeof window === 'undefined') return;
  
  if (!window.history.state || !window.history.state.base) {
    window.history.replaceState({ base: true, app: 'ezras-nashim' }, '');
    window.history.pushState({ base: true, buffer: true, app: 'ezras-nashim' }, '');
  }
}
