/**
 * Click Synthesis for FlutterFlow WebView Resume
 * 
 * Problem: After FlutterFlow WebView resume, touchend events fire but don't 
 * promote to click events, breaking React's event delegation.
 * 
 * Solution: On visibility resume, add a temporary touchend listener that
 * synthesizes click events when native clicks aren't happening. This preserves
 * app state (audio, scroll position) unlike full page reload.
 */

let synthesisActive = false;
let lastClickTimestamp = 0;
let synthesisTimeout: number | null = null;

const SYNTHESIS_DURATION_MS = 10000; // How long to keep synthesis active after resume
const CLICK_DELAY_THRESHOLD_MS = 100; // If click doesn't follow touchend within this, synthesize

/**
 * Initialize click synthesis for FlutterFlow WebView
 * Call this once on app startup
 */
export function initializeClickSynthesis() {
  if (typeof window === 'undefined') return;
  
  const isDebugMode = localStorage.getItem('debugClickSynthesis') === 'true';
  
  // Check if we're on a mobile device
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
  
  if (!isMobile) {
    if (isDebugMode) {
      console.log('[Click Synthesis] Not a mobile device, skipping initialization');
    }
    return;
  }
  
  if (isDebugMode) {
    console.log('[Click Synthesis] Initializing for mobile device');
  }
  
  // Track when we receive natural click events
  document.addEventListener('click', () => {
    lastClickTimestamp = Date.now();
  }, true);
  
  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (isDebugMode) {
        console.log('[Click Synthesis] App resumed, activating synthesis mode');
      }
      activateSynthesis();
    } else {
      deactivateSynthesis();
    }
  });
  
  // Also handle pageshow for iOS back/forward cache
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      if (isDebugMode) {
        console.log('[Click Synthesis] Page restored from cache, activating synthesis');
      }
      activateSynthesis();
    }
  });
}

/**
 * Activate click synthesis mode
 * This adds handlers that will synthesize clicks if native ones aren't firing
 */
function activateSynthesis() {
  if (synthesisActive) return;
  
  synthesisActive = true;
  const isDebugMode = localStorage.getItem('debugClickSynthesis') === 'true';
  
  // Clear any existing timeout
  if (synthesisTimeout) {
    clearTimeout(synthesisTimeout);
  }
  
  // Set up the synthesis handler
  const handleTouchEnd = (e: TouchEvent) => {
    if (!synthesisActive) return;
    
    const target = e.target as HTMLElement;
    
    if (!target || !isInteractiveElement(target)) {
      return;
    }
    
    // Wait a short time to see if a natural click follows
    setTimeout(() => {
      // If no click happened after our touch, the click was swallowed
      if (Date.now() - lastClickTimestamp > CLICK_DELAY_THRESHOLD_MS) {
        if (isDebugMode) {
          console.log('[Click Synthesis] No native click detected, synthesizing for:', target.tagName, target.className);
        }
        synthesizeClick(target, e);
      } else {
        if (isDebugMode) {
          console.log('[Click Synthesis] Native click detected, no synthesis needed');
        }
        // Native clicks are working, we can deactivate early
        deactivateSynthesis();
      }
    }, CLICK_DELAY_THRESHOLD_MS);
  };
  
  document.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });
  
  // Store handler reference for cleanup
  (window as any).__clickSynthesisHandler = handleTouchEnd;
  
  // Auto-deactivate after timeout (native clicks should be working by then)
  synthesisTimeout = window.setTimeout(() => {
    if (isDebugMode) {
      console.log('[Click Synthesis] Timeout reached, deactivating');
    }
    deactivateSynthesis();
  }, SYNTHESIS_DURATION_MS);
}

/**
 * Deactivate click synthesis mode
 */
function deactivateSynthesis() {
  if (!synthesisActive) return;
  
  synthesisActive = false;
  
  const handler = (window as any).__clickSynthesisHandler;
  if (handler) {
    document.removeEventListener('touchend', handler, { capture: true } as any);
    delete (window as any).__clickSynthesisHandler;
  }
  
  if (synthesisTimeout) {
    clearTimeout(synthesisTimeout);
    synthesisTimeout = null;
  }
}

/**
 * Check if an element or its ancestors are interactive
 */
function isInteractiveElement(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    const tagName = current.tagName.toLowerCase();
    
    // Check for interactive elements
    if (tagName === 'button' || 
        tagName === 'a' || 
        tagName === 'input' ||
        tagName === 'select' ||
        tagName === 'textarea') {
      return true;
    }
    
    // Check for role="button" or tabindex
    if (current.getAttribute('role') === 'button' ||
        current.getAttribute('tabindex') !== null) {
      return true;
    }
    
    // Check for onClick handler (React sets these as properties)
    if (current.onclick || 
        current.hasAttribute('data-action') ||
        current.hasAttribute('data-testid')) {
      return true;
    }
    
    // Check for pointer cursor (indicates clickable)
    const style = window.getComputedStyle(current);
    if (style.cursor === 'pointer') {
      return true;
    }
    
    current = current.parentElement;
  }
  
  return false;
}

/**
 * Synthesize a click event on the target element
 */
function synthesizeClick(target: HTMLElement, originalEvent: TouchEvent) {
  const isDebugMode = localStorage.getItem('debugClickSynthesis') === 'true';
  
  // Find the actual clickable element (might be a parent)
  let clickTarget = findClickableAncestor(target);
  
  if (!clickTarget) {
    if (isDebugMode) {
      console.log('[Click Synthesis] No clickable ancestor found');
    }
    return;
  }
  
  // Get touch coordinates
  const touch = originalEvent.changedTouches?.[0];
  const clientX = touch?.clientX ?? 0;
  const clientY = touch?.clientY ?? 0;
  
  // Method 1: Try direct click() call (most reliable for React)
  try {
    clickTarget.click();
    if (isDebugMode) {
      console.log('[Click Synthesis] Called click() on:', clickTarget.tagName);
    }
    return;
  } catch (e) {
    if (isDebugMode) {
      console.log('[Click Synthesis] click() failed, trying MouseEvent');
    }
  }
  
  // Method 2: Dispatch synthetic MouseEvent
  try {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX,
      clientY,
      screenX: touch?.screenX ?? 0,
      screenY: touch?.screenY ?? 0
    });
    
    clickTarget.dispatchEvent(clickEvent);
    if (isDebugMode) {
      console.log('[Click Synthesis] Dispatched synthetic click event');
    }
  } catch (e) {
    if (isDebugMode) {
      console.error('[Click Synthesis] Failed to dispatch click:', e);
    }
  }
}

/**
 * Find the nearest clickable ancestor element
 */
function findClickableAncestor(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    const tagName = current.tagName.toLowerCase();
    
    // Priority: buttons, links, and elements with data-action
    if (tagName === 'button' || tagName === 'a') {
      return current;
    }
    
    if (current.hasAttribute('data-action')) {
      return current;
    }
    
    if (current.getAttribute('role') === 'button') {
      return current;
    }
    
    // Check for onClick or tabindex
    if (current.onclick || current.getAttribute('tabindex') !== null) {
      return current;
    }
    
    current = current.parentElement;
  }
  
  // Fallback to original element if nothing better found
  return element;
}
