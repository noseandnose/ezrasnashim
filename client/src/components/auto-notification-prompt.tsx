import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function AutoNotificationPrompt() {
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    // Check if we've already prompted in this session
    const prompted = sessionStorage.getItem('notificationPrompted');
    if (prompted) {
      setHasPrompted(true);
      return;
    }

    // Check if browser supports notifications
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      return;
    }

    // Check current permission status
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      sessionStorage.setItem('notificationPrompted', 'true');
      setHasPrompted(true);
      
      // If already granted, ensure we're subscribed
      if (Notification.permission === 'granted') {
        ensureSubscribed();
      }
      return;
    }

    // Set up one-time listener for first user interaction
    const handleFirstInteraction = async () => {
      // Remove listeners immediately
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      
      // Mark as prompted
      sessionStorage.setItem('notificationPrompted', 'true');
      setHasPrompted(true);
      
      // Small delay to ensure interaction is registered
      setTimeout(async () => {
        await requestNotificationPermission();
      }, 100);
    };

    // Add listeners for first interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    // Cleanup
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
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
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const { publicKey } = await apiRequest('GET', '/api/push/vapid-public-key');
      
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
      } else if (permission === 'denied') {
        console.log('User denied notification permission');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // This component doesn't render anything
  return null;
}