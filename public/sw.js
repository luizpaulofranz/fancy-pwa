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
                // we only pre-cache the home-page files
                cache.addAll([
                    '/',
                    '/src/js/app.js',
                    '/src/js/feed.js',
                    '/src/js/promise.js',
                    '/src/js/fetch.js',
                    '/src/js/material.min.js',
                    '/src/css/app.css',
                    '/src/css/feed.css',
                    '/src/images/main-image.jpg',
                    'https://fonts.googleapis.com/css?family=Roboto:400,700',
                    'https://fonts.googleapis.com/icon?family=Material+Icons',
                    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
                ]);
                //cache.add('/index.html')
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