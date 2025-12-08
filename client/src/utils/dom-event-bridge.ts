/**
 * DOM Event Bridge - Resilient click handler for FlutterFlow WebView
 * 
 * Problem: FlutterFlow occasionally breaks React's event delegation during background/resume.
 * 
 * Solution: Direct handler invocation via WeakMap, with synthetic click fallback for unregistered elements.
 * Fixes: Proper cleanup, no dedup window that drops clicks, proper event objects.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useModalStore } from '@/lib/types';

type ClickHandler = (event?: any) => void;
type ModalOpener = (modalType: string, section: string, vortId?: number) => void;

// WeakMap stores handlers - auto-cleans when elements are garbage collected
const clickHandlerRegistry = new WeakMap<HTMLElement, ClickHandler>();

// Flag to cancel the next native click (prevents click-through on collapse)
let cancelNextClick = false;

// Global modal opener - can be set externally for legacy compatibility
let globalModalOpenerFn: ModalOpener | null = null;

/**
 * Open a modal - uses global opener if set, otherwise falls back to Zustand getState()
 */
function openModal(modalType: string, section: string, vortId?: number) {
  if (globalModalOpenerFn) {
    globalModalOpenerFn(modalType, section, vortId);
  } else {
    const { openModal } = useModalStore.getState();
    openModal(modalType, section, undefined, vortId);
  }
}

/**
 * Create a proper synthetic event that tracks preventDefault calls
 */
function createSyntheticEvent(element: HTMLElement, pointerEvent: PointerEvent) {
  let _defaultPrevented = false;
  let _propagationStopped = false;
  
  return {
    get defaultPrevented() { return _defaultPrevented; },
    preventDefault() { _defaultPrevented = true; },
    stopPropagation() { _propagationStopped = true; },
    stopImmediatePropagation() { _propagationStopped = true; },
    persist() {}, // No-op for compatibility
    isPropagationStopped() { return _propagationStopped; },
    isDefaultPrevented() { return _defaultPrevented; },
    target: element,
    currentTarget: element,
    nativeEvent: pointerEvent,
    clientX: pointerEvent.clientX,
    clientY: pointerEvent.clientY,
    pageX: pointerEvent.pageX,
    pageY: pointerEvent.pageY,
    screenX: pointerEvent.screenX,
    screenY: pointerEvent.screenY,
    type: 'click',
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: 1,
    detail: 1,
    eventPhase: 3, // AT_TARGET
    isTrusted: false,
    timeStamp: Date.now(),
  };
}

/**
 * Register an element's click handler for direct invocation.
 * Pass undefined to unregister.
 */
export function registerClickHandler(element: HTMLElement | null, handler: ClickHandler | undefined) {
  if (!element) return;
  
  if (handler) {
    clickHandlerRegistry.set(element, handler);
  } else {
    clickHandlerRegistry.delete(element);
  }
}

/**
 * Hook to register a button's onClick handler with the bridge.
 * Returns a ref callback that properly cleans up on unmount.
 */
export function useBridgeClick<T extends HTMLElement>(
  onClick: ((event: React.MouseEvent<T>) => void) | undefined
): React.RefCallback<T> {
  const handlerRef = useRef(onClick);
  const elementRef = useRef<T | null>(null);
  
  // Keep handler ref updated
  handlerRef.current = onClick;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        registerClickHandler(elementRef.current, undefined);
        elementRef.current = null;
      }
    };
  }, []);
  
  return useCallback((element: T | null) => {
    // Clean up previous element if different
    if (elementRef.current && elementRef.current !== element) {
      registerClickHandler(elementRef.current, undefined);
    }
    
    elementRef.current = element;
    
    if (element && handlerRef.current) {
      registerClickHandler(element, (event?: any) => {
        if (!(element as any).disabled) {
          handlerRef.current?.(event);
        }
      });
    }
  }, []);
}

/**
 * Set global modal opener - called from App.tsx for legacy compatibility
 */
export function setGlobalModalOpener(opener: ModalOpener) {
  globalModalOpenerFn = opener;
}

/**
 * Get global modal opener
 */
export function getGlobalModalOpener(): ModalOpener | null {
  return globalModalOpenerFn;
}

// Action handlers for data-action attribute system
type ActionHandler = (element: HTMLElement, event: MouseEvent | TouchEvent | PointerEvent) => void;
const actionHandlers = new Map<string, ActionHandler>();
const actionLastInvoked = new Map<string, number>();
const ACTION_DEDUP_MS = 50; // Prevent double-invocation within 50ms

export function registerAction(name: string, handler: ActionHandler) {
  actionHandlers.set(name, handler);
}

export function unregisterAction(name: string) {
  actionHandlers.delete(name);
}

/**
 * Hook to register a DOM bridge action
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

let bridgeInitialized = false;

// Interactive element selectors for fallback click dispatch
const INTERACTIVE_SELECTORS = 'button, a, input, select, textarea, [role="button"], [tabindex]';

function initializeBridge() {
  if (typeof window === 'undefined' || bridgeInitialized) return;
  bridgeInitialized = true;
  
  const isDebugMode = localStorage.getItem('debugDOMBridge') === 'true';
  
  if (isDebugMode) {
    console.log('[DOM Bridge] Initializing resilient click handler');
  }
  
  // Track pointer state
  let pointerDownTarget: HTMLElement | null = null;
  let pointerDownTime = 0;
  let pointerDownX = 0;
  let pointerDownY = 0;
  
  const TAP_THRESHOLD_MS = 500;
  const MOVEMENT_THRESHOLD = 15;
  
  // Simple scroll tracking
  let lastScrollTime = 0;
  const handleScroll = () => {
    lastScrollTime = Date.now();
  };
  
  const handlePointerDown = (e: PointerEvent) => {
    pointerDownTarget = e.target as HTMLElement;
    pointerDownTime = Date.now();
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
  };
  
  const handlePointerUp = (e: PointerEvent) => {
    if (!pointerDownTarget) return;
    
    const elapsed = Date.now() - pointerDownTime;
    const dx = Math.abs(e.clientX - pointerDownX);
    const dy = Math.abs(e.clientY - pointerDownY);
    const moved = Math.sqrt(dx * dx + dy * dy);
    const recentScroll = Date.now() - lastScrollTime < 200;
    
    // Reject if took too long, moved too much, or was scrolling
    if (elapsed > TAP_THRESHOLD_MS || moved > MOVEMENT_THRESHOLD || recentScroll) {
      if (isDebugMode && (moved > MOVEMENT_THRESHOLD || recentScroll)) {
        console.log('[DOM Bridge] Rejected as scroll/move gesture');
      }
      pointerDownTarget = null;
      return;
    }
    
    const target = pointerDownTarget;
    pointerDownTarget = null;
    
    // Check if tap ended on same element
    const upTarget = e.target as HTMLElement;
    const isSameElement = target === upTarget || 
                          target.contains(upTarget) || 
                          upTarget.contains(target);
    if (!isSameElement) return;
    
    // Walk up from target to find registered handler or modal trigger
    let current: HTMLElement | null = target;
    let handlerResult: ReturnType<typeof createSyntheticEvent> | null = null;
    
    while (current && current !== document.body) {
      // Check WeakMap for direct handler
      const handler = clickHandlerRegistry.get(current);
      if (handler) {
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking registered handler');
        }
        try {
          handlerResult = createSyntheticEvent(current, e);
          handler(handlerResult);
          // Cancel the next native click to prevent click-through on collapse
          cancelNextClick = true;
          // If handler called preventDefault, don't do fallback dispatch
          if (handlerResult.defaultPrevented) {
            return;
          }
        } catch (error) {
          console.error('[DOM Bridge] Handler error:', error);
        }
        return; // Handler was found and invoked
      }
      
      // Check for data-action attribute
      const action = current.getAttribute('data-action');
      if (action && actionHandlers.has(action)) {
        // Deduplicate: skip if same action was invoked very recently (prevents double-firing)
        const lastInvoked = actionLastInvoked.get(action) || 0;
        const now = Date.now();
        if (now - lastInvoked < ACTION_DEDUP_MS) {
          if (isDebugMode) {
            console.log('[DOM Bridge] Skipping duplicate action:', action);
          }
          return;
        }
        actionLastInvoked.set(action, now);
        
        if (isDebugMode) {
          console.log('[DOM Bridge] Invoking action:', action);
        }
        try {
          actionHandlers.get(action)!(current, e);
        } catch (error) {
          console.error('[DOM Bridge] Action error:', action, error);
        }
        return;
      }
      
      // Check for modal trigger
      const modalType = current.getAttribute('data-modal-type');
      if (modalType) {
        const section = current.getAttribute('data-modal-section') || 'home';
        const vortId = current.getAttribute('data-vort-id');
        if (isDebugMode) {
          console.log('[DOM Bridge] Opening modal:', modalType);
        }
        openModal(modalType, section, vortId ? parseInt(vortId) : undefined);
        return;
      }
      
      current = current.parentElement;
    }
    
    // FALLBACK: No registered handler found - dispatch synthetic click for unregistered elements
    // This ensures elements relying on React's normal delegation still work in FlutterFlow
    const interactiveElement = target.closest(INTERACTIVE_SELECTORS) as HTMLElement | null;
    if (interactiveElement && !(interactiveElement as any).disabled) {
      if (isDebugMode) {
        console.log('[DOM Bridge] Dispatching synthetic click on:', interactiveElement.tagName);
      }
      
      // Focus first (some elements need this)
      try {
        interactiveElement.focus();
      } catch (err) {
        // Ignore focus errors
      }
      
      // Dispatch synthetic click event
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
      interactiveElement.dispatchEvent(clickEvent);
    }
  };
  
  // Click capture listener to cancel click-through when handler was invoked
  const handleClickCapture = (e: MouseEvent) => {
    if (cancelNextClick) {
      cancelNextClick = false;
      e.stopPropagation();
      e.preventDefault();
      if (isDebugMode) {
        console.log('[DOM Bridge] Cancelled click-through');
      }
    }
  };
  
  // Attach with capture phase
  document.addEventListener('click', handleClickCapture, { capture: true });
  document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
  document.addEventListener('pointerup', handlePointerUp, { capture: true, passive: true });
  document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Reset state on visibility change (app resume)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pointerDownTarget = null;
      if (isDebugMode) {
        console.log('[DOM Bridge] Reset state on resume');
      }
    }
  });
}

// Initialize on load
if (typeof window !== 'undefined') {
  initializeBridge();
}
