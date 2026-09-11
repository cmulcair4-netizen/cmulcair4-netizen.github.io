// ========================================
// FLIPFORGE PWA - SERVICE WORKER
// ========================================

const CACHE_NAME = 'flipforge-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.log('Cache add error (some assets may not be available):', err);
                // Continue even if some assets fail to cache
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }

            return fetch(event.request).then(response => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // Return offline page or cached response if available
                return caches.match(event.request);
            });
        })
    );
});
