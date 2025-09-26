// Enhanced Service Worker for Offline Capabilities & Push Notifications - Version 3
console.log('[SW] Enhanced Service Worker loading...');

// Cache configuration
const CACHE_VERSION = 'v3.0';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const PRAYERS_CACHE = `prayers-${CACHE_VERSION}`;
const TORAH_CACHE = `torah-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// App shell resources for instant loading
const APP_SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Prayer and Torah content patterns
const PRAYER_PATTERNS = [
  /\/api\/morning\/prayers/,
  /\/api\/mincha\/prayer/,
  /\/api\/maariv\/prayer/,
  /\/api\/nishmas\/prayer/,
  /\/api\/brochas\//,
  /\/api\/tehillim\//
];

const TORAH_PATTERNS = [
  /\/api\/torah\//,
  /\/api\/pirkei-avot\//
];

// Critical API patterns for offline functionality
const CRITICAL_API_PATTERNS = [
  /\/api\/zmanim\//,
  /\/api\/hebrew-date\//,
  /\/api\/sponsors\/daily\//,
  /\/api\/version/
];

self.addEventListener('install', (event) => {
  console.log('[SW] Enhanced Service Worker installed - Version 3');
  
  event.waitUntil(
    Promise.all([
      // Cache app shell resources
      caches.open(APP_SHELL_CACHE).then(cache => {
        console.log('[SW] Caching app shell resources');
        return cache.addAll(APP_SHELL_RESOURCES.map(url => new Request(url, { cache: 'reload' })));
      }),
      
      // Cache critical static resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll([
          '/fonts/VC-Koren-Light.otf',
          '/fonts/KorenSiddur.otf',
          '/fonts/ArnoKoren.otf'
        ]);
      })
    ]).then(() => {
      console.log('[SW] App shell and static resources cached successfully');
      self.skipWaiting();
    }).catch(err => {
      console.error('[SW] Failed to cache app shell:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Enhanced Service Worker activated - Version 3');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.includes('v2') || (cacheName.includes('v1') && !cacheName.includes(CACHE_VERSION))) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      clients.claim()
    ]).then(() => {
      console.log('[SW] Cache cleanup completed and clients claimed');
    })
  );
});

// Enhanced fetch handler for offline capabilities
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle app shell routes (SPA routing)
  if (url.origin === location.origin && url.pathname.startsWith('/') && !url.pathname.includes('.')) {
    event.respondWith(
      caches.match('/').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }
  
  // Handle static assets (CSS, JS, fonts, images)
  if (url.pathname.includes('.') && (
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.otf') || 
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  )) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          const cache = caches.open(STATIC_CACHE);
          cache.then(c => c.put(event.request, fetchResponse.clone()));
          return fetchResponse;
        });
      }).catch(() => {
        // Return offline fallback for essential assets
        if (url.pathname.endsWith('.png')) {
          return caches.match('/icon-192.png');
        }
      })
    );
    return;
  }
  
  // Handle Prayer content - Cache First strategy
  if (PRAYER_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(PRAYERS_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            console.log('[SW] Serving prayer content from cache:', url.pathname);
            return response;
          }
          
          // Fetch and cache prayer content
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              console.log('[SW] Caching prayer content:', url.pathname);
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            console.log('[SW] Prayer content not available offline:', url.pathname);
            return new Response(JSON.stringify({
              error: 'Content not available offline',
              offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }
  
  // Handle Torah content - Cache First strategy
  if (TORAH_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(TORAH_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            console.log('[SW] Serving Torah content from cache:', url.pathname);
            return response;
          }
          
          // Fetch and cache Torah content
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              console.log('[SW] Caching Torah content:', url.pathname);
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            console.log('[SW] Torah content not available offline:', url.pathname);
            return new Response(JSON.stringify({
              error: 'Content not available offline',
              offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }
  
  // Handle Critical API requests - Stale While Revalidate
  if (CRITICAL_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
          
          // Return cached version immediately, update in background
          if (response) {
            console.log('[SW] Serving critical API from cache:', url.pathname);
            fetchPromise.catch(() => {}); // Update in background
            return response;
          }
          
          // No cache, wait for network
          return fetchPromise.catch(() => {
            return new Response(JSON.stringify({
              error: 'Service temporarily unavailable',
              offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }
  
  // Handle other API requests - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          // Cache successful API responses with shorter TTL
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, response.clone());
            // Auto-expire API cache entries after 1 hour
            setTimeout(() => {
              cache.delete(event.request);
            }, 60 * 60 * 1000);
          });
        }
        return response;
      }).catch(() => {
        // Try to serve from cache as fallback
        return caches.match(event.request).then(response => {
          if (response) {
            console.log('[SW] Serving API fallback from cache:', url.pathname);
            return response;
          }
          
          return new Response(JSON.stringify({
            error: 'Service temporarily unavailable',
            offline: true
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }
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