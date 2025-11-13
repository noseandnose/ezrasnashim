import { create } from 'zustand';

// LocalStorage keys
const STORAGE_KEYS = {
  NOTIFICATION_STATE: 'ezras-nashim-notification-state',
  LOCATION_STATE: 'ezras-nashim-location-state',
} as const;

// Notification Permission State
interface NotificationState {
  subscribed: boolean;
  token: string | null;
  lastChecked: number | null;
  lastError: string | null;
  userIntent: 'granted' | 'dismissed' | 'denied' | 'default';
  revokedAt: number | null;
  needsResubscribe: boolean;
  dismissedAt: number | null;
}

// Location Permission State
interface LocationState {
  state: 'granted' | 'denied' | 'prompt' | 'dismissed';
  lastPrompt: number | null;
  source: 'gps' | 'ip' | null;
  cooldownUntil: number | null;
}

// Zustand store for reactive UI
interface PermissionStore {
  notification: NotificationState;
  location: LocationState;
  setNotificationState: (state: Partial<NotificationState>) => void;
  setLocationState: (state: Partial<LocationState>) => void;
  resetNotificationState: () => void;
  resetLocationState: () => void;
}

const DEFAULT_NOTIFICATION_STATE: NotificationState = {
  subscribed: false,
  token: null,
  lastChecked: null,
  lastError: null,
  userIntent: 'default',
  revokedAt: null,
  needsResubscribe: false,
  dismissedAt: null,
};

const DEFAULT_LOCATION_STATE: LocationState = {
  state: 'prompt',
  lastPrompt: null,
  source: null,
  cooldownUntil: null,
};

// Helper to safely parse localStorage
function safeParseJSON<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.warn(`[PermissionManager] Failed to parse ${key}, resetting to default`);
    localStorage.removeItem(key);
    return defaultValue;
  }
}

// Helper to safely write to localStorage
function safeSetJSON(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[PermissionManager] Failed to save ${key}`);
  }
}

// Create Zustand store
export const usePermissionStore = create<PermissionStore>((set) => ({
  notification: safeParseJSON(STORAGE_KEYS.NOTIFICATION_STATE, DEFAULT_NOTIFICATION_STATE),
  location: safeParseJSON(STORAGE_KEYS.LOCATION_STATE, DEFAULT_LOCATION_STATE),
  
  setNotificationState: (newState) => set((state) => {
    const updated = { ...state.notification, ...newState };
    safeSetJSON(STORAGE_KEYS.NOTIFICATION_STATE, updated);
    return { notification: updated };
  }),
  
  setLocationState: (newState) => set((state) => {
    const updated = { ...state.location, ...newState };
    safeSetJSON(STORAGE_KEYS.LOCATION_STATE, updated);
    return { location: updated };
  }),
  
  resetNotificationState: () => set(() => {
    safeSetJSON(STORAGE_KEYS.NOTIFICATION_STATE, DEFAULT_NOTIFICATION_STATE);
    return { notification: DEFAULT_NOTIFICATION_STATE };
  }),
  
  resetLocationState: () => set(() => {
    safeSetJSON(STORAGE_KEYS.LOCATION_STATE, DEFAULT_LOCATION_STATE);
    return { location: DEFAULT_LOCATION_STATE };
  }),
}));

// Permission Manager Service
export class PermissionManager {
  // Notification cooldown: 7 days after dismissal
  private static readonly NOTIFICATION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  
  // Location cooldown: 24 hours after denial
  private static readonly LOCATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  
  // Subscription revalidation: check every 24 hours
  private static readonly SUBSCRIPTION_REVALIDATION_MS = 24 * 60 * 60 * 1000;

  // Initialize permission manager - call on app start
  static async initialize() {
    await this.reconcileNotificationPermission();
    this.reconcileLocationPermission();
  }

  // Check if we should prompt for notifications (respecting cooldown)
  static shouldPromptForNotifications(): boolean {
    const store = usePermissionStore.getState();
    const current = store.notification;

    // Don't prompt if denied
    if (current.userIntent === 'denied') return false;

    // Don't prompt if already granted
    if (current.userIntent === 'granted') return false;

    // Check dismissal cooldown
    if (current.userIntent === 'dismissed' && current.dismissedAt) {
      const timeSinceDismissal = Date.now() - current.dismissedAt;
      if (timeSinceDismissal < this.NOTIFICATION_COOLDOWN_MS) {
        return false; // Still in cooldown
      }
      // Cooldown expired, reset to default to allow prompting
      store.setNotificationState({
        userIntent: 'default',
        dismissedAt: null,
      });
    }

    return true;
  }

  // Reconcile notification permission with browser state
  private static async reconcileNotificationPermission() {
    if (!('Notification' in window)) return;

    const store = usePermissionStore.getState();
    const current = store.notification;
    const browserPermission = Notification.permission;

    // If browser permission was revoked
    if (browserPermission === 'denied' && current.userIntent !== 'denied') {
      store.setNotificationState({
        subscribed: false,
        token: null,
        userIntent: 'denied',
        revokedAt: Date.now(),
        needsResubscribe: false,
      });
      return;
    }

    // If browser permission was granted but we're not subscribed
    if (browserPermission === 'granted' && !current.subscribed) {
      // Check if we have an active subscription
      const hasSubscription = await this.checkPushSubscription();
      if (!hasSubscription && current.userIntent === 'granted') {
        // Mark for resubscribe
        store.setNotificationState({
          needsResubscribe: true,
        });
      }
    }

    // Revalidate subscription if it's been a while
    if (current.subscribed && current.lastChecked) {
      const timeSinceCheck = Date.now() - current.lastChecked;
      if (timeSinceCheck > this.SUBSCRIPTION_REVALIDATION_MS) {
        const hasSubscription = await this.checkPushSubscription();
        if (!hasSubscription) {
          store.setNotificationState({
            subscribed: false,
            needsResubscribe: current.userIntent === 'granted',
            lastChecked: Date.now(),
          });
        } else {
          store.setNotificationState({
            lastChecked: Date.now(),
          });
        }
      }
    }
  }

  // Check if push subscription exists
  private static async checkPushSubscription(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator && 'PushManager' in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('[PermissionManager] Error checking push subscription:', error);
      return false;
    }
  }

  // Reconcile location permission
  private static reconcileLocationPermission() {
    const store = usePermissionStore.getState();
    const current = store.location;

    // If cooldown has expired, reset state to 'prompt' to allow re-prompting
    if (current.cooldownUntil && Date.now() >= current.cooldownUntil) {
      // Cooldown expired - clear it and reset to prompt state
      store.setLocationState({
        state: 'prompt',
        cooldownUntil: null,
      });
      return;
    }

    // Check if we're in cooldown period
    if (current.cooldownUntil && Date.now() < current.cooldownUntil) {
      // Still in cooldown, don't prompt
      return;
    }

    // Try to check actual browser permission if API is available
    // IMPORTANT: Only trust 'granted' state, not 'denied' state on Android
    // Android Permissions API often incorrectly reports 'denied' before user has been prompted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        // Only update to 'granted' if permission is actually granted
        // Do NOT update to 'denied' based on Permissions API alone - wait for actual user response
        if (permission.state === 'granted' && current.state !== 'granted') {
          store.setLocationState({
            state: 'granted',
          });
        }
        // If permission.state is 'denied' but we never actually prompted the user,
        // ignore it - Android often incorrectly reports this before prompting
      }).catch(() => {
        // Permission API not supported, will rely on geolocation API callbacks
      });
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<{
    success: boolean;
    permission: NotificationPermission;
    subscription?: PushSubscription;
  }> {
    const store = usePermissionStore.getState();

    // Check if already granted
    if (Notification.permission === 'granted') {
      return { success: true, permission: 'granted' };
    }

    // Check if denied
    if (Notification.permission === 'denied') {
      store.setNotificationState({
        userIntent: 'denied',
        revokedAt: Date.now(),
      });
      return { success: false, permission: 'denied' };
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        store.setNotificationState({
          userIntent: 'granted',
          lastChecked: Date.now(),
        });
        return { success: true, permission: 'granted' };
      } else if (permission === 'denied') {
        store.setNotificationState({
          userIntent: 'denied',
          revokedAt: Date.now(),
        });
        return { success: false, permission: 'denied' };
      } else {
        // User dismissed the prompt
        store.setNotificationState({
          userIntent: 'dismissed',
          dismissedAt: Date.now(),
        });
        return { success: false, permission: 'default' };
      }
    } catch (error) {
      console.error('[PermissionManager] Error requesting notification permission:', error);
      store.setNotificationState({
        lastError: String(error),
      });
      return { success: false, permission: Notification.permission };
    }
  }

  // Subscribe to push notifications
  static async subscribeToPushNotifications(vapidPublicKey: string): Promise<{
    success: boolean;
    subscription?: PushSubscription;
    error?: string;
  }> {
    const store = usePermissionStore.getState();

    try {
      if (!('serviceWorker' in navigator && 'PushManager' in window)) {
        throw new Error('Push notifications not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const convertedKey = this.urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Update state
      store.setNotificationState({
        subscribed: true,
        token: JSON.stringify(subscription.toJSON()),
        lastChecked: Date.now(),
        lastError: null,
        needsResubscribe: false,
      });

      return { success: true, subscription };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : error instanceof DOMException 
          ? `${error.name}: ${error.message}` 
          : String(error);
      
      console.error('[PermissionManager] Error subscribing to push:', {
        message: errorMessage,
        name: error instanceof Error ? error.name : 'Unknown',
        error: error
      });
      
      store.setNotificationState({
        subscribed: false,
        lastError: errorMessage,
        lastChecked: Date.now(),
      });
      return { success: false, error: errorMessage };
    }
  }

  // Helper to convert VAPID key
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Ensure notification subscription (call this on app start if permission granted)
  static async ensureNotificationSubscription(vapidPublicKey: string): Promise<void> {
    const store = usePermissionStore.getState();
    const current = store.notification;

    // Only proceed if permission is granted
    if (Notification.permission !== 'granted') return;

    // Check if we need to resubscribe
    if (current.needsResubscribe || !current.subscribed) {
      await this.subscribeToPushNotifications(vapidPublicKey);
    } else {
      // Verify subscription still exists
      const hasSubscription = await this.checkPushSubscription();
      if (!hasSubscription) {
        await this.subscribeToPushNotifications(vapidPublicKey);
      }
    }
  }

  // Request location permission
  static async requestLocationPermission(): Promise<{
    success: boolean;
    coordinates?: { lat: number; lng: number };
    error?: string;
  }> {
    const store = usePermissionStore.getState();
    const current = store.location;

    // Check cooldown
    if (current.cooldownUntil && Date.now() < current.cooldownUntil) {
      return { success: false, error: 'In cooldown period' };
    }

    // Only skip if already granted - always try if state is denied/prompt/dismissed
    // This handles Android quirks where Permissions API incorrectly reports state
    if (current.state === 'granted') {
      // Already have permission, no need to request again
      return { success: true };
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        store.setLocationState({
          state: 'denied',
          cooldownUntil: Date.now() + this.LOCATION_COOLDOWN_MS,
        });
        resolve({ success: false, error: 'Geolocation not supported' });
        return;
      }

      store.setLocationState({
        lastPrompt: Date.now(),
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          store.setLocationState({
            state: 'granted',
            source: 'gps',
            cooldownUntil: null,
          });
          
          resolve({ success: true, coordinates: coords });
        },
        (error) => {
          // Only mark as 'denied' if user explicitly denied permission
          // PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
          if (error.code === 1) {
            // User explicitly denied permission
            store.setLocationState({
              state: 'denied',
              cooldownUntil: Date.now() + this.LOCATION_COOLDOWN_MS,
            });
          } else {
            // Timeout or position unavailable - don't mark as denied
            // Leave state as 'prompt' so we can try again
            store.setLocationState({
              state: 'prompt',
              cooldownUntil: null,
            });
          }
          
          resolve({ success: false, error: error.message });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000, // Increased timeout for slower Android devices
          maximumAge: 60 * 60 * 1000, // 1-hour cache
        }
      );
    });
  }

  // Check if we should prompt for location
  static shouldPromptForLocation(): boolean {
    const store = usePermissionStore.getState();
    const current = store.location;

    // If cooldown has expired, reset state to 'prompt'
    if (current.cooldownUntil && Date.now() >= current.cooldownUntil) {
      store.setLocationState({
        state: 'prompt',
        cooldownUntil: null,
      });
      // Now allow prompting
      return true;
    }

    // Don't prompt if in active cooldown
    if (current.cooldownUntil && Date.now() < current.cooldownUntil) return false;

    // Don't prompt if already granted
    if (current.state === 'granted') return false;

    // Don't prompt if denied (unless cooldown expired, handled above)
    if (current.state === 'denied') return false;

    return true;
  }

  // Mark location as dismissed (user closed prompt without granting)
  static markLocationDismissed(): void {
    const store = usePermissionStore.getState();
    store.setLocationState({
      state: 'dismissed',
      cooldownUntil: Date.now() + this.LOCATION_COOLDOWN_MS,
    });
  }

  // Get current notification state
  static getNotificationState(): NotificationState {
    return usePermissionStore.getState().notification;
  }

  // Get current location state
  static getLocationState(): LocationState {
    return usePermissionStore.getState().location;
  }
}
