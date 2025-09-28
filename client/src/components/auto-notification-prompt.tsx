import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function AutoNotificationPrompt() {

  useEffect(() => {
    // Check if browser supports notifications
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      return;
    }

    // Always register service worker first
    registerServiceWorker();

    // Check current permission status
    if (Notification.permission === 'granted') {
      // If already granted, ensure we're subscribed
      ensureSubscribed();
      return;
    }
    
    if (Notification.permission === 'denied') {
      // User previously denied, don't prompt again
      return;
    }

    // If permission is 'default', request permission immediately
    if (Notification.permission === 'default') {
      // Request permission immediately without delay
      requestNotificationPermission();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
    } catch (error) {
      // Service worker registration failed - notifications won't work
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const ensureSubscribed = async () => {
    try {
      // Check if already subscribed
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        return; // Already subscribed
      }

      // Subscribe
      await subscribeToNotifications();
    } catch (error) {
      // Error ensuring subscription
    }
  };

  const subscribeToNotifications = async () => {
    try {
      // Use already registered service worker
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      const { publicKey } = response.data;
      
      if (!publicKey) {
        return;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to server
      const sessionId = localStorage.getItem('sessionId');
      
      await apiRequest('POST', '/api/push/subscribe', {
        subscription: subscription.toJSON(),
        sessionId
      });
      
      // Successfully subscribed to push notifications
    } catch (error) {
      // Error subscribing to push notifications
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // User granted permission, subscribe to notifications
        await subscribeToNotifications();
      }
    } catch (error) {
      // Permission request failed
    }
  };

  // This component doesn't render anything
  return null;
}