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
 * Force re-arm event listeners by dispatching a synthetic event
 * This helps "wake up" React's event system in WebViews
 */
function rearmEventListeners() {
  // Dispatch a pointer event to wake up the event system
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
    
    // Dispatch custom event for components that need to know about resume
    window.dispatchEvent(new CustomEvent('app-resume', { 
      detail: { timeInBackground } 
    }));
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
      setTimeout(handleResume, 50);
    }
  });
  
  // Handle pageshow (for bfcache restoration)
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (e.persisted) {
      // Page restored from bfcache
      setTimeout(handleResume, 50);
    }
  });
  
  // Handle focus (additional fallback)
  window.addEventListener('focus', () => {
    // Only handle if we were hidden
    if (lastHiddenTime > 0) {
      setTimeout(handleResume, 100);
    }
  });
  
  // Listen for custom recovery event (from fullscreen-modal.tsx)
  window.addEventListener('webview-resume-recovery', () => {
    handleResume();
  });
}

/**
 * Manually trigger resume recovery
 * Can be called from components if they detect stuck state
 */
export function forceResumeRecovery() {
  handleResume();
}
