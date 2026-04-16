const CACHE_NAME = 'kerabat-pos-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './favicon.ico',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined'
];

// 1. Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Fetch Event: Stale-While-Revalidate strategy for assets
// Network-Only for API and skip Chrome extensions / non-http
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip API calls, Supabase, and non-GET requests
    if (
        request.method !== 'GET' || 
        url.pathname.startsWith('/api/') || 
        url.hostname.includes('supabase.co') ||
        !url.protocol.startsWith('http')
    ) {
        return;
    }

    // Navigation (HTML): Network-First, fallback to cached index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match('./index.html') || caches.match('./');
            })
        );
        return;
    }

    // Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, cacheCopy);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Return cached if network fails
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
