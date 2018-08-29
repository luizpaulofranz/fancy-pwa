/** Adding Some Events */
// on SW instalation, we set our first cache, to statics
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker');
    // this wait simulates a SYNC code here, to finish the cache storage before go ahead
    // is important to finish the cache BEFORE other FETCH API calls
    event.waitUntil(
        caches.open('static') //static is the name of this cache
            .then(cache => {
                console.log('[Service Worker] Precaching App Shell');
                cache.add('/src/js/app.js')
                cache.add('/')
                cache.add('/index.html')
            })
    )
});

self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker');
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    //console.log('[Service Worker] Fetching Something');
    event.respondWith(
        caches.match(event.request) // this is how we get content from cache
        // it always returns on then function, even when the cache does not exists
        .then(res => {
            // so we have to trate it
            if (res) {
                return res;
            } else {
                return fetch(event.request);
            }
        })
    );
});