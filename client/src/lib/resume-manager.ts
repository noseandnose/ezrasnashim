/**
 * ResumeManager - Handles app resume from background in FlutterFlow WebView
 * 
 * Problem: After background → foreground, pressed states appear but actions don't fire.
 * Root causes:
 * 1. pointerup/click events don't fire after WebView resume
 * 2. Invisible overlays/backdrops blocking pointer events
 * 3. Stale interaction state from before backgrounding
 * 
 * Solution: Reset all interaction state and ensure DOM is clean on resume.
 */

let isInitialized = false;
let lastHiddenTime = 0;
const STALE_THRESHOLD_MS = 2000; // Consider state stale after 2 seconds in background

// Track resume state
let isInRecoveryMode = false;

// Global interaction state that needs to be reset
interface InteractionState {
  isPressing: boolean;
  isDragging: boolean;
  isScrolling: boolean;
  activePointerId: number | null;
}

const globalInteractionState: InteractionState = {
  isPressing: false,
  isDragging: false,
  isScrolling: false,
  activePointerId: null
};

// Export for components to check/set
export function getInteractionState() {
  return globalInteractionState;
}

export function setInteractionState(updates: Partial<InteractionState>) {
  Object.assign(globalInteractionState, updates);
}

export function resetInteractionState() {
  globalInteractionState.isPressing = false;
  globalInteractionState.isDragging = false;
  globalInteractionState.isScrolling = false;
  globalInteractionState.activePointerId = null;
}

/**
 * Clear any stuck pointer captures
 */
function releasePointerCaptures() {
  try {
    document.querySelectorAll('[data-pointer-captured]').forEach(el => {
      (el as HTMLElement).releasePointerCapture?.(globalInteractionState.activePointerId || 0);
      el.removeAttribute('data-pointer-captured');
    });
  } catch (e) {
    // Ignore errors - pointer may already be released
  }
}

/**
 * Fix DOM/CSS blockers that prevent pointer events
 */
function fixPointerEventBlockers() {
  // 1. Ensure body/html pointer-events is not none
  if (document.body.style.pointerEvents === 'none') {
    document.body.style.pointerEvents = '';
  }
  if (document.documentElement.style.pointerEvents === 'none') {
    document.documentElement.style.pointerEvents = '';
  }
  
  // 2. Check main content container
  const mainContent = document.querySelector('main');
  if (mainContent && (mainContent as HTMLElement).style.pointerEvents === 'none') {
    (mainContent as HTMLElement).style.pointerEvents = '';
  }
  
  // 3. Find all overlays/backdrops and ensure hidden ones don't block
  const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-backdrop], .backdrop, [class*="overlay"]');
  overlays.forEach(overlay => {
    const el = overlay as HTMLElement;
    const computedStyle = window.getComputedStyle(el);
    const isHidden = computedStyle.opacity === '0' || 
                     computedStyle.visibility === 'hidden' || 
                     computedStyle.display === 'none' ||
                     el.getAttribute('data-state') === 'closed';
    
    if (isHidden && computedStyle.pointerEvents !== 'none') {
      el.style.pointerEvents = 'none';
    }
  });
  
  // 4. Remove orphaned Radix elements that are in closed state
  document.querySelectorAll('[data-radix-dialog-overlay][data-state="closed"]').forEach(el => {
    el.remove();
  });
  
  document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach(wrapper => {
    const content = wrapper.querySelector('[data-state]');
    if (content?.getAttribute('data-state') === 'closed') {
      wrapper.remove();
    }
  });
  
  // 5. Remove orphaned focus guards when no open dialogs exist
  const hasOpenDialogs = document.querySelector('[data-state="open"]');
  if (!hasOpenDialogs) {
    document.querySelectorAll('[data-radix-focus-guard]').forEach(el => el.remove());
  }
}

/**
 * Fix scroll-lock consistency
 * Ensure overflow:hidden matches actual modal state
 */
function fixScrollLockState() {
  const hasOpenModals = document.querySelector('[data-fullscreen-modal]') || 
                        document.querySelector('[role="dialog"][data-state="open"]');
  
  if (!hasOpenModals) {
    // No modals open - ensure scroll is not locked
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Also check scroll container
    const scrollContainer = document.querySelector('[data-scroll-lock-target]') as HTMLElement 
      ?? document.querySelector('.content-area') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.style.overflow = '';
    }
  }
}

/**
 * Clear any stuck focus that might block events
 */
function clearStuckFocus() {
  if (document.activeElement && document.activeElement !== document.body) {
    try {
      (document.activeElement as HTMLElement).blur?.();
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Force re-arm event listeners by dispatching synthetic events
 * This helps "wake up" React's event system in WebViews
 */
function rearmEventListeners() {
  // 1. Dispatch pointer event to wake up pointer event system
  try {
    const pointerEvent = new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      clientX: -9999,
      clientY: -9999,
      pointerId: 1,
      pointerType: 'touch'
    });
    document.body.dispatchEvent(pointerEvent);
  } catch (e) {
    // Fallback for browsers that don't support PointerEvent constructor
  }
  
  // 2. Dispatch touch event to wake up touch event system
  try {
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: []
    });
    document.body.dispatchEvent(touchEvent);
    
    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: []
    });
    document.body.dispatchEvent(touchEndEvent);
  } catch (e) {
    // TouchEvent constructor not supported
  }
  
  // 3. Force React to re-render by triggering a resize event
  // This often causes components to update their state
  try {
    window.dispatchEvent(new Event('resize'));
  } catch (e) {
    // Ignore
  }
}

/**
 * Force all interactive elements to be re-clickable
 * by briefly disabling and re-enabling pointer events
 */
function resetPointerEventsOnInteractives() {
  const interactives = document.querySelectorAll('button, a, [role="button"], [onclick], [data-testid]');
  interactives.forEach(el => {
    const htmlEl = el as HTMLElement;
    const original = htmlEl.style.pointerEvents;
    htmlEl.style.pointerEvents = 'none';
    requestAnimationFrame(() => {
      htmlEl.style.pointerEvents = original || '';
    });
  });
}

/**
 * Install native click listeners as a fallback for React events
 * These use capture phase to intercept events before React's delegation
 */
function installNativeClickRecovery() {
  if (isInRecoveryMode) return;
  isInRecoveryMode = true;
  
  // Add a one-time capture-phase listener that helps "wake up" the event system
  const recoveryHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    
    // If the target is a button or interactive element, try to help React handle it
    if (target.matches('button, a, [role="button"], [data-testid]')) {
      // Force a reflow to ensure the element is properly in the DOM
      void target.offsetHeight;
      
      // If the element has a data-modal-type, try to trigger the modal opening manually
      const modalType = target.getAttribute('data-modal-type');
      const modalSection = target.getAttribute('data-modal-section');
      if (modalType && modalSection) {
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('force-modal-open', {
          detail: { modalType, modalSection }
        }));
      }
    }
    
    // Remove after first successful interaction
    document.removeEventListener('click', recoveryHandler, true);
    document.removeEventListener('touchend', recoveryHandler, true);
    isInRecoveryMode = false;
  };
  
  // Use capture phase to get events before React's delegation
  document.addEventListener('click', recoveryHandler, true);
  document.addEventListener('touchend', recoveryHandler, true);
  
  // Auto-remove after 10 seconds if no interaction
  setTimeout(() => {
    document.removeEventListener('click', recoveryHandler, true);
    document.removeEventListener('touchend', recoveryHandler, true);
    isInRecoveryMode = false;
  }, 10000);
}

/**
 * Main resume handler - called when app returns from background
 */
function handleResume() {
  const timeInBackground = lastHiddenTime > 0 ? Date.now() - lastHiddenTime : 0;
  
  // Only do full reset if was in background for significant time
  if (timeInBackground > STALE_THRESHOLD_MS) {
    // Phase 1: Reset interaction state
    resetInteractionState();
    releasePointerCaptures();
    
    // Phase 2: Fix DOM/CSS blockers
    fixPointerEventBlockers();
    fixScrollLockState();
    
    // Phase 3: Clear stuck focus
    clearStuckFocus();
    
    // Phase 4: Re-arm event listeners
    rearmEventListeners();
    
    // Phase 5: Reset pointer events on all interactives to ensure they're clickable
    resetPointerEventsOnInteractives();
    
    // Phase 6: Install native click recovery as fallback
    installNativeClickRecovery();
    
    // Dispatch custom event for components that need to know about resume
    window.dispatchEvent(new CustomEvent('app-resume', { 
      detail: { timeInBackground } 
    }));
    
    // Phase 7: Last resort - if was in background for very long (>30s), 
    // there's a higher chance the JS engine is in a bad state
    // Schedule a delayed check and soft-reload if needed
    if (timeInBackground > 30000) {
      setTimeout(() => {
        // Check if any interaction has happened since resume
        // If not, the app might truly be stuck - offer a refresh
        if (isInRecoveryMode) {
          // Still in recovery mode after 5 seconds = likely stuck
          window.location.reload();
        }
      }, 5000);
    }
  }
}

/**
 * Track when app goes to background
 */
function handleHidden() {
  lastHiddenTime = Date.now();
  
  // Pre-emptively reset interaction state when going to background
  resetInteractionState();
}

/**
 * Dead-click detection: If user taps but nothing responds, reload
 * This is the nuclear option when all other recovery fails
 */
let deadClickCount = 0;
let lastClickHandledTime = 0;
let deadClickCheckEnabled = false;

function enableDeadClickDetection() {
  if (deadClickCheckEnabled) return;
  deadClickCheckEnabled = true;
  deadClickCount = 0;
  
  const clickHandler = () => {
    // A click was detected by native listener
    // If React handlers are working, they should set lastClickHandledTime
    // We'll check in 100ms if any React handler responded
    setTimeout(() => {
      // If no React handler ran in the last 100ms, this might be a dead click
      if (Date.now() - lastClickHandledTime > 100) {
        deadClickCount++;
        
        // After 3 dead clicks in a row, reload
        if (deadClickCount >= 3) {
          window.location.reload();
        }
      } else {
        // Reset dead click counter on successful interaction
        deadClickCount = 0;
        disableDeadClickDetection();
      }
    }, 100);
  };
  
  document.addEventListener('click', clickHandler, { capture: true, passive: true });
  
  // Store handler for cleanup
  (window as any).__deadClickHandler = clickHandler;
  
  // Auto-disable after 30 seconds
  setTimeout(disableDeadClickDetection, 30000);
}

function disableDeadClickDetection() {
  if (!deadClickCheckEnabled) return;
  deadClickCheckEnabled = false;
  
  const handler = (window as any).__deadClickHandler;
  if (handler) {
    document.removeEventListener('click', handler, { capture: true });
    delete (window as any).__deadClickHandler;
  }
}

// Export for components to call when they handle clicks
export function markClickHandled() {
  lastClickHandledTime = Date.now();
  deadClickCount = 0;
}

/**
 * Initialize the ResumeManager
 * Should be called once at app startup
 */
export function initResumeManager() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  
  // Handle visibility change (most reliable)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleHidden();
    } else if (document.visibilityState === 'visible') {
      // Small delay to let WebView fully resume
      setTimeout(() => {
        handleResume();
        // Enable dead-click detection as a fallback
        enableDeadClickDetection();
      }, 50);
    }
  });
  
  // Handle pageshow (for bfcache restoration)
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (e.persisted) {
      // Page restored from bfcache
      setTimeout(() => {
        handleResume();
        enableDeadClickDetection();
      }, 50);
    }
  });
  
  // Handle focus (additional fallback)
  window.addEventListener('focus', () => {
    // Only handle if we were hidden
    if (lastHiddenTime > 0) {
      setTimeout(() => {
        handleResume();
        enableDeadClickDetection();
      }, 100);
    }
  });
  
  // Listen for custom recovery event (from fullscreen-modal.tsx)
  window.addEventListener('webview-resume-recovery', () => {
    handleResume();
  });
  
  // Also mark clicks as handled when any React onClick fires
  // This is done by adding a capture-phase listener that tracks if events bubble properly
  document.addEventListener('click', () => {
    // If this fires, the event system is working
    markClickHandled();
  }, { passive: true });
}

/**
 * Manually trigger resume recovery
 * Can be called from components if they detect stuck state
 */
export function forceResumeRecovery() {
  handleResume();
}
