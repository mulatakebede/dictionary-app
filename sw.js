const CACHE_NAME = 'dict-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './dictionary-data.js',
  './launchericon-48x48.png',
  './launchericon-72x72.png',
  './launchericon-96x96.png',
  './launchericon-144x144.png',
  './launchericon-192x192.png',
  './launchericon-512x512.png'
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
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Installed!');
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
        return self.clients.claim();
      })
  );
});

// ================================================================
//  FETCH - Serve from cache, fallback to network
// ================================================================

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
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
        return fetch(event.request);
      })
  );
});
