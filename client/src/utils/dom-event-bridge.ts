/**
 * DOM Event Bridge - Resilient click handler for FlutterFlow WebView
 * 
 * Problem: FlutterFlow occasionally detaches React's root event delegation listener
 * during background/resume cycles, causing onClick handlers to stop firing.
 * 
 * Solution: Use native .click() method and direct handler invocation which bypasses
 * event delegation entirely. Track scroll gestures to avoid phantom clicks.
 */

import { useEffect, useRef } from 'react';

type ActionHandler = (element: HTMLElement, event: MouseEvent | TouchEvent | PointerEvent) => void;

const actionHandlers = new Map<string, ActionHandler>();

let globalModalOpener: ((modalType: string, section: string, vortId?: number) => void) | null = null;

export function setGlobalModalOpener(opener: (modalType: string, section: string, vortId?: number) => void) {
  globalModalOpener = opener;
}

export function getGlobalModalOpener() {
  return globalModalOpener;
}

let bridgeInitialized = false;
let appFullyLoaded = false;

export function registerAction(name: string, handler: ActionHandler) {
  actionHandlers.set(name, handler);
  if (!bridgeInitialized) {
    initializeBridge();
  }
}

export function unregisterAction(name: string) {
  actionHandlers.delete(name);
}

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

// Interactive element selectors for bridge containers
const INTERACTIVE_SELECTORS = 'button, a, input, select, textarea, [role="button"], [tabindex]';

function initializeBridge() {
  if (typeof window === 'undefined' || bridgeInitialized) return;
  
  bridgeInitialized = true;
  
  const isDebugMode = localStorage.getItem('debugDOMBridge') === 'true';
  
  if (isDebugMode) {
    console.log('[DOM Bridge] Initializing resilient click handler for FlutterFlow');
  }
  
  // Track pointer state for tap detection
  let lastPointerDownTarget: HTMLElement | null = null;
  let lastPointerDownTime = 0;
  let lastPointerDownX = 0;
  let lastPointerDownY = 0;
  let isScrolling = false;
  
  const TAP_THRESHOLD_MS = 400;
  const SCROLL_MOVEMENT_THRESHOLD = 10; // pixels - reduced for better scroll detection
  
  // Delay activation to avoid interfering with initial page load
  setTimeout(() => {
    appFullyLoaded = true;
    if (isDebugMode) {
      console.log('[DOM Bridge] App fully loaded, now tracking pointer events');
    }
  }, 500);
  
  // Track scroll events to prevent phantom clicks during scroll
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  const handleScroll = () => {
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  };
  
  // Invoke action or click on an element directly
  const invokeElement = (element: HTMLElement, event: PointerEvent) => {
    // Check for registered action handlers first
    let currentElement: HTMLElement | null = element;
    while (currentElement && currentElement !== document.body) {
      const action = currentElement.getAttribute('data-action');
      if (action && actionHandlers.has(action)) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking registered action:', action);
        }
        try {
          actionHandlers.get(action)!(currentElement, event);
        } catch (error) {
          console.error('[DOM Bridge] Error in action handler:', action, error);
        }
        return true;
      }
      
      const modalType = currentElement.getAttribute('data-modal-type');
      if (modalType && globalModalOpener) {
        const section = currentElement.getAttribute('data-modal-section') || 'home';
        const vortId = currentElement.getAttribute('data-vort-id');
        if (isDebugMode) {
          console.log('[DOM Bridge] Opening modal:', modalType, section);
        }
        try {
          globalModalOpener(modalType, section, vortId ? parseInt(vortId) : undefined);
        } catch (error) {
          console.error('[DOM Bridge] Error opening modal:', error);
        }
        return true;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    return false;
  };
  
  const handlePointerDown = (e: PointerEvent) => {
    if (!appFullyLoaded) return;
    
    lastPointerDownTarget = e.target as HTMLElement;
    lastPointerDownTime = Date.now();
    lastPointerDownX = e.clientX;
    lastPointerDownY = e.clientY;
    
    if (isDebugMode) {
      console.log('[DOM Bridge] Pointer down at', e.clientX.toFixed(0), e.clientY.toFixed(0));
    }
  };
  
  const handlePointerUp = (e: PointerEvent) => {
    if (!appFullyLoaded || !lastPointerDownTarget) return;
    
    const timeSinceDown = Date.now() - lastPointerDownTime;
    const movementX = Math.abs(e.clientX - lastPointerDownX);
    const movementY = Math.abs(e.clientY - lastPointerDownY);
    const totalMovement = Math.sqrt(movementX * movementX + movementY * movementY);
    
    if (isDebugMode) {
      console.log('[DOM Bridge] Pointer up - movement:', totalMovement.toFixed(1), 'px, time:', timeSinceDown, 'ms, scrolling:', isScrolling);
    }
    
    // Reject if: took too long, moved too much, or currently scrolling
    if (timeSinceDown > TAP_THRESHOLD_MS || totalMovement > SCROLL_MOVEMENT_THRESHOLD || isScrolling) {
      if (isDebugMode && (totalMovement > SCROLL_MOVEMENT_THRESHOLD || isScrolling)) {
        console.log('[DOM Bridge] Rejected as scroll gesture');
      }
      lastPointerDownTarget = null;
      return;
    }
    
    const target = e.target as HTMLElement;
    
    // Verify we're still on same element (or child/parent)
    const isOnSameElement = target === lastPointerDownTarget || 
                            target.contains(lastPointerDownTarget) || 
                            lastPointerDownTarget.contains(target);
    if (!isOnSameElement) {
      lastPointerDownTarget = null;
      return;
    }
    
    const tapTarget = lastPointerDownTarget;
    lastPointerDownTarget = null;
    
    // First try data-action or data-modal-type
    if (invokeElement(tapTarget, e)) {
      return;
    }
    
    // Check if inside a bridge container
    const bridgeContainer = tapTarget.closest('[data-bridge-container]');
    if (!bridgeContainer) {
      return;
    }
    
    // Find closest interactive element
    const interactiveElement = tapTarget.closest(INTERACTIVE_SELECTORS) as HTMLElement | null;
    if (!interactiveElement || !bridgeContainer.contains(interactiveElement)) {
      return;
    }
    
    // Force click through multiple methods
    if (isDebugMode) {
      console.log('[DOM Bridge] Forcing click on:', interactiveElement.tagName, 
        interactiveElement.className?.toString().slice(0, 40) || '');
    }
    
    // Method 1: Focus the element first (some handlers require focus)
    try {
      interactiveElement.focus();
    } catch (e) {
      // Ignore focus errors
    }
    
    // Method 2: Dispatch a trusted-like MouseEvent
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: e.screenX,
      screenY: e.screenY,
      clientX: e.clientX,
      clientY: e.clientY,
      button: 0,
      buttons: 1
    });
    
    // Dispatch immediately (don't wait)
    interactiveElement.dispatchEvent(clickEvent);
    
    // Method 3: Also call native click as backup
    setTimeout(() => {
      try {
        interactiveElement.click();
      } catch (err) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Native click failed:', err);
        }
      }
    }, 10);
    
    // Method 4: For buttons, try direct form submission or anchor navigation
    if (interactiveElement.tagName === 'A' && (interactiveElement as HTMLAnchorElement).href) {
      // Anchor links - trigger navigation if click didn't work
      setTimeout(() => {
        const anchor = interactiveElement as HTMLAnchorElement;
        if (anchor.href && !anchor.href.startsWith('javascript:')) {
          // Only for same-origin links, let the click handle it
        }
      }, 50);
    }
  };
  
  // Attach listeners with capture phase for early interception
  const attachListeners = () => {
    document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    document.addEventListener('pointerup', handlePointerUp, { capture: true, passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
  };
  
  const detachListeners = () => {
    document.removeEventListener('pointerdown', handlePointerDown, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('scroll', handleScroll);
  };
  
  attachListeners();
  
  // Re-attach on visibility change (app resume)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (isDebugMode) {
        console.log('[DOM Bridge] Page resumed from background - refreshing listeners');
      }
      
      // Force re-attach listeners
      detachListeners();
      
      // Small delay before re-attaching to let WebView stabilize
      setTimeout(() => {
        attachListeners();
        if (isDebugMode) {
          console.log('[DOM Bridge] Listeners re-attached after resume');
        }
      }, 100);
    }
  });
  
  // Periodic refresh as backup
  setInterval(() => {
    detachListeners();
    attachListeners();
  }, 10000);
}

if (typeof window !== 'undefined') {
  initializeBridge();
}
