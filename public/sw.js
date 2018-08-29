/** Adding Some Events */
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker');
});

self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker');
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    //console.log('[Service Worker] Fetching Something');
    event.respondWith(fetch(event.request));
});