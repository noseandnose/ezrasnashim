import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { PermissionManager } from '@/lib/permission-manager';
import { isWebView } from '@/utils/environment';

export function AutoNotificationPrompt() {
  useEffect(() => {
    // Skip push notifications in web views (Flutter, etc.) as they often lack
    // proper IndexedDB/Cache Storage support required for service workers
    if (isWebView()) {
      console.log('[AutoNotificationPrompt] Skipping push notifications in web view environment');
      return;
    }

    // Check if browser supports notifications
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      return;
    }

    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Always register service worker first
      await registerServiceWorker();

      // Initialize permission manager
      await PermissionManager.initialize();

      // If permission is 'granted' in browser, ensure subscription
      if (Notification.permission === 'granted') {
        await handleGrantedPermission();
        return;
      }

      // If permission is 'denied', just update state
      if (Notification.permission === 'denied') {
        return;
      }

      // If permission is 'default', check if we should prompt
      if (Notification.permission === 'default' && PermissionManager.shouldPromptForNotifications()) {
        // Request permission immediately
        await requestNotificationPermission();
      }
    } catch (error) {
      console.error('[AutoNotificationPrompt] Error initializing notifications:', error);
    }
  };

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('[AutoNotificationPrompt] Service worker registration failed:', error);
    }
  };

  const handleGrantedPermission = async () => {
    try {
      // Get VAPID public key
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      const { publicKey } = response.data;

      if (!publicKey) {
        console.error('[AutoNotificationPrompt] No VAPID public key available');
        return;
      }

      // Ensure subscription through PermissionManager
      await PermissionManager.ensureNotificationSubscription(publicKey);

      // Get the subscription and send to backend
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Send subscription to server
        const sessionId = localStorage.getItem('sessionId');
        await apiRequest('POST', '/api/push/subscribe', {
          subscription: subscription.toJSON(),
          sessionId
        });
      }
    } catch (error) {
      console.error('[AutoNotificationPrompt] Error handling granted permission:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      // Request permission through PermissionManager
      const result = await PermissionManager.requestNotificationPermission();

      if (result.success && result.permission === 'granted') {
        // Permission granted, subscribe
        await handleGrantedPermission();
      }
    } catch (error) {
      console.error('[AutoNotificationPrompt] Error requesting permission:', error);
    }
  };

  // This component doesn't render anything
  return null;
}