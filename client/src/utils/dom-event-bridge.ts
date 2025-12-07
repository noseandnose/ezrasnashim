/**
 * DOM Event Bridge - Resilient click handler for FlutterFlow WebView
 * 
 * Problem: FlutterFlow occasionally detaches React's root event delegation listener
 * during background/resume cycles, causing onClick handlers to stop firing.
 * 
 * Solution: Attach a capture-phase document listener that directly invokes
 * registered handlers via data-action attributes, bypassing React entirely.
 */

import { useEffect, useRef } from 'react';

type ActionHandler = (element: HTMLElement, event: MouseEvent | TouchEvent) => void;

const actionHandlers = new Map<string, ActionHandler>();

// Store for the global modal opener function
let globalModalOpener: ((modalType: string, section: string, vortId?: number) => void) | null = null;

/**
 * Register the global modal opener function from React
 * This allows the DOM bridge to open modals even when React event handlers fail
 */
export function setGlobalModalOpener(opener: (modalType: string, section: string, vortId?: number) => void) {
  globalModalOpener = opener;
}

/**
 * Get the global modal opener
 */
export function getGlobalModalOpener() {
  return globalModalOpener;
}

let bridgeInitialized = false;
let appFullyLoaded = false; // Guard against firing during initial hydration

/**
 * Register a named action handler
 */
export function registerAction(name: string, handler: ActionHandler) {
  actionHandlers.set(name, handler);
  if (!bridgeInitialized) {
    initializeBridge();
  }
}

/**
 * Unregister an action handler
 */
export function unregisterAction(name: string) {
  actionHandlers.delete(name);
}

/**
 * React hook for resilient button/action handlers
 * Automatically registers and cleans up DOM bridge actions
 * 
 * Usage:
 * const bridgeProps = useDomBridgeAction(() => {
 *   // your click handler
 * });
 * <button {...bridgeProps}>Click me</button>
 */
export function useDomBridgeAction(handler: () => void) {
  const actionId = useRef(`action-${Math.random().toString(36).substr(2, 9)}`).current;
  
  useEffect(() => {
    registerAction(actionId, () => {
      handler();
    });
    
    return () => {
      unregisterAction(actionId);
    };
  }, [actionId, handler]);
  
  return {
    'data-action': actionId
  };
}

/**
 * Initialize the DOM event bridge
 * Attaches a capture-phase listener to handle clicks even when React fails
 */
function initializeBridge() {
  if (typeof window === 'undefined' || bridgeInitialized) return;
  
  bridgeInitialized = true;
  
  const isDebugMode = localStorage.getItem('debugDOMBridge') === 'true';
  
  if (isDebugMode) {
    console.log('[DOM Bridge] Initializing resilient click handler for FlutterFlow');
  }
  
  // Track pointerdown targets to detect tap gestures via pointerup
  let lastPointerDownTarget: HTMLElement | null = null;
  let lastPointerDownTime = 0;
  const TAP_THRESHOLD_MS = 500; // Maximum time between down and up for a tap
  
  // Delay activation to avoid interfering with initial page load/hydration
  // This prevents the "pre-selected menu" issue
  setTimeout(() => {
    appFullyLoaded = true;
    if (isDebugMode) {
      console.log('[DOM Bridge] App fully loaded, now tracking pointer events');
    }
  }, 1000);
  
  // Use capture phase to catch events before they might be stopped
  const handleClick = (e: MouseEvent | TouchEvent | PointerEvent) => {
    // Skip if app hasn't fully loaded yet (prevents pre-selection during hydration)
    if (!appFullyLoaded) return;
    
    const target = e.target as HTMLElement;
    
    // Walk up the DOM tree to find an element with data-action or data-modal-type
    let currentElement: HTMLElement | null = target;
    while (currentElement && currentElement !== document.body) {
      const action = currentElement.getAttribute('data-action');
      
      // Check for registered action handlers first
      if (action && actionHandlers.has(action)) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking registered action:', action, 'via', e.type);
        }
        const handler = actionHandlers.get(action)!;
        
        try {
          handler(currentElement, e);
        } catch (error) {
          console.error('[DOM Bridge] Error in action handler:', action, error);
        }
        
        // Action handled
        return;
      }
      
      // Check for modal opener data attributes (fallback for page buttons)
      const modalType = currentElement.getAttribute('data-modal-type');
      const modalSection = currentElement.getAttribute('data-modal-section') || 'home';
      const vortId = currentElement.getAttribute('data-vort-id');
      
      if (modalType && globalModalOpener) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Opening modal via data attributes:', modalType, modalSection, vortId);
        }
        
        try {
          globalModalOpener(modalType, modalSection, vortId ? parseInt(vortId) : undefined);
        } catch (error) {
          console.error('[DOM Bridge] Error opening modal:', modalType, error);
        }
        
        return;
      }
      
      currentElement = currentElement.parentElement;
    }
  };
  
  // Track pointerdown for pointerup-based tap detection
  // This is CRITICAL: pointerdown fires even when click/touchend don't (FlutterFlow bug)
  const handlePointerDown = (e: PointerEvent) => {
    // Skip if app hasn't fully loaded yet
    if (!appFullyLoaded) return;
    
    lastPointerDownTarget = e.target as HTMLElement;
    lastPointerDownTime = Date.now();
  };
  
  // pointerup-based click detection - works when touchend/click are swallowed
  const handlePointerUp = (e: PointerEvent) => {
    // Skip if app hasn't fully loaded yet
    if (!appFullyLoaded) return;
    
    const timeSinceDown = Date.now() - lastPointerDownTime;
    
    // Only process as tap if it was quick and on same element
    if (timeSinceDown > TAP_THRESHOLD_MS) {
      lastPointerDownTarget = null;
      return;
    }
    
    const target = e.target as HTMLElement;
    
    // Verify the up is on the same element tree as the down (it's a tap, not a drag)
    if (lastPointerDownTarget) {
      const isOnSameElement = target === lastPointerDownTarget || 
                              target.contains(lastPointerDownTarget) || 
                              lastPointerDownTarget.contains(target);
      
      if (!isOnSameElement) {
        lastPointerDownTarget = null;
        return;
      }
    }
    
    // Find action element from the pointerdown target (more reliable than pointerup target)
    let currentElement: HTMLElement | null = lastPointerDownTarget || target;
    while (currentElement && currentElement !== document.body) {
      const action = currentElement.getAttribute('data-action');
      
      // Check for registered action handlers first
      if (action && actionHandlers.has(action)) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking registered action via pointerup:', action);
        }
        const handler = actionHandlers.get(action)!;
        
        try {
          // Prevent the default to avoid duplicate handling if click also fires
          e.preventDefault();
          handler(currentElement, e);
        } catch (error) {
          console.error('[DOM Bridge] Error in action handler:', action, error);
        }
        
        lastPointerDownTarget = null;
        return;
      }
      
      // Check for modal opener data attributes (fallback for page buttons)
      const modalType = currentElement.getAttribute('data-modal-type');
      const modalSection = currentElement.getAttribute('data-modal-section') || 'home';
      const vortId = currentElement.getAttribute('data-vort-id');
      
      if (modalType && globalModalOpener) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Opening modal via pointerup:', modalType, modalSection, vortId);
        }
        
        try {
          e.preventDefault();
          globalModalOpener(modalType, modalSection, vortId ? parseInt(vortId) : undefined);
        } catch (error) {
          console.error('[DOM Bridge] Error opening modal via pointerup:', modalType, error);
        }
        
        lastPointerDownTarget = null;
        return;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    lastPointerDownTarget = null;
  };
  
  // Attach all event listeners - use multiple for maximum compatibility
  // Priority: pointerup (most reliable after WebView resume) > click > touchend
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('pointerup', handlePointerUp, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('touchend', handleClick, true);
  
  // Re-attach every 5 seconds in case FlutterFlow removes them
  setInterval(() => {
    document.removeEventListener('pointerdown', handlePointerDown, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('touchend', handleClick, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('touchend', handleClick, true);
    // Only log in debug mode to reduce console noise
  }, 5000);
  
  // CRITICAL: Immediately re-attach listeners when page becomes visible
  // This ensures button interactivity is restored after FlutterFlow WebView resume
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (isDebugMode) {
        console.log('[DOM Bridge] Page resumed - immediately re-attaching event listeners');
      }
      
      // Immediately re-attach all listeners to ensure they're fresh
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('touchend', handleClick, true);
      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('touchend', handleClick, true);
      
      // Health check: Test if React's delegation is working
      if (isDebugMode) {
        console.log('[DOM Bridge] Page resumed, checking React health');
        
        const reactRoot = document.getElementById('root');
        if (reactRoot) {
          const reactKeys = Object.keys(reactRoot).filter(k => k.startsWith('__react'));
          if (reactKeys.length === 0) {
            console.warn('[DOM Bridge] React root properties missing - delegation may be broken!');
          } else {
            console.log('[DOM Bridge] React event delegation appears healthy');
          }
        }
      }
    }
  });
  
  // Diagnostic: Log when document listeners might be removed
  if (process.env.NODE_ENV === 'development') {
    const originalRemoveEventListener = document.removeEventListener.bind(document);
    document.removeEventListener = function(type: string, listener: any, options?: any) {
      if (type === 'click' && listener !== handleClick) {
        console.warn('[DOM Bridge Diagnostic] External code removing click listener from document');
      }
      return originalRemoveEventListener(type, listener, options);
    };
  }
}

/**
 * Initialize the bridge on module load
 */
if (typeof window !== 'undefined') {
  initializeBridge();
}
