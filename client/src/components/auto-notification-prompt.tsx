import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function AutoNotificationPrompt() {

  useEffect(() => {
    // Check if browser supports notifications
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      console.log('Browser does not support push notifications');
      return;
    }

    // Check current permission status
    if (Notification.permission === 'granted') {
      // If already granted, ensure we're subscribed
      console.log('Notifications already granted, ensuring subscription');
      ensureSubscribed();
      return;
    }
    
    if (Notification.permission === 'denied') {
      // User previously denied, don't prompt again
      console.log('Notifications previously denied');
      return;
    }

    // If permission is 'default', request permission immediately
    if (Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      // Request permission immediately without delay
      requestNotificationPermission();
    }
  }, []);

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
        console.log('Already subscribed to push notifications');
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
      console.log('Registering service worker...');
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      console.log('Service worker registered');

      // Get VAPID public key
      const { publicKey } = await apiRequest('GET', '/api/push/vapid-public-key');
      
      if (!publicKey) {
        console.error('Push notifications not configured on server');
        return;
      }

      console.log('Subscribing to push notifications...');
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to server
      const sessionId = localStorage.getItem('sessionId');
      console.log('Sending subscription to server:', subscription.toJSON());
      
      try {
        const response = await apiRequest('POST', '/api/push/subscribe', {
          subscription: subscription.toJSON(),
          sessionId
        });
        console.log('Server response:', response);
        console.log('Successfully subscribed to push notifications');
      } catch (saveError) {
        console.error('Failed to save subscription to server:', saveError);
        throw saveError;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('About to request notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('Permission granted, subscribing...');
        // User granted permission, subscribe to notifications
        await subscribeToNotifications();
      } else if (permission === 'denied') {
        console.log('User denied notification permission');
      } else {
        console.log('User dismissed notification prompt');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // This component doesn't render anything
  return null;
}