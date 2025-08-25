import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestPush() {
  const [status, setStatus] = useState<string[]>([]);
  
  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const testServiceWorker = async () => {
    try {
      addStatus('Checking service worker...');
      
      if (!('serviceWorker' in navigator)) {
        addStatus('❌ Service workers not supported');
        return;
      }
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        addStatus('❌ No service worker registered');
        return;
      }
      
      for (const reg of registrations) {
        addStatus(`✅ Service worker found: ${reg.scope}`);
        addStatus(`  - Active: ${reg.active ? 'Yes' : 'No'}`);
        addStatus(`  - Installing: ${reg.installing ? 'Yes' : 'No'}`);
        addStatus(`  - Waiting: ${reg.waiting ? 'Yes' : 'No'}`);
      }
      
      // Check push manager
      const reg = registrations[0];
      if (!reg.pushManager) {
        addStatus('❌ Push manager not available');
        return;
      }
      
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        addStatus('✅ Push subscription active');
        addStatus(`  - Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      } else {
        addStatus('❌ No push subscription');
      }
      
      // Check notification permission
      addStatus(`📱 Notification permission: ${Notification.permission}`);
      
    } catch (error: any) {
      addStatus(`❌ Error: ${error.message}`);
    }
  };
  
  const requestPermission = async () => {
    try {
      addStatus('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      addStatus(`Permission result: ${permission}`);
    } catch (error: any) {
      addStatus(`❌ Error: ${error.message}`);
    }
  };
  
  const testLocalNotification = () => {
    try {
      addStatus('Testing local notification...');
      
      if (Notification.permission !== 'granted') {
        addStatus('❌ Notifications not permitted');
        return;
      }
      
      new Notification('Test Notification', {
        body: 'This is a local test notification',
        icon: '/icon-192x192.png'
      });
      
      addStatus('✅ Local notification sent');
    } catch (error: any) {
      addStatus(`❌ Error: ${error.message}`);
    }
  };
  
  const sendTestPush = async () => {
    try {
      addStatus('Sending test push from server...');
      
      // Construct the API URL for Replit environment
      let apiUrl = '/api/push/test';
      
      if (window.location.hostname.includes('replit')) {
        // In Replit, construct the backend URL properly
        const hostname = window.location.hostname;
        // Replace the webview port indicator with the backend port
        const backendHost = hostname.includes('-00-') 
          ? hostname.replace('-00-', '-5000-')
          : hostname;
        apiUrl = `https://${backendHost}/api/push/test`;
      } else if (import.meta.env.DEV) {
        apiUrl = 'http://localhost:5000/api/push/test';
      }
      
      addStatus(`Using API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Push Notification',
          body: `Test at ${new Date().toLocaleTimeString()}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      addStatus(`Raw response: ${text}`);
      
      try {
        const data = JSON.parse(text);
        addStatus(`Parsed response: ${JSON.stringify(data)}`);
        
        if (data.success) {
          addStatus('✅ Push sent successfully!');
          addStatus('📱 Check your device for the notification');
          addStatus('💡 If you don\'t see it, check:');
          addStatus('  - Browser console for [SW] messages');
          addStatus('  - OS notification settings');
          addStatus('  - Do Not Disturb mode is off');
        } else {
          addStatus(`⚠️ Server reported: ${data.message}`);
        }
      } catch (parseError) {
        addStatus(`❌ Failed to parse response as JSON`);
      }
    } catch (error: any) {
      addStatus(`❌ Error: ${error.message}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Push Notification Debugger</h1>
        
        <div className="space-y-4 mb-6">
          <Button onClick={testServiceWorker} className="w-full">
            1. Check Service Worker Status
          </Button>
          
          <Button onClick={requestPermission} className="w-full">
            2. Request Notification Permission
          </Button>
          
          <Button onClick={testLocalNotification} className="w-full">
            3. Test Local Notification
          </Button>
          
          <Button onClick={sendTestPush} className="w-full">
            4. Send Test Push from Server
          </Button>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Status Log:</h2>
          <div className="space-y-1 text-sm font-mono">
            {status.length === 0 ? (
              <div className="text-gray-500">No status yet...</div>
            ) : (
              status.map((s, i) => (
                <div key={i} className={s.includes('❌') ? 'text-red-600' : s.includes('✅') ? 'text-green-600' : 'text-gray-700'}>
                  {s}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p>Open browser console (F12) to see service worker logs.</p>
          <p>Look for messages starting with [SW] in the console.</p>
        </div>
      </div>
    </div>
  );
}