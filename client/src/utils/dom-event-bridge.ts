/**
 * DOM Event Bridge - Resilient click handler for FlutterFlow WebView
 * 
 * Problem: FlutterFlow occasionally detaches React's root event delegation listener
 * during background/resume cycles, causing onClick handlers to stop firing.
 * 
 * Solution: Attach capture-phase listeners that handle clicks via:
 * 1. data-action: For registered action handlers (bottom nav, header buttons)
 * 2. data-modal-type: For modal openers on page buttons
 * 3. data-bridge-container: Container attribute for modals - all interactive 
 *    descendants get synthetic click fallback when React delegation fails
 */

import { useEffect, useRef } from 'react';

type ActionHandler = (element: HTMLElement, event: MouseEvent | TouchEvent) => void;

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
  let currentTapId = 0;
  let realClickFiredForCurrentTap = false;
  const TAP_THRESHOLD_MS = 500;
  const CLICK_GRACE_PERIOD_MS = 50;
  
  // Delay activation to avoid interfering with initial page load
  setTimeout(() => {
    appFullyLoaded = true;
    if (isDebugMode) {
      console.log('[DOM Bridge] App fully loaded, now tracking pointer events');
    }
  }, 1000);
  
  // Detect when real clicks fire - prevents double-clicks when React works
  const handleRealClick = () => {
    if (!appFullyLoaded) return;
    realClickFiredForCurrentTap = true;
  };
  
  // Handle elements with data-action or data-modal-type
  const handleBridgeClick = (e: MouseEvent | TouchEvent) => {
    if (!appFullyLoaded) return;
    
    const target = e.target as HTMLElement;
    let currentElement: HTMLElement | null = target;
    
    while (currentElement && currentElement !== document.body) {
      // Check for registered action handlers
      const action = currentElement.getAttribute('data-action');
      if (action && actionHandlers.has(action)) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking action:', action);
        }
        try {
          actionHandlers.get(action)!(currentElement, e);
        } catch (error) {
          console.error('[DOM Bridge] Error in action handler:', action, error);
        }
        return;
      }
      
      // Check for modal opener
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
        return;
      }
      
      currentElement = currentElement.parentElement;
    }
  };
  
  const handlePointerDown = (e: PointerEvent) => {
    if (!appFullyLoaded) return;
    
    lastPointerDownTarget = e.target as HTMLElement;
    lastPointerDownTime = Date.now();
    currentTapId++;
    realClickFiredForCurrentTap = false;
  };
  
  const handlePointerUp = (e: PointerEvent) => {
    if (!appFullyLoaded) return;
    
    const timeSinceDown = Date.now() - lastPointerDownTime;
    if (timeSinceDown > TAP_THRESHOLD_MS) {
      lastPointerDownTarget = null;
      return;
    }
    
    const target = e.target as HTMLElement;
    const thisTapId = currentTapId;
    
    // Verify tap (not drag)
    if (lastPointerDownTarget) {
      const isOnSameElement = target === lastPointerDownTarget || 
                              target.contains(lastPointerDownTarget) || 
                              lastPointerDownTarget.contains(target);
      if (!isOnSameElement) {
        lastPointerDownTarget = null;
        return;
      }
    }
    
    const tapTarget = lastPointerDownTarget || target;
    
    // First check for data-action or data-modal-type - handle directly
    let currentElement: HTMLElement | null = tapTarget;
    while (currentElement && currentElement !== document.body) {
      const action = currentElement.getAttribute('data-action');
      if (action && actionHandlers.has(action)) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking action via pointerup:', action);
        }
        try {
          actionHandlers.get(action)!(currentElement, e);
        } catch (error) {
          console.error('[DOM Bridge] Error:', error);
        }
        lastPointerDownTarget = null;
        return;
      }
      
      const modalType = currentElement.getAttribute('data-modal-type');
      if (modalType && globalModalOpener) {
        const section = currentElement.getAttribute('data-modal-section') || 'home';
        const vortId = currentElement.getAttribute('data-vort-id');
        if (isDebugMode) {
          console.log('[DOM Bridge] Opening modal via pointerup:', modalType);
        }
        try {
          globalModalOpener(modalType, section, vortId ? parseInt(vortId) : undefined);
        } catch (error) {
          console.error('[DOM Bridge] Error:', error);
        }
        lastPointerDownTarget = null;
        return;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // Check if tap target is inside a bridge container
    const bridgeContainer = tapTarget.closest('[data-bridge-container]');
    if (!bridgeContainer) {
      lastPointerDownTarget = null;
      return;
    }
    
    // Find the closest interactive element from the tap target
    const interactiveElement = tapTarget.closest(INTERACTIVE_SELECTORS) as HTMLElement | null;
    if (!interactiveElement || !bridgeContainer.contains(interactiveElement)) {
      lastPointerDownTarget = null;
      return;
    }
    
    // Wait for grace period to see if real click fires
    setTimeout(() => {
      if (thisTapId !== currentTapId) {
        return; // A new tap started, ignore this one
      }
      
      if (realClickFiredForCurrentTap) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Real click fired, skipping synthetic');
        }
        return;
      }
      
      // No real click fired - dispatch synthetic click
      if (isDebugMode) {
        console.log('[DOM Bridge] No real click, dispatching synthetic on:', 
          interactiveElement.tagName, interactiveElement.className?.slice?.(0, 30) || '');
      }
      
      const syntheticClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: e.clientX,
        clientY: e.clientY
      });
      
      interactiveElement.dispatchEvent(syntheticClick);
    }, CLICK_GRACE_PERIOD_MS);
    
    lastPointerDownTarget = null;
  };
  
  // Attach listeners
  document.addEventListener('click', handleRealClick, false);
  document.addEventListener('click', handleBridgeClick, true);
  document.addEventListener('touchend', handleBridgeClick, true);
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('pointerup', handlePointerUp, true);
  
  // Re-attach periodically
  setInterval(() => {
    document.removeEventListener('click', handleRealClick, false);
    document.removeEventListener('click', handleBridgeClick, true);
    document.removeEventListener('touchend', handleBridgeClick, true);
    document.removeEventListener('pointerdown', handlePointerDown, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('click', handleRealClick, false);
    document.addEventListener('click', handleBridgeClick, true);
    document.addEventListener('touchend', handleBridgeClick, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerUp, true);
  }, 5000);
  
  // Re-attach on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (isDebugMode) {
        console.log('[DOM Bridge] Page resumed - re-attaching listeners');
      }
      document.removeEventListener('click', handleRealClick, false);
      document.removeEventListener('click', handleBridgeClick, true);
      document.removeEventListener('touchend', handleBridgeClick, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.addEventListener('click', handleRealClick, false);
      document.addEventListener('click', handleBridgeClick, true);
      document.addEventListener('touchend', handleBridgeClick, true);
      document.addEventListener('pointerdown', handlePointerDown, true);
      document.addEventListener('pointerup', handlePointerUp, true);
    }
  });
}

if (typeof window !== 'undefined') {
  initializeBridge();
}
