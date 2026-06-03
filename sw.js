// sw.js
const CACHE_NAME = 'v1';

// Install event (forces the service worker to activate immediately)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event (intercepts requests and passes them straight to the network)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
