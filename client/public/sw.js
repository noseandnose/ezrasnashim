// Enhanced Service Worker for Offline Capabilities & Push Notifications - Version 4.4

// Cache configuration
const CACHE_VERSION = 'v4.4';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const PRAYERS_CACHE = `prayers-${CACHE_VERSION}`;
const TORAH_CACHE = `torah-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// App shell resources for instant loading
const APP_SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Prayer and Torah content patterns (excluding dynamic Tehillim)
const PRAYER_PATTERNS = [
  /\/api\/morning\/prayers/,
  /\/api\/mincha\/prayer/,
  /\/api\/maariv\/prayer/,
  /\/api\/nishmas\/prayer/,
  /\/api\/brochas\//
];

const TORAH_PATTERNS = [
  /\/api\/torah\//,
  /\/api\/pirkei-avot\//
];

// Tehillim patterns - Network First for live chain progression
const TEHILLIM_PATTERNS = [
  /\/api\/tehillim\//,
  /\/api\/global-tehillim\//,
  /\/api\/tehillim-completion\//
];

// Critical API patterns for offline functionality
const CRITICAL_API_PATTERNS = [
  /\/api\/zmanim\//,
  /\/api\/hebrew-date\//,
  /\/api\/sponsors\/daily\//,
  /\/api\/version/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_RESOURCES.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[SW] Failed to cache app shell:', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // EMERGENCY CLEANUP for v4.4: Delete ALL caches to fix MIME type corruption from v4.0-4.3
      // NOTE: Future versions should use targeted cleanup: only delete caches not matching CACHE_VERSION
      // This aggressive approach is temporary to ensure all users recover from corrupted caches
      caches.keys().then(cacheNames => 
        Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      ),
      // Claim all clients immediately
      clients.claim()
    ])
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
        // Validate cached response - only use if it's a successful response
        if (response && response.ok && response.status === 200) {
          return response;
        }
        
        // If cached response is invalid or doesn't exist, fetch fresh
        return fetch(event.request).then(fetchResponse => {
          // Only cache successful responses with correct MIME types
          if (fetchResponse.ok && fetchResponse.status === 200) {
            const contentType = fetchResponse.headers.get('content-type') || '';
            
            // Validate MIME type matches expected file type
            const isValidForCache = (
              (url.pathname.endsWith('.js') && (contentType.includes('javascript') || contentType.includes('application/ecmascript'))) ||
              (url.pathname.endsWith('.css') && contentType.includes('text/css')) ||
              (url.pathname.endsWith('.otf') && contentType.includes('font/otf')) ||
              (url.pathname.endsWith('.png') && contentType.includes('image/png')) ||
              (url.pathname.endsWith('.svg') && contentType.includes('image/svg'))
            );
            
            if (isValidForCache) {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
          }
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
              // Clone immediately before caching
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
  
  // Handle Tehillim content - Network First with NO caching for live chain progression
  if (TEHILLIM_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(event.request).then(response => {
        console.log('[SW] Serving fresh Tehillim data (no cache):', url.pathname);
        return response;
      }).catch(() => {
        // No cache fallback - offline users get clear error for live content
        console.log('[SW] Tehillim requires network connection:', url.pathname);
        return new Response(JSON.stringify({
          error: 'Tehillim chain requires internet connection for live updates',
          offline: true,
          requiresNetwork: true
        }), {
          status: 503,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
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
          // Clone immediately before caching
          const responseClone = response.clone();
          // Cache successful API responses with shorter TTL
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, responseClone);
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

// Handle messages from clients (for forced updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating immediately');
    self.skipWaiting();
  }
});