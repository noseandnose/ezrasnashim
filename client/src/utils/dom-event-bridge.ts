/**
 * DOM Event Bridge - Resilient click handler for FlutterFlow WebView
 * 
 * Problem: FlutterFlow occasionally detaches React's root event delegation listener
 * during background/resume cycles, causing onClick handlers to stop firing.
 * 
 * Solution: Attach a capture-phase document listener that directly invokes
 * registered handlers via data-action attributes, bypassing React entirely.
 */

type ActionHandler = (element: HTMLElement, event: MouseEvent | TouchEvent) => void;

const actionHandlers = new Map<string, ActionHandler>();

let bridgeInitialized = false;

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
        console.log('[DOM Bridge] Invoking action:', action);
        const handler = actionHandlers.get(action)!;
        
        try {
          handler(currentElement, e);
        } catch (error) {
          console.error('[DOM Bridge] Error in action handler:', action, error);
        }
        
        // Action handled, stop here
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
