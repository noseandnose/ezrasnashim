// Enhanced Service Worker for Offline Capabilities & Push Notifications - Version 1.1.3
// Updated: 2025-11-30 - Auto-generated cache version

// Cache configuration with timestamp for guaranteed cache busting
const CACHE_VERSION = 'v1.1.3-1764498215764';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const PRAYERS_CACHE = `prayers-${CACHE_VERSION}`;
const TORAH_CACHE = `torah-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// App shell resources for instant loading
// NOTE: index.html is NOT cached - always fetch fresh to ensure recovery scripts load
const APP_SHELL_RESOURCES = [
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
  /\/api\/sponsors\/daily\//
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_RESOURCES.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => {
        console.log('[SW] App shell cached successfully');
        // Don't call skipWaiting here - let the client control when to activate
        // This prevents blank screens from activating before all assets are ready
      })
      .catch(err => {
        console.error('[SW] Failed to cache app shell:', err);
        // Continue anyway - the service worker can still function
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete VERY old version caches, but keep the immediate previous version
      // This prevents blank screens by ensuring old assets remain available
      // while new assets are fetched and cached on-demand
      caches.keys().then(cacheNames => {
        // Extract unique version suffixes (e.g., v1.0.0-1234567890)
        const versionPattern = /(v[\d.]+-\d+)$/;
        const uniqueVersions = new Set(
          cacheNames
            .map(name => {
              const match = name.match(versionPattern);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        );
        
        // Sort versions by timestamp (extract numeric suffix at end)
        const sortedVersions = Array.from(uniqueVersions)
          .map(version => {
            // Extract the last numeric part (timestamp) from version string
            const timestampMatch = version.match(/(\d+)$/);
            return {
              version,
              timestamp: timestampMatch ? parseInt(timestampMatch[1]) : 0
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp);
        
        // Keep ALL caches from the most recent 2 versions
        const versionsToKeep = new Set(
          sortedVersions.slice(0, 2).map(v => v.version)
        );
        
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              const match = cacheName.match(versionPattern);
              const version = match ? match[1] : null;
              const shouldDelete = version && !versionsToKeep.has(version);
              if (shouldDelete) {
                console.log('[SW] Deleting old cache:', cacheName);
              }
              return shouldDelete;
            })
            .map(cacheName => caches.delete(cacheName))
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
  
  // CRITICAL: NEVER cache the service worker itself - always fetch fresh
  if (url.pathname === '/sw.js') {
    return; // Let browser fetch directly, no interception
  }
  
  // CRITICAL: Skip service worker entirely for audio/video streaming and version checks
  // Audio requests must go directly to network without any caching or fallback
  // This prevents the PWA from receiving HTML when audio streaming fails temporarily
  // Version checks must always get fresh data to detect updates
  const isAudioVideo = event.request.destination === 'audio' || 
                       event.request.destination === 'video' ||
                       url.pathname.endsWith('.mp3') ||
                       url.pathname.endsWith('.m4a') ||
                       url.pathname.endsWith('.wav') ||
                       url.pathname.endsWith('.mp4') ||
                       url.pathname.endsWith('.webm') ||
                       url.pathname.includes('/api/media-proxy/') ||
                       event.request.headers.has('range');
  
  const isVersionCheck = url.pathname === '/api/version';
  
  if (isAudioVideo || isVersionCheck) {
    // Direct pass-through to network - no caching, no fallback, no interference
    return; // Let browser handle it directly
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
  
  // Unversioned assets (manifest, icons) - stale-while-revalidate for updates
  const isUnversionedAsset = url.pathname === '/manifest.json' || 
                             url.pathname.startsWith('/icon-') ||
                             url.pathname === '/apple-touch-icon.png' ||
                             url.pathname === '/favicon.ico';
  
  if (isUnversionedAsset) {
    event.respondWith(
      caches.open(APP_SHELL_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
          
          // Return cached version immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Handle versioned static assets (CSS, JS, fonts, images) - Cache First
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
    console.warn('[SW Push] Received push event with no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.warn('[SW Push] Failed to parse JSON, falling back to text:', e);
    try {
      const text = event.data.text();
      data = {
        title: 'Ezras Nashim',
        body: text || 'New notification'
      };
    } catch (err) {
      console.error('[SW Push] Failed to read push data:', err);
      return;
    }
  }
  
  // Skip silent validation pings - don't show notification
  if (data.silent || (data.data && data.data.type === 'validation')) {
    console.log('[SW Push] Received validation ping, skipping notification display');
    return;
  }
  
  // Validate data has minimum required fields
  if (!data.title && !data.body) {
    console.warn('[SW Push] Received push with no title or body, skipping');
    return;
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: data.timestamp || Date.now(),
      ...(data.data || {})
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'ezras-nashim-notification',
    renotify: data.renotify || false
  };
  
  const notificationPromise = self.registration.showNotification(
    data.title || 'Ezras Nashim', 
    options
  ).catch(err => {
    console.error('[SW Push] Error showing notification:', err);
    // If showing notification fails, try simplified version
    return self.registration.showNotification(
      data.title || 'Ezras Nashim',
      {
        body: data.body || '',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      }
    ).catch(fallbackErr => {
      console.error('[SW Push] Fallback notification also failed:', fallbackErr);
    });
  });
  
  event.waitUntil(notificationPromise);
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
    console.log('[SW] Received SKIP_WAITING message, activating new service worker');
    self.skipWaiting();
  }
});