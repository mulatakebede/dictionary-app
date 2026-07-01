// ================================================================
//  SERVICE WORKER - Offline Support for Dictionary App
// ================================================================

const CACHE_NAME = 'dictionary-pwa-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './dictionary-data.js'
  // Add any other files your app needs
];

// ================================================================
//  INSTALL - Cache all assets
// ================================================================

self.addEventListener('install', event => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installed successfully!');
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Service Worker: Installation failed:', err);
      })
  );
});

// ================================================================
//  ACTIVATE - Clean up old caches
// ================================================================

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated!');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// ================================================================
//  FETCH - Serve from cache, fallback to network
// ================================================================

self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip browser extension requests
  if (event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          // Update cache in background (stale-while-revalidate)
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, networkResponse.clone()));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback - show offline page if needed
            // You can return a custom offline page here
            console.log('⚠️ Network request failed:', event.request.url);
          });
      })
  );
});

// ================================================================
//  MESSAGE - Handle messages from the app
// ================================================================

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('📱 Service Worker loaded!');
