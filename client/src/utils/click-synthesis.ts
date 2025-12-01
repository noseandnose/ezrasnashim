/**
 * Click Synthesis for FlutterFlow WebView Resume
 * 
 * Problem: After FlutterFlow WebView resume, touchend events fire but don't 
 * promote to click events, breaking React's event delegation.
 * 
 * Solution: On visibility resume, add a touchend listener that synthesizes 
 * click events when native clicks aren't happening. This preserves app state
 * (audio, scroll position) unlike full page reload.
 * 
 * Key behavior: Synthesis stays active until multiple consecutive native clicks
 * are observed, ensuring the UI remains responsive even if the user waits
 * before interacting.
 */

let synthesisActive = false;
let lastClickTimestamp = 0;
let consecutiveNativeClicks = 0;
let synthesisHandler: ((e: TouchEvent) => void) | null = null;

const CLICK_DELAY_THRESHOLD_MS = 100; // If click doesn't follow touchend within this, synthesize
const NATIVE_CLICKS_TO_DEACTIVATE = 3; // Require multiple native clicks before deactivating

/**
 * Initialize click synthesis for FlutterFlow WebView
 * Call this once on app startup
 */
export function initializeClickSynthesis() {
  if (typeof window === 'undefined') return;
  
  const isDebugMode = () => localStorage.getItem('debugClickSynthesis') === 'true';
  
  // Check if we're on a mobile device
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
  
  if (!isMobile) {
    if (isDebugMode()) {
      console.log('[Click Synthesis] Not a mobile device, skipping initialization');
    }
    return;
  }
  
  if (isDebugMode()) {
    console.log('[Click Synthesis] Initializing for mobile device');
  }
  
  // Track when we receive natural click events
  document.addEventListener('click', () => {
    lastClickTimestamp = Date.now();
    
    // Count consecutive native clicks when synthesis is active
    if (synthesisActive) {
      consecutiveNativeClicks++;
      if (isDebugMode()) {
        console.log('[Click Synthesis] Native click detected, count:', consecutiveNativeClicks);
      }
      
      // Deactivate after enough consecutive native clicks confirm it's working
      if (consecutiveNativeClicks >= NATIVE_CLICKS_TO_DEACTIVATE) {
        if (isDebugMode()) {
          console.log('[Click Synthesis] Native clicks restored, deactivating synthesis');
        }
        deactivateSynthesis();
      }
    }
  }, true);
  
  // Handle visibility changes - activate on resume
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (isDebugMode()) {
        console.log('[Click Synthesis] App resumed, activating synthesis mode');
      }
      activateSynthesis();
    }
    // Note: Don't deactivate when hiding - let it stay ready for resume
  });
  
  // Also handle pageshow for iOS back/forward cache
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      if (isDebugMode()) {
        console.log('[Click Synthesis] Page restored from cache, activating synthesis');
      }
      activateSynthesis();
    }
  });
}

/**
 * Activate click synthesis mode
 * Stays active until native clicks are confirmed working
 */
function activateSynthesis() {
  if (synthesisActive) return;
  
  synthesisActive = true;
  consecutiveNativeClicks = 0; // Reset counter on each activation
  
  const isDebugMode = () => localStorage.getItem('debugClickSynthesis') === 'true';
  
  // Set up the synthesis handler
  const handleTouchEnd = (e: TouchEvent) => {
    if (!synthesisActive) return;
    
    const target = e.target as HTMLElement;
    
    if (!target || !isInteractiveElement(target)) {
      return;
    }
    
    const touchTimestamp = Date.now();
    
    // Wait a short time to see if a natural click follows
    setTimeout(() => {
      // Only synthesize if no click happened after our touch
      if (lastClickTimestamp < touchTimestamp) {
        if (isDebugMode()) {
          console.log('[Click Synthesis] No native click detected, synthesizing for:', 
            target.tagName, target.className?.substring(0, 50));
        }
        consecutiveNativeClicks = 0; // Reset - native clicks aren't working
        synthesizeClick(target, e);
      }
      // If native click happened, the click listener will handle counting
    }, CLICK_DELAY_THRESHOLD_MS);
  };
  
  synthesisHandler = handleTouchEnd;
  document.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });
  
  if (isDebugMode()) {
    console.log('[Click Synthesis] Synthesis mode activated');
  }
}

/**
 * Deactivate click synthesis mode
 * Only called when native clicks are confirmed working
 */
function deactivateSynthesis() {
  if (!synthesisActive) return;
  
  synthesisActive = false;
  
  if (synthesisHandler) {
    document.removeEventListener('touchend', synthesisHandler, { capture: true } as EventListenerOptions);
    synthesisHandler = null;
  }
  
  const isDebugMode = () => localStorage.getItem('debugClickSynthesis') === 'true';
  if (isDebugMode()) {
    console.log('[Click Synthesis] Synthesis mode deactivated');
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
  const isDebugMode = () => localStorage.getItem('debugClickSynthesis') === 'true';
  
  // Find the actual clickable element (might be a parent)
  const clickTarget = findClickableAncestor(target);
  
  if (!clickTarget) {
    if (isDebugMode()) {
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
    if (isDebugMode()) {
      console.log('[Click Synthesis] Called click() on:', clickTarget.tagName);
    }
    return;
  } catch (e) {
    if (isDebugMode()) {
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
    if (isDebugMode()) {
      console.log('[Click Synthesis] Dispatched synthetic click event');
    }
  } catch (e) {
    if (isDebugMode()) {
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
