// Enhanced Service Worker for Offline Capabilities & Push Notifications - Version 4.7

// Cache configuration
const CACHE_VERSION = 'v4.7';
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
      // Targeted cache cleanup: Delete old version caches, keep current version
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Keep caches matching current version
              return !cacheName.endsWith(CACHE_VERSION);
            })
            .map(cacheName => {
              return caches.delete(cacheName);
            })
        );
      }),
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
  
  // Handle app shell routes (SPA routing) - ALWAYS fetch fresh to get latest recovery script
  if (url.origin === location.origin && url.pathname.startsWith('/') && !url.pathname.includes('.')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only use cache as fallback if network fails
        return caches.match('/');
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
        // Validate cached response - check both status AND content-type
        if (response && response.ok && response.status === 200) {
          const cachedContentType = response.headers.get('content-type') || '';
          
          // CRITICAL: Verify cached content matches expected type
          const isValidCached = (
            (url.pathname.endsWith('.js') && (cachedContentType.includes('javascript') || cachedContentType.includes('application/ecmascript'))) ||
            (url.pathname.endsWith('.css') && cachedContentType.includes('text/css')) ||
            (url.pathname.endsWith('.otf') && cachedContentType.includes('font')) ||
            (url.pathname.endsWith('.png') && cachedContentType.includes('image/png')) ||
            (url.pathname.endsWith('.svg') && cachedContentType.includes('image/svg'))
          );
          
          // If cache is corrupted (wrong MIME type), delete it and fetch fresh
          if (!isValidCached) {
            caches.open(STATIC_CACHE).then(cache => cache.delete(event.request));
            return fetch(event.request);
          }
          
          return response;
        }
        
        // If cached response is invalid or doesn't exist, fetch fresh
        return fetch(event.request).then(fetchResponse => {
          // Only cache successful responses with correct MIME types
          if (fetchResponse.ok && fetchResponse.status === 200) {
            const contentType = fetchResponse.headers.get('content-type') || '';
            
            // CRITICAL: Never cache HTML as JavaScript/CSS - prevents MIME type errors
            if (contentType.includes('text/html')) {
              return fetchResponse; // Don't cache, just return
            }
            
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
            return response;
          }
          
          // Fetch and cache prayer content
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              // Clone immediately before caching
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
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
        return response;
      }).catch(() => {
        // No cache fallback - offline users get clear error for live content
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
            return response;
          }
          
          // Fetch and cache Torah content
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
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
  
  if (!event.data) {
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
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
  
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ezras Nashim', options)
      .catch(err => console.error('[SW] Error showing notification:', err))
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
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
});

// Handle background sync (for offline support)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
  }
});

// Handle messages from clients (for forced updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});