import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function AutoNotificationPrompt() {

  useEffect(() => {
    // Check if browser supports notifications
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      console.log('Browser does not support push notifications');
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
      console.log('[SW Registration] Starting...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW Registration] Success:', registration.scope);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[SW Registration] Service worker ready');
    } catch (error) {
      console.error('[SW Registration] Failed:', error);
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
      console.error('Error ensuring subscription:', error);
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
        console.error('Push notifications not configured on server');
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
      
      console.log('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
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
      console.error('Error requesting notification permission:', error);
    }
  };

  // This component doesn't render anything
  return null;
}