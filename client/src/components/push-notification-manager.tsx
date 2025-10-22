import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications and service workers
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
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

  const subscribeToPush = async () => {
    setIsLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'You need to allow notifications to receive updates.',
          variant: 'destructive'
        });
        return;
      }

      // Reuse existing service worker registration
      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // Check for existing subscription and validate it
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        try {
          // Test if subscription is still valid by sending it to server
          const sessionId = localStorage.getItem('sessionId') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await apiRequest('POST', '/api/push/subscribe', {
            subscription: existingSub.toJSON(),
            sessionId
          });
          
          setSubscription(existingSub);
          toast({
            title: 'Already Subscribed',
            description: 'Push notifications are already enabled.',
          });
          return;
        } catch (error) {
          // Existing subscription is invalid, unsubscribe and create new
          console.warn('Existing subscription invalid, creating new one:', error);
          await existingSub.unsubscribe();
        }
      }

      // Get VAPID public key from server
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      const publicKey = response.data.publicKey;
      
      if (!publicKey) {
        throw new Error('Push notifications not configured on server');
      }

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Get or create session ID for tracking
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', sessionId);
      }

      // Send subscription to server
      await apiRequest('POST', '/api/push/subscribe', {
        subscription: newSubscription.toJSON(),
        sessionId
      });

      setSubscription(newSubscription);
      
      toast({
        title: 'Subscribed!',
        description: 'You will now receive push notifications.',
      });
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      
      // Provide more specific error messages
      let description = 'Could not enable push notifications. Please try again.';
      if (error.message?.includes('not configured')) {
        description = 'Push notifications are not configured on this server.';
      } else if (error.name === 'NotAllowedError') {
        description = 'Notification permission was denied. Please enable it in your browser settings.';
      } else if (error.name === 'NotSupportedError') {
        description = 'Push notifications are not supported in this browser.';
      }
      
      toast({
        title: 'Subscription Failed',
        description,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      if (!subscription) return;

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify server
      await apiRequest('POST', '/api/push/unsubscribe', {
        endpoint: subscription.endpoint
      });

      setSubscription(null);
      
      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive push notifications.',
      });
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: 'Unsubscribe Failed',
        description: 'Could not disable push notifications. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  return (
    <div className="flex items-center gap-2">
      {subscription ? (
        <Button
          onClick={unsubscribeFromPush}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <BellOff className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'Disable Notifications'}
        </Button>
      ) : (
        <Button
          onClick={subscribeToPush}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Bell className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'Enable Notifications'}
        </Button>
      )}
    </div>
  );
}