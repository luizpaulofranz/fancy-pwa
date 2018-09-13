var CACHE_STATIC_NAME = 'static-v2';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
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
]

/** Adding Some Events */
// on SW instalation, we set our first cache, to statics
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker');
    // this wait simulates a SYNC code here, to finish the cache storage before go ahead
    // is important to finish the cache BEFORE other FETCH API calls
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME) //static is the name of this cache
            .then(cache => {
                console.log('[Service Worker] Precaching App Shell');
                // we only pre-cache the home-page files
                cache.addAll(STATIC_FILES);
                // add and addAll, perform the request em store the returned value, 
                // if we have the content, then we must use put functions
                //cache.add('/index.html')
            })
    )
});

self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker');
    // wait until we set remove the old cache before to do any fetch again
    event.waitUntil(
        caches.keys() // returns array of the keys of our caches ASYNC mode
        .then(keyList => {
            // Promise all takes an array of promises and waits all to finish
            return Promise.all(
                keyList.map( key => {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service Worker] Removing old cache.', key);
                        return caches.delete(key); //that's how we delete the cache
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// CACHE THEN NETWORK STRATEGY with dynamic cache, see feed.js too
// just save the content in cache and returns
// it is usefull in many cases, combines the best of network (data up to date)
// and cache (fast and offline). We first return some from the cache, and then
// requests to network an up to date version, replace the cache and the frontend.
// COMBINED WITH NETWORK WITH CACHE and CACHE ONLY ...
self.addEventListener('fetch', function (event) {
    console.log(event.request.url);
    // here we trates different cache strategies to different requests ...
    // CACHE THEN NETWORK
    const url = 'https://httpbin.org/get';
    if (event.request.url.indexOf(url) > -1) {
        console.log('CACHE THEN NETWORK');
        event.respondWith(
        caches.open(CACHE_DYNAMIC_NAME)
            .then(cache => {
            return fetch(event.request)
                .then(res => {
                    cache.put(event.request, res.clone());
                    return res;
                });
            })
        );
    // CACHE ONLY, for the static files
    } else if (STATIC_FILES.indexOf(event.request.url) > -1) {
        console.log('CACHE ONLY');
        event.respondWith(
            caches.match(event.request)
        );
    // NETWORK WITH CACHE
    } else {
        console.log('NETWORK WITH CACHE');
        event.respondWith(
            caches.match(event.request)// this is how we get content from cache
            // it always returns on then function, even when the cache does not exists
            .then(response => {
                // so we have to trate it
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                    // here we add to cache dynamically
                    .then( res => {
                        return caches.open(CACHE_DYNAMIC_NAME)
                        .then(cache => {
                            // with put we se the URL and the content (different from add)
                            //CLONE - response is a self consumer data, so we've to copy it
                            cache.put(event.request.url, res.clone());
                            return res;
                        })
                    })
                    // on network error (no internet connection), returns our default offline page
                    .catch( err => {
                        return caches.open(CACHE_STATIC_NAME)
                        .then( cache => {
                            // only returns if the request is a page, and not a CSS or JS file
                            // doesn't not make sense send offline.html instead of a CSS file
                            // you can do this for images for example, returning a dummy img
                            if (event.request.headers.get('accept').includes('text/html')) {
                                return cache.match('/offline.html');
                            }
                        });
                    });
                }
            })
        );
    }
});

/*
// CACHE WITH NETWORK FALLBACK STRATEGY
// the first strategy, not so usefull.
self.addEventListener('fetch', function(event) {
    //console.log('[Service Worker] Fetching Something');
    event.respondWith(
      caches.match(event.request)// this is how we get content from cache
        // it always returns on then function, even when the cache does not exists
        .then(response => {
            // so we have to trate it
          if (response) {
            return response;
          } else {
            return fetch(event.request)
               // here we add to cache dynamically
              .then(res => {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then( cache => { 
                    // with put we se the URL and the content (different from add)
                    //CLONE - response is a self consumer data, so we've to copy it
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              // on network error (no internet connection), returns our default offline page
              .catch(err => {
                return caches.open(CACHE_STATIC_NAME)
                    .then(cache => {
                        return cache.match('/offline.html')
                    })
              });
            }
        })
    );
});
*/
/*
// NETWORK WITH CACHE FALLBACK STRATEGY
// first attempt to network, if has no connection, then goes to cache
// not the ideal solution because of slow internet timeout
self.addEventListener('fetch', function(event) {
    fetch(event.request) // attempt to internet, save cache and returns
        // here we add to cache dynamically
        .then(res => {
        return caches.open(CACHE_DYNAMIC_NAME)
            .then( cache => { 
                cache.put(event.request.url, res.clone());
                return res;
            })
        })
        .catch(err => { // if offline, returns cache
            caches.match(event.request);
        })
});
*/
/*
// CACHE ONLY STRATEGY
// needs a precache strategy, recommended only for assets requests
self.addEventListener('fetch', function(event) {
    event.respondWith(
      // just returns what is already in cache
      caches.match(event.request)
    );
});
*/
/*
// NETWORK ONLY STRATEGY
// ignores the local cache, this is the normal behavior, without SW and fetch event listner
self.addEventListener('fetch', function(event) {
    event.respondWith(
      // just returns what is already in cache
      fetch.match(event.request)
    );
});
*/