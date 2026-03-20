// Manguito PWA — Service Worker
const CACHE_NAME = 'manguito-v22';
const ASSETS = [
    '/',
    '/static/styles.css',
    '/static/app.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first for everything (ensures updates propagate quickly)
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // API requests: always network, no cache
    if (request.url.includes('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Static: network-first, fallback to cache
    event.respondWith(
        fetch(request).then((response) => {
            if (response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
        }).catch(() => {
            return caches.match(request);
        })
    );
});
