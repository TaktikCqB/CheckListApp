const CACHE_NAME = 'checklist-pwa-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './tailwindcss.js',
    './icon-192.png',
    './icon-512.png',
    './apple-touch-icon.png',
    './favicon.ico'
];

// Install Event - Pre-cache all local assets for 100% offline access
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching local app shell assets for offline support');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting legacy cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Cache First with Network Fallback for ultimate offline stability
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version immediately
                return cachedResponse;
            }
            // If not in cache, fetch from network and update cache
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                console.warn('[SW] Fetch failed and resource not in cache:', event.request.url);
            });
        })
    );
});
