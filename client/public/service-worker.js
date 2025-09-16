// Service Worker for Ezras Nashim PWA
// Version 1.2.0 - Auto-Update Ready - Cache Cleared

const CACHE_NAME = 'ezras-nashim-v1.2';
const DYNAMIC_CACHE = 'ezras-nashim-dynamic-v1.2';

// Core files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Pre-caching static assets
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => { /* Install failed */ })
  );
  // Force immediate activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE)
          .map(cacheName => {
            // Removing old cache
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API calls and external resources
  if (url.pathname.startsWith('/api/') || 
      url.hostname !== self.location.hostname ||
      url.protocol === 'chrome-extension:') {
    return;
  }

  // Network-first strategy for HTML pages (to ensure fresh content)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for offline
          return caches.match(request).then(response => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (CSS, JS, images, fonts)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(request).then(response => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, response.clone());
              });
            }
          });
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default network-first for everything else
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});