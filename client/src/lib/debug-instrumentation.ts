/**
 * Debug Instrumentation for Mobile WebView Performance Issues
 * 
 * Enables via URL parameter: ?debug=ui
 * 
 * Features:
 * - UI responsiveness watchdog (detects frozen UI)
 * - Pointer event logging (detects click-blocking overlays)
 * - Lifecycle event logging (visibilitychange, pageshow, etc.)
 * - Long task detection via PerformanceObserver
 * - Modal state tracking
 */

// Check if debug mode is enabled
const urlParams = new URLSearchParams(window.location.search);
export const DEBUG_UI = urlParams.get('debug') === 'ui' || urlParams.get('debug') === 'all';
export const DEBUG_COMPASS = urlParams.get('debug') === 'compass' || urlParams.get('debug') === 'all';
export const DEBUG_LIFECYCLE = urlParams.get('debug') === 'lifecycle' || urlParams.get('debug') === 'all';

// Prefix for all debug logs
const LOG_PREFIX = '[UIDebug]';

// Log helper that only logs in debug mode
export function debugLog(category: string, message: string, data?: any) {
  if (!DEBUG_UI && !DEBUG_LIFECYCLE) return;
  
  const timestamp = new Date().toISOString().split('T')[1];
  if (data !== undefined) {
    console.log(`${LOG_PREFIX} [${timestamp}] [${category}] ${message}`, data);
  } else {
    console.log(`${LOG_PREFIX} [${timestamp}] [${category}] ${message}`);
  }
}

// Track active overlays/modals for debugging
interface OverlayState {
  element: HTMLElement;
  zIndex: number;
  pointerEvents: string;
  timestamp: number;
}

let activeOverlays: Map<HTMLElement, OverlayState> = new Map();
let watchdogInterval: ReturnType<typeof setInterval> | null = null;
let lastClickTimestamp = 0;

// Initialize the debug instrumentation
export function initDebugInstrumentation() {
  if (!DEBUG_UI && !DEBUG_LIFECYCLE) {
    return;
  }
  
  console.log(`${LOG_PREFIX} Debug instrumentation ENABLED`);
  console.log(`${LOG_PREFIX} - UI debug: ${DEBUG_UI}`);
  console.log(`${LOG_PREFIX} - Lifecycle debug: ${DEBUG_LIFECYCLE}`);
  
  if (DEBUG_LIFECYCLE) {
    initLifecycleLogging();
  }
  
  if (DEBUG_UI) {
    initPointerEventLogging();
    initLongTaskObserver();
    initUIWatchdog();
    initOverlayMonitor();
    exposeDebugFunctions();
  }
}

// Log lifecycle events
function initLifecycleLogging() {
  document.addEventListener('visibilitychange', () => {
    debugLog('LIFECYCLE', `visibilitychange: ${document.visibilityState}`);
  });
  
  window.addEventListener('pageshow', (e) => {
    debugLog('LIFECYCLE', `pageshow: persisted=${e.persisted}`);
  });
  
  window.addEventListener('pagehide', () => {
    debugLog('LIFECYCLE', 'pagehide');
  });
  
  window.addEventListener('focus', () => {
    debugLog('LIFECYCLE', 'window focus');
  });
  
  window.addEventListener('blur', () => {
    debugLog('LIFECYCLE', 'window blur');
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    debugLog('ERROR', `Unhandled promise rejection: ${e.reason}`, e.reason);
  });
  
  window.addEventListener('error', (e) => {
    debugLog('ERROR', `Global error: ${e.message}`, { filename: e.filename, lineno: e.lineno });
  });
  
  // Custom event for webview recovery
  window.addEventListener('webview-resume-recovery', () => {
    debugLog('LIFECYCLE', 'webview-resume-recovery event fired');
  });
}

// Log pointer/touch events to detect blocking overlays
function initPointerEventLogging() {
  let lastPointerTarget: Element | null = null;
  
  document.addEventListener('pointerdown', (e) => {
    lastPointerTarget = e.target as Element;
    debugLog('POINTER', `pointerdown on ${getElementDescription(e.target as Element)}`, {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType
    });
  }, { capture: true });
  
  document.addEventListener('click', (e) => {
    lastClickTimestamp = Date.now();
    const target = e.target as Element;
    const targetDesc = getElementDescription(target);
    
    // Check if click landed on expected target
    if (lastPointerTarget && lastPointerTarget !== target) {
      debugLog('POINTER', `click target mismatch! pointerdown on ${getElementDescription(lastPointerTarget)}, click on ${targetDesc}`);
    }
    
    debugLog('POINTER', `click on ${targetDesc}`, {
      x: e.clientX,
      y: e.clientY,
      defaultPrevented: e.defaultPrevented
    });
    
    // Check for blocking overlay at this position
    checkForBlockingOverlay(e.clientX, e.clientY);
  }, { capture: true });
  
  // Detect touch events that don't result in clicks (possible blocking)
  let touchStartTime = 0;
  document.addEventListener('touchstart', () => {
    touchStartTime = Date.now();
  }, { passive: true, capture: true });
  
  document.addEventListener('touchend', () => {
    const touchDuration = Date.now() - touchStartTime;
    // If touch was short and no click followed within 300ms, might be blocked
    setTimeout(() => {
      if (touchDuration < 300 && Date.now() - lastClickTimestamp > 400) {
        debugLog('POINTER', 'Touch detected but no click followed - possible blocking overlay');
      }
    }, 400);
  }, { passive: true, capture: true });
}

// Check what element is at a specific point
function checkForBlockingOverlay(x: number, y: number) {
  const elements = document.elementsFromPoint(x, y);
  const topElement = elements[0];
  
  if (!topElement) return;
  
  const style = window.getComputedStyle(topElement);
  const zIndex = style.zIndex;
  const pointerEvents = style.pointerEvents;
  
  // Check if there's a high z-index overlay blocking
  if (zIndex !== 'auto' && parseInt(zIndex) > 1000) {
    debugLog('OVERLAY', `High z-index element at click point: ${getElementDescription(topElement)}`, {
      zIndex,
      pointerEvents,
      classes: topElement.className
    });
  }
  
  // List all elements with pointer-events:auto at this point
  const blockingElements = elements.filter(el => {
    const s = window.getComputedStyle(el);
    return s.pointerEvents === 'auto' && s.position === 'fixed';
  });
  
  if (blockingElements.length > 1) {
    debugLog('OVERLAY', `${blockingElements.length} fixed elements with pointer-events:auto at click point`);
  }
}

// Detect long tasks that might freeze UI
function initLongTaskObserver() {
  if (!('PerformanceObserver' in window)) {
    debugLog('INIT', 'PerformanceObserver not supported');
    return;
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as any).duration > 50) {
          debugLog('LONGTASK', `Long task detected: ${Math.round((entry as any).duration)}ms`, {
            name: entry.name,
            startTime: entry.startTime
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    debugLog('INIT', 'Long task observer started');
  } catch (e) {
    debugLog('INIT', 'Long task observer not supported in this browser');
  }
}

// Watchdog that periodically checks if UI is responsive
function initUIWatchdog() {
  let watchdogFailures = 0;
  
  watchdogInterval = setInterval(() => {
    // Create an invisible button and try to click it
    const testBtn = document.createElement('button');
    testBtn.style.cssText = 'position:fixed;top:-100px;left:-100px;width:1px;height:1px;opacity:0;pointer-events:none;';
    testBtn.id = '__ui_watchdog_test';
    
    let clickFired = false;
    testBtn.addEventListener('click', () => {
      clickFired = true;
      watchdogFailures = 0;
    });
    
    document.body.appendChild(testBtn);
    
    // Dispatch a synthetic click
    try {
      testBtn.style.pointerEvents = 'auto';
      testBtn.click();
    } catch (e) {
      debugLog('WATCHDOG', 'Error dispatching synthetic click', e);
    }
    
    // Check result after a short delay
    setTimeout(() => {
      testBtn.remove();
      
      if (!clickFired) {
        watchdogFailures++;
        debugLog('WATCHDOG', `Click handler failed (failure #${watchdogFailures})`);
        
        if (watchdogFailures >= 3) {
          debugLog('WATCHDOG', 'CRITICAL: UI appears frozen - 3 consecutive watchdog failures');
          logCurrentOverlayState();
        }
      }
    }, 100);
  }, 5000); // Check every 5 seconds
  
  debugLog('INIT', 'UI watchdog started');
}

// Monitor for stale overlays
function initOverlayMonitor() {
  const overlaySelectors = [
    '[data-fullscreen-modal]',
    '[data-radix-dialog-overlay]',
    '[data-radix-popper-content-wrapper]',
    '[role="dialog"]',
    '.fixed[style*="z-index"]'
  ];
  
  // Check for overlays periodically
  setInterval(() => {
    const overlays = document.querySelectorAll(overlaySelectors.join(', '));
    
    overlays.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);
      
      if (style.pointerEvents === 'auto' && style.visibility !== 'hidden') {
        if (!activeOverlays.has(htmlEl)) {
          activeOverlays.set(htmlEl, {
            element: htmlEl,
            zIndex: parseInt(style.zIndex) || 0,
            pointerEvents: style.pointerEvents,
            timestamp: Date.now()
          });
          debugLog('OVERLAY', `New overlay detected: ${getElementDescription(htmlEl)}`);
        }
      }
    });
    
    // Check for stale overlays (been around for more than 30 seconds without being a fullscreen modal)
    const now = Date.now();
    activeOverlays.forEach((state, el) => {
      if (!document.body.contains(el)) {
        activeOverlays.delete(el);
        debugLog('OVERLAY', `Overlay removed: ${getElementDescription(el)}`);
      } else if (now - state.timestamp > 30000 && !el.hasAttribute('data-fullscreen-modal')) {
        debugLog('OVERLAY', `STALE overlay warning: ${getElementDescription(el)} has been active for ${Math.round((now - state.timestamp) / 1000)}s`);
      }
    });
  }, 3000);
}

// Log current overlay state for debugging
function logCurrentOverlayState() {
  debugLog('STATE', 'Current overlay state:');
  
  const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
  fixedElements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.pointerEvents !== 'none' && style.visibility !== 'hidden') {
      debugLog('STATE', `Fixed element: ${getElementDescription(el)}`, {
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents
      });
    }
  });
  
  debugLog('STATE', `Body pointer-events: ${document.body.style.pointerEvents || 'auto'}`);
  debugLog('STATE', `HTML pointer-events: ${document.documentElement.style.pointerEvents || 'auto'}`);
}

// Get a readable description of an element
function getElementDescription(el: Element): string {
  if (!el) return 'null';
  
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = el.className && typeof el.className === 'string' 
    ? `.${el.className.split(' ').slice(0, 2).join('.')}` 
    : '';
  const dataAttrs = Array.from(el.attributes)
    .filter(a => a.name.startsWith('data-'))
    .map(a => `[${a.name}]`)
    .join('');
  
  return `${tag}${id}${classes}${dataAttrs}`.slice(0, 80);
}

// Expose debug functions globally
function exposeDebugFunctions() {
  (window as any).__uiDebug = {
    logOverlayState: logCurrentOverlayState,
    getActiveOverlays: () => Array.from(activeOverlays.values()),
    forceCheckBlockingAt: (x: number, y: number) => checkForBlockingOverlay(x, y),
    enableTapOverlay: enableTapDebugOverlay,
    disableTapOverlay: disableTapDebugOverlay
  };
  
  debugLog('INIT', 'Debug functions exposed at window.__uiDebug');
}

// Visual tap debug overlay - shows what element is under each tap
let tapOverlayEnabled = false;
let tapIndicator: HTMLDivElement | null = null;

function enableTapDebugOverlay() {
  if (tapOverlayEnabled) return;
  tapOverlayEnabled = true;
  
  tapIndicator = document.createElement('div');
  tapIndicator.id = '__tap_debug_indicator';
  tapIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    padding: 8px;
    background: rgba(0,0,0,0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 10px;
    z-index: 2147483647;
    pointer-events: none;
    border-radius: 4px;
    max-height: 100px;
    overflow: auto;
  `;
  document.body.appendChild(tapIndicator);
  
  document.addEventListener('pointerdown', handleTapDebugPointer, { capture: true });
  debugLog('INIT', 'Tap debug overlay enabled');
}

function disableTapDebugOverlay() {
  if (!tapOverlayEnabled) return;
  tapOverlayEnabled = false;
  
  if (tapIndicator) {
    tapIndicator.remove();
    tapIndicator = null;
  }
  
  document.removeEventListener('pointerdown', handleTapDebugPointer, { capture: true });
}

function handleTapDebugPointer(e: PointerEvent) {
  if (!tapIndicator) return;
  
  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  const info = elements.slice(0, 5).map((el, i) => {
    const style = window.getComputedStyle(el);
    return `${i}: ${getElementDescription(el)} (z:${style.zIndex}, pe:${style.pointerEvents})`;
  }).join('\n');
  
  tapIndicator.textContent = `Tap at (${e.clientX}, ${e.clientY}):\n${info}`;
}

// Cleanup
export function destroyDebugInstrumentation() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
  disableTapDebugOverlay();
  activeOverlays.clear();
}
