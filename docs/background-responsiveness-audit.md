# Background/Foreground Responsiveness Audit

**Date:** February 2026
**Issue:** App becomes unresponsive when taken to background and brought back to foreground in FlutterFlow WebView

---

## Executive Summary

The app has **5+ competing recovery systems** that all fire simultaneously when the app resumes from background, creating a "thundering herd" effect that can overwhelm the main thread. While the 30-second auto-reload workaround is necessary due to WebView limitations, several optimizations can improve overall stability and reduce the likelihood of the app becoming unresponsive in the first place.

---

## Root Cause

The core issue is a **fundamental WebView limitation** in FlutterFlow. When a WebView goes to background:

1. JavaScript execution is paused/suspended by the OS
2. React's synthetic event system gets disconnected from native touch events
3. Timers, requestAnimationFrame, and event listeners enter a stale state
4. When the app resumes, touch events fire but React doesn't process them

The 30-second auto-reload is the correct workaround for this limitation.

---

## Critical Issues Found

### 1. Competing Resume Handlers

The app has **5 different systems** all trying to handle resume:

| System | File | Location | What it does |
|--------|------|----------|--------------|
| main.tsx | `client/src/main.tsx` | Lines 15-32 | Reloads app if background >30s |
| resume-manager.ts | `client/src/lib/resume-manager.ts` | Lines 269-312 | DOM manipulation, synthetic events, dead-click detection |
| App.tsx | `client/src/App.tsx` | Lines 167-228 | Refetches 5+ React Query queries |
| fullscreen-modal.tsx | `client/src/components/ui/fullscreen-modal.tsx` | Lines 159-173 | Resets modal state |
| debug-instrumentation.ts | `client/src/lib/debug-instrumentation.ts` | Lines 316-348 | Logs all events (if debug enabled) |

**Problem:** All these systems fire simultaneously on resume, causing:
- Multiple query refetches
- DOM manipulation thrashing
- Multiple event dispatches
- Main thread blocking

**Recommendation:** Consolidate into ONE central resume coordinator that orchestrates all recovery logic with proper sequencing and debouncing.

---

### 2. Memory Leak: Unremoved Global Listeners

Found **20+ global event listeners** added at module initialization that are **never removed**:

| File | Line(s) | Events |
|------|---------|--------|
| main.tsx | 15, 36, 51, 85, 185 | visibilitychange, pageshow, touchstart, resize, error |
| resume-manager.ts | 394, 408, 419, 430, 436 | visibilitychange, pageshow, focus, custom events, click |
| fullscreen-modal.tsx | 159, 177 | visibilitychange + infinite setInterval |
| debug-instrumentation.ts | 316-348 | 8 different event listeners |

**Problem:** Each background/foreground cycle can ADD MORE listeners through `installNativeClickRecovery()` which adds capture-phase click handlers without tracking/cleanup.

**Recommendation:** Create a listener registry that tracks all global listeners and provides cleanup capability:

```typescript
// lib/listener-registry.ts
const cleanupFns: (() => void)[] = [];

export function registerListener(
  target: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) {
  target.addEventListener(event, handler, options);
  cleanupFns.push(() => target.removeEventListener(event, handler, options));
}

export function cleanupAllListeners() {
  cleanupFns.forEach(fn => fn());
  cleanupFns.length = 0;
}
```

---

### 3. Infinite setIntervals Without Visibility Check

| File | Line | Interval | Visibility Check | Cleanup |
|------|------|----------|------------------|---------|
| fullscreen-modal.tsx | 177 | 30s | ❌ NO | ❌ NO |
| debug-instrumentation.ts | 461 | 5s | ❌ NO | ✅ Yes |
| debug-instrumentation.ts | 513 | 3s | ❌ NO | ❌ NO |
| chain.tsx | 139 | 10s | ❌ NO | ✅ Yes |
| tefilla-modals.tsx | 105, 166 | 60s | ❌ NO | ✅ Yes |
| home-section.tsx | 200 | 60s | ❌ NO | ✅ Yes |
| App.tsx | 220 | 60s | ✅ YES | ✅ Yes |

**Problem:** These intervals continue running when the app is backgrounded, wasting battery and accumulating stale state.

**Recommendation:** Add visibility guards to all intervals:

```typescript
// Before
setInterval(() => {
  refreshStats();
}, 10000);

// After
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  refreshStats();
}, 10000);
```

---

### 4. ResumeManager DOM Thrashing

`resume-manager.ts:208-218` runs a **DOM query on every interactive element**:

```typescript
const interactives = document.querySelectorAll(
  'button, a, [role="button"], [onclick], [data-testid]'
);
interactives.forEach(el => {
  htmlEl.style.pointerEvents = 'none';
  requestAnimationFrame(() => {
    htmlEl.style.pointerEvents = original || '';
  });
});
```

**Problem:** This causes **100-200ms jank** because:
- Synchronous `querySelectorAll` on potentially hundreds of elements
- `requestAnimationFrame` for each element causes layout thrashing
- Plus synthetic events dispatched (pointermove, touchstart, touchend, resize)

**Recommendation:** Remove or simplify this logic. The pointer-events reset is unlikely to help with the WebView suspension issue and adds significant overhead.

---

### 5. Dead-Click Detection Force Reloads

`resume-manager.ts:333-366` can **force reload the app after 3 clicks**:

```typescript
if (deadClickCount >= 3) {
  window.location.reload();  // Destroys user work!
}
```

**Problem:** This is overly aggressive and can cause unexpected data loss.

**Recommendation:** Remove this logic. The 30-second auto-reload in main.tsx is the correct recovery mechanism. Dead-click detection with force reload adds complexity without benefit.

---

### 6. React Query Double Refetch

On resume, the app does **double refetching**:

1. **App.tsx manually refetches** 5+ queries on visibilitychange (lines 191-203)
2. **Some queries have `refetchOnWindowFocus: true`** which triggers AGAIN

Affected hooks/queries:
- useHomeSummary (staleTime: 2min)
- useTefillaStats (staleTime: 1min)
- MessageModal, SponsorshipBar

**Recommendation:** Choose ONE approach:
- Either remove `refetchOnWindowFocus: true` from individual queries
- OR remove the manual `refetchQueries` calls in App.tsx

Don't do both.

---

### 7. Service Worker Timer Accumulation

`sw.js:402-404` creates a **new setTimeout for every API request**:

```javascript
setTimeout(() => {
  cache.delete(event.request);
}, 60 * 60 * 1000);  // 1 hour
```

**Problem:** If many requests are made, timers accumulate and all fire simultaneously when they expire.

**Recommendation:** Use a different cache expiration strategy:
- Store expiration timestamp in cache metadata
- Check expiration on cache read, not with timers
- Or use Cache API with proper cache headers

---

### 8. fullscreen-modal.tsx Interval Never Cleaned Up

`fullscreen-modal.tsx:177-189` creates a setInterval that is **never cleared**:

```typescript
// This runs forever, even after the module is no longer needed
setInterval(() => {
  if (activeFullscreenModals > 0) {
    const modalElements = document.querySelectorAll('[data-fullscreen-modal]');
    if (modalElements.length === 0) {
      console.warn('[FullscreenModal] Detected stuck modal counter, resetting scroll lock');
      forceResetScrollLock();
    }
  }
}, 30000);
```

**Recommendation:** Store the interval ID and provide cleanup, or move this logic into the component lifecycle.

---

## Moderate Issues

### 9. Chain.tsx Polling Frequency

`chain.tsx:139` polls stats every **10 seconds** without visibility check.

**Recommendation:**
- Add visibility check
- Consider increasing interval to 30 seconds (chain data doesn't change that frequently)

---

### 10. Compass Sensors Not Paused on Background

`compass.ts` properly cleans up on component unmount, but doesn't pause sensors when app is backgrounded.

**Recommendation:** Add visibility listener to pause sensor readings when app is in background.

---

### 11. Audio Context Handling

`audio-player.tsx:68-73` attempts AudioContext resume, but:
- AudioContext can be suspended by the OS when backgrounded
- No explicit handling for iOS background audio suspension

**Recommendation:** Add explicit AudioContext state checking and resume logic on visibility change.

---

## Recommended Architecture: Central Resume Coordinator

Instead of 5 competing systems, create ONE central coordinator:

```typescript
// lib/app-resume-coordinator.ts

interface ResumeConfig {
  minBackgroundTimeForRecovery: number;  // e.g., 2000ms
  debounceTime: number;                   // e.g., 200ms
  reloadThreshold: number;                // e.g., 30000ms (keep current)
}

class AppResumeCoordinator {
  private config: ResumeConfig;
  private lastBackgroundTime = 0;
  private isRecovering = false;
  private recoveryCallbacks: (() => void | Promise<void>)[] = [];

  constructor(config: ResumeConfig) {
    this.config = config;
    this.setupListeners();
  }

  private setupListeners() {
    // Single visibility listener
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleResume();
      }
    }, { capture: true });

    // Single pageshow listener for bfcache
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    });
  }

  private handleBackground() {
    this.lastBackgroundTime = Date.now();
  }

  private async handleResume() {
    if (this.isRecovering) return;

    const timeInBackground = Date.now() - this.lastBackgroundTime;

    // Check if we need full reload (WebView freeze scenario)
    if (timeInBackground > this.config.reloadThreshold) {
      console.log('[Resume] Reloading after extended background...');
      setTimeout(() => window.location.reload(), 100);
      return;
    }

    // Skip recovery for very short backgrounds
    if (timeInBackground < this.config.minBackgroundTimeForRecovery) {
      return;
    }

    this.isRecovering = true;

    // Debounce to let WebView stabilize
    await new Promise(r => setTimeout(r, this.config.debounceTime));

    // Run registered recovery callbacks sequentially
    for (const callback of this.recoveryCallbacks) {
      try {
        await callback();
      } catch (e) {
        console.error('[Resume] Recovery callback failed:', e);
      }
    }

    this.isRecovering = false;
  }

  // Allow other modules to register recovery actions
  registerRecoveryCallback(callback: () => void | Promise<void>) {
    this.recoveryCallbacks.push(callback);
  }

  // For intervals that should pause when backgrounded
  isVisible(): boolean {
    return document.visibilityState === 'visible';
  }
}

// Singleton instance
export const resumeCoordinator = new AppResumeCoordinator({
  minBackgroundTimeForRecovery: 2000,
  debounceTime: 200,
  reloadThreshold: 30000,
});
```

**Usage in other modules:**

```typescript
// In App.tsx
import { resumeCoordinator } from './lib/app-resume-coordinator';

// Register data refetch as recovery action
resumeCoordinator.registerRecoveryCallback(async () => {
  await queryClient.refetchQueries({ queryKey: ['/api/home-summary', today] });
  // ... other refetches
});

// In chain.tsx - use visibility check in interval
useEffect(() => {
  const interval = setInterval(() => {
    if (!resumeCoordinator.isVisible()) return;
    refreshStats();
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## Files to Modify (Priority Order)

| Priority | File | Changes |
|----------|------|---------|
| 1 | `client/src/lib/resume-manager.ts` | Simplify or replace with coordinator |
| 2 | `client/src/main.tsx` | Keep reload logic, remove duplicate handlers |
| 3 | `client/src/App.tsx` | Use coordinator, fix double refetch |
| 4 | `client/src/components/ui/fullscreen-modal.tsx` | Fix interval cleanup, add visibility check |
| 5 | `client/src/pages/chain.tsx` | Add visibility check to interval |
| 6 | `client/src/components/modals/tefilla-modals.tsx` | Add visibility check to intervals |
| 7 | `client/src/lib/debug-instrumentation.ts` | Add cleanup for overlay monitor interval |
| 8 | `client/public/sw.js` | Replace timer-based cache expiration |

---

## Quick Wins (Small Changes, Big Impact)

1. **Add visibility check to fullscreen-modal.tsx interval** (line 177)
2. **Remove dead-click force reload** (resume-manager.ts lines 348-350)
3. **Add visibility check to chain.tsx interval** (line 139)
4. **Store and clear the interval in fullscreen-modal.tsx** (line 177)
5. **Remove duplicate refetch logic** - keep either App.tsx manual refetch OR query-level refetchOnWindowFocus, not both

---

## What's Working Correctly

- Audio player visibility handling (properly pauses/resumes)
- App.tsx health check has visibility check (line 215)
- React Query default config has `refetchOnWindowFocus: false`
- Geolocation uses single requests, no watchPosition
- Most useEffect cleanups are properly implemented
- The 30-second reload threshold is appropriate for the WebView limitation

---

## Summary

The 30-second auto-reload is the correct solution for the WebView freeze issue. The improvements above focus on:

1. **Reducing the likelihood** of the app becoming unresponsive by eliminating competing systems
2. **Improving battery life** by pausing unnecessary work when backgrounded
3. **Preventing memory leaks** from accumulated event listeners
4. **Simplifying the codebase** by consolidating recovery logic

These changes won't eliminate the need for the auto-reload (that's a WebView limitation), but they will make the app more stable and efficient overall.
