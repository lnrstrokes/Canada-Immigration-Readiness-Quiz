const CACHE_NAME = 'bacs-pwa-v3-' + Date.now();
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - Clean up ALL stale caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First for everything to prevent stale bundles
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

