import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function PushDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${time}: ${msg}`]);
    console.log(`[Push Debug] ${msg}`);
  };

  useEffect(() => {
    // Check service worker status on load
    checkServiceWorker();
  }, []);

  const checkServiceWorker = async () => {
    log('=== Service Worker Check ===');
    
    if (!('serviceWorker' in navigator)) {
      log('❌ Service Workers not supported');
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    log(`Found ${registrations.length} service worker(s)`);
    
    for (const reg of registrations) {
      log(`SW Scope: ${reg.scope}`);
      log(`SW Active: ${!!reg.active}`);
      
      if (reg.active) {
        // Send a test message to the service worker
        reg.active.postMessage({ type: 'TEST', timestamp: Date.now() });
        log('Sent test message to SW');
      }
    }
  };

  const checkPushPermission = async () => {
    log('=== Push Permission Check ===');
    
    if (!('Notification' in window)) {
      log('❌ Notifications not supported');
      return;
    }
    
    log(`Current permission: ${Notification.permission}`);
    
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      log(`Permission after request: ${result}`);
    }
  };

  const checkSubscription = async () => {
    log('=== Subscription Check ===');
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      log('✅ Push subscription exists');
      log(`Endpoint: ${subscription.endpoint.substring(0, 60)}...`);
      
      // Check if keys exist
      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      log(`Has p256dh key: ${!!key}`);
      log(`Has auth key: ${!!auth}`);
    } else {
      log('❌ No push subscription');
    }
  };

  const unregisterAll = async () => {
    log('=== Unregistering All Service Workers ===');
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const success = await reg.unregister();
      log(`Unregistered ${reg.scope}: ${success ? '✅' : '❌'}`);
    }
    
    log('Clearing all caches...');
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
      log(`Deleted cache: ${name}`);
    }
    
    log('✅ All service workers and caches cleared');
    log('⚠️ Refresh the page to re-register');
  };

  const resubscribe = async () => {
    log('=== Re-subscribing to Push ===');
    
    try {
      // Get VAPID public key
      const response = await fetch('http://localhost:5000/api/push/vapid-public-key');
      const { publicKey } = await response.json();
      log(`Got VAPID key: ${publicKey.substring(0, 20)}...`);
      
      // Get service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Unsubscribe if exists
      const oldSub = await registration.pushManager.getSubscription();
      if (oldSub) {
        await oldSub.unsubscribe();
        log('Unsubscribed from old subscription');
      }
      
      // Create new subscription
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
      
      log('✅ Created new subscription');
      log(`New endpoint: ${newSub.endpoint.substring(0, 60)}...`);
      
      // Send to server
      const saveResponse = await fetch('http://localhost:5000/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: newSub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(newSub.getKey('auth')!)))
          }
        })
      });
      
      const result = await saveResponse.json();
      log(`Server response: ${JSON.stringify(result)}`);
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
    }
  };

  const sendTestPush = async () => {
    log('=== Sending Test Push ===');
    
    try {
      const apiUrl = window.location.hostname.includes('replit')
        ? `https://${window.location.hostname.replace('-00-', '-5000-')}/api/push/simple-test`
        : 'http://localhost:5000/api/push/simple-test';
      
      log(`Using API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, { method: 'POST' });
      const result = await response.json();
      
      log(`Server result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        log('✅ Push sent - Check browser console for [SW] logs');
        log('📱 If no notification appears, check:');
        log('  1. Browser DevTools > Application > Service Workers');
        log('  2. Look for "Push" events in the service worker');
        log('  3. Check OS notification settings');
        log('  4. Try a different browser (Chrome/Edge recommended)');
      }
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Push Notification Debug Tool</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button onClick={checkServiceWorker}>
            1. Check Service Worker
          </Button>
          
          <Button onClick={checkPushPermission}>
            2. Check Permission
          </Button>
          
          <Button onClick={checkSubscription}>
            3. Check Subscription
          </Button>
          
          <Button onClick={sendTestPush}>
            4. Send Test Push
          </Button>
          
          <Button onClick={resubscribe} className="bg-blue-600 hover:bg-blue-700">
            Fix: Re-subscribe
          </Button>
          
          <Button onClick={unregisterAll} className="bg-red-600 hover:bg-red-700">
            Fix: Clear All & Reset
          </Button>
        </div>
        
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
          <div className="font-bold mb-2">Debug Log:</div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for actions...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={
                  log.includes('❌') ? 'text-red-400' : 
                  log.includes('✅') ? 'text-green-400' : 
                  log.includes('===') ? 'text-yellow-400 font-bold' :
                  'text-gray-300'
                }>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-bold mb-2">Troubleshooting Guide:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click buttons 1-4 in order to diagnose</li>
            <li>If subscription exists but no notifications arrive, try "Re-subscribe"</li>
            <li>If nothing works, click "Clear All & Reset", then refresh and allow notifications</li>
            <li>Check browser console (F12) for [SW] messages when push is sent</li>
            <li>Ensure browser notifications aren't blocked in OS settings</li>
          </ol>
        </div>
      </div>
    </div>
  );
}