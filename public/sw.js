// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  console.log('[SW] Push data:', event.data ? event.data.text() : 'No data');
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
    console.log('[SW] Parsed push data:', data);
  } catch (e) {
    console.log('[SW] Failed to parse JSON, using text:', e);
    data = {
      title: 'Ezras Nashim',
      body: event.data.text()
    };
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      ...data.data
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'ezras-nashim-notification',
    renotify: data.renotify || false
  };
  
  console.log('[SW] Showing notification with options:', options);
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ezras Nashim', options)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch(err => console.error('[SW] Error showing notification:', err))
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Handle background sync (for offline support)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    console.log('Background sync for notifications');
  }
});