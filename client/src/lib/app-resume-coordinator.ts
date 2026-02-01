/**
 * Central Resume Coordinator
 * 
 * Consolidates all background/foreground handling into a single orchestrated system.
 * This prevents the "thundering herd" effect where multiple competing systems
 * all fire simultaneously when the app resumes from background.
 * 
 * Key features:
 * - Single visibility listener instead of 5+ scattered ones
 * - Debounced recovery to let WebView stabilize
 * - Sequenced recovery callbacks to prevent main thread blocking
 * - Visibility state helper for intervals
 */

interface ResumeConfig {
  minBackgroundTimeForRecovery: number;  // Skip recovery for very short backgrounds
  debounceTime: number;                   // Let WebView stabilize before recovery
  reloadThreshold: number;                // Force reload after this duration
}

type RecoveryCallback = () => void | Promise<void>;

class AppResumeCoordinator {
  private config: ResumeConfig;
  private lastBackgroundTime = 0;
  private isRecovering = false;
  private recoveryCallbacks: Map<string, RecoveryCallback> = new Map();
  private isInitialized = false;

  constructor(config: ResumeConfig) {
    this.config = config;
  }

  /**
   * Initialize the coordinator - call once at app startup
   */
  init() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // Single visibility listener
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleResume();
      }
    }, { capture: true });

    // Handle bfcache restoration
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // Page was restored from bfcache - force reload for clean state
        window.location.reload();
      }
    });

    // Focus event as additional signal (some WebViews don't fire visibilitychange)
    window.addEventListener('focus', () => {
      if (document.visibilityState === 'visible' && this.lastBackgroundTime > 0) {
        this.handleResume();
      }
    });
  }

  private handleBackground() {
    this.lastBackgroundTime = Date.now();
  }

  private async handleResume() {
    if (this.isRecovering) return;
    if (this.lastBackgroundTime === 0) return; // Never went to background

    const timeInBackground = Date.now() - this.lastBackgroundTime;

    // Check if we need full reload (WebView freeze scenario)
    if (timeInBackground > this.config.reloadThreshold) {
      console.log('[ResumeCoordinator] Reloading after extended background:', timeInBackground, 'ms');
      setTimeout(() => window.location.reload(), 100);
      return;
    }

    // Skip recovery for very short backgrounds but reset state to prevent stale timestamps
    if (timeInBackground < this.config.minBackgroundTimeForRecovery) {
      this.lastBackgroundTime = 0; // Reset to avoid stale state on subsequent focus events
      return;
    }

    this.isRecovering = true;
    this.lastBackgroundTime = 0; // Reset early to avoid duplicate triggers

    // Debounce to let WebView stabilize
    await new Promise(r => setTimeout(r, this.config.debounceTime));

    // Run registered recovery callbacks sequentially
    const callbacks = Array.from(this.recoveryCallbacks.values());
    for (const callback of callbacks) {
      try {
        await callback();
      } catch (e) {
        console.error('[ResumeCoordinator] Recovery callback failed:', e);
      }
    }

    this.isRecovering = false;
  }

  /**
   * Register a callback to run when app resumes from background
   * Callbacks are run sequentially to prevent main thread blocking
   * Uses an id to prevent duplicate registrations (e.g., on hot-reload)
   * Returns an unsubscribe function
   */
  registerRecoveryCallback(id: string, callback: RecoveryCallback): () => void {
    this.recoveryCallbacks.set(id, callback);
    return () => this.recoveryCallbacks.delete(id);
  }

  /**
   * Check if page is currently visible
   * Use this in setInterval callbacks to skip work when backgrounded
   */
  isVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * Get time since last background event (for debugging)
   */
  getTimeSinceBackground(): number {
    if (this.lastBackgroundTime === 0) return 0;
    return Date.now() - this.lastBackgroundTime;
  }
}

// Singleton instance with sensible defaults
export const resumeCoordinator = new AppResumeCoordinator({
  minBackgroundTimeForRecovery: 2000,   // 2 seconds - skip recovery for quick alt-tabs
  debounceTime: 200,                     // 200ms - let WebView stabilize
  reloadThreshold: 30000,                // 30 seconds - matches existing main.tsx logic
});

// Export class for testing
export { AppResumeCoordinator };
