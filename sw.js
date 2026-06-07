// sw.js
// BUMPED VERSION: Changed from 'store-locals-v1' to 'store-locals-v2' to trigger the update!
const CACHE_NAME = 'store-locals-v1';

// 1. STATIC PRECACHING ARRAY:
// Added your new location-check.js file here so it's part of the core app shell.
const ASSETS_TO_CACHE = [
  './home.html',
  './manifest.json',
  './js/location-check.js', // <-- NEW FILE ADDED HERE
  './icons/192x192.png',
  './icons/512x512.png'
];

// INSTALL EVENT: Boots up the worker and saves your core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching core application framework...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Forces this new service worker to skip the standard waiting queue and activate instantly
  self.skipWaiting();
});

// ACTIVATE EVENT: Safely purges outdated data pools when you increment CACHE_NAME version numbers
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Purging old cached repository storage:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Forces all open application window tabs to fall under the authority of this active worker immediately
  self.clients.claim();
});

// FETCH EVENT: Dynamic intercept loop driving your Network-First strategy
self.addEventListener('fetch', (event) => {
  // CRITICAL SAFETY SHIELD: Do not handle non-GET network calls (e.g. Firebase Auth logins, POST checkout payments)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the internet is live and returns a valid file asset,
        // dynamically clone and save it into our device cache database to automatically pull in the whole repo.
        if (networkResponse.ok && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log('[Service Worker] Network connection dropped. Activating local device storage fallbacks...');

        // IF THE DEVICE GOES OFFLINE: Evaluate cached assets matching the specific request path
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If the specific page/asset asset isn't inside the cache database,
          // capture navigational failures and force them cleanly back to home.html instead of crashing
          if (event.request.mode === 'navigate') {
            return caches.match('./home.html');
          }
        });
      })
  );
});
