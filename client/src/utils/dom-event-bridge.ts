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

let bridgeInitialized = false;
let reactDelegationHealthy = true;
let lastHealthCheck = Date.now();

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
  
  console.log('[DOM Bridge] Initializing resilient click handler for FlutterFlow');
  
  // Use capture phase to catch events before they might be stopped
  const handleClick = (e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Walk up the DOM tree to find an element with data-action
    let currentElement: HTMLElement | null = target;
    while (currentElement && currentElement !== document.body) {
      const action = currentElement.getAttribute('data-action');
      
      if (action && actionHandlers.has(action)) {
        console.log('[DOM Bridge] Invoking registered action:', action);
        const handler = actionHandlers.get(action)!;
        
        try {
          handler(currentElement, e);
        } catch (error) {
          console.error('[DOM Bridge] Error in action handler:', action, error);
        }
        
        // Action handled
        return;
      }
      
      currentElement = currentElement.parentElement;
    }
  };
  
  // Attach both click and touchend for maximum compatibility
  document.addEventListener('click', handleClick, true);
  document.addEventListener('touchend', handleClick, true);
  
  // Re-attach every 5 seconds in case FlutterFlow removes them
  setInterval(() => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('touchend', handleClick, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('touchend', handleClick, true);
    console.log('[DOM Bridge] Re-attached event listeners');
  }, 5000);
  
  // Health check: Detect when React's event delegation fails
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      console.log('[DOM Bridge] Page resumed, checking React health');
      
      // Test if React's delegation is working by checking for React-managed properties
      const reactRoot = document.getElementById('root');
      if (reactRoot) {
        const reactKeys = Object.keys(reactRoot).filter(k => k.startsWith('__react'));
        if (reactKeys.length === 0) {
          console.warn('[DOM Bridge] React root properties missing - delegation may be broken!');
          reactDelegationHealthy = false;
        } else {
          reactDelegationHealthy = true;
        }
      }
      
      lastHealthCheck = now;
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
