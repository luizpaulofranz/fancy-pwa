importScripts('/src/js/idb.js');
importScripts('/src/js/dbUtility.js');

const CACHE_STATIC_NAME = 'static-v2';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const MAX_CACHE_SIZE = 20;
const STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/dbUtility.js',
    '/src/js/idb.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// helper function to keep our cache under control
// call it on add new dynamic caches, or wherever you want
function trimCache(cacheName, maxSize) {
    caches.open(cacheName)
        .then(cache => {
            return cache.keys()
        })
        .then(keys => {
            if (keys.length > maxSize) {
                // we delete the oldest cache and call own func again
                cache.delete(keys[0])
                then(trimCache(cacheName, maxSize));
            }
        })
}

/** Adding Some Events */
// on SW instalation, we set our first cache, to statics
self.addEventListener('install', function (event) {
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

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activating Service Worker');
    // wait until we set remove the old cache before to do any fetch again
    event.waitUntil(
        caches.keys() // returns array of the keys of our caches ASYNC mode
            .then(keyList => {
                // Promise all takes an array of promises and waits all to finish
                return Promise.all(
                    keyList.map(key => {
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
    const url = 'https://us-central1-fancy-pwagram.cloudfunctions.net/storePostsData';
    if (event.request.url.indexOf(url) > -1) {
        console.log('CACHE THEN NETWORK');
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    let cloneRes = res.clone();
                    // first we clear our indexedDB (it is not the best approach)
                    clearAll('posts').then(() => {
                        // to access the fetch response and insert again
                        return cloneRes.json() // return a promise
                    })
                        .then(data => {
                            for (let key in data) {
                                // here we use our idexedDB helper to insert data
                                writeData('posts', data[key]);
                            }
                        });
                    return res;
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
                            .then(res => {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(cache => {
                                        // control our cache growing
                                        trimCache(CACHE_DYNAMIC_NAME, MAX_CACHE_SIZE);
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

// background sync
// triggers when we have connection and we have events to sync (sync.register(...) on feed.js)
self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background syncing', event);
    // check what back sync is
    if (event.tag === 'sync-new-posts') {
        const url = 'https://us-central1-fancy-pwagram.cloudfunctions.net/storePostsData';
        console.log('[Service Worker] Syncing new Posts');
        // force waiting the data sending
        event.waitUntil(
            // get all our requests stored in indexedDB
            readAll('sync-posts')
                .then( data => {
                    // loop throug our stored requests, fetching and the deleting
                    for (var dt of data) {
                        // thats how we simulate a POST form submit
                        let postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('file', dt.picture, dt.id+'.png');

                        fetch(url, {
                            method: 'POST',
                            body: postData
                        })
                        // after fetc, we delete de data
                        .then( res => {
                            console.log('Sent data', res);
                            if (res.ok) {
                                res.json().then(resData => {
                                    // here we delete the data by ID returned by our custom firebase endpoint
                                    deleteRow('sync-posts', resData.id);
                                })
                            }
                        })
                        .catch(function (err) {
                            console.log('Error while sending data', err);
                        });
                    }

                })
        );
    }
});

// notification actions clicks handlers (see app.js displayConfirmNotification...)
self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;

    console.log(notification);

    // tha's how we handle with multiple actions on notification
    if (action == 'confirm') {
        console.log('Confirm was clicked!');
    } else {
        console.log(action);
        event.waitUntil(
            // clients is a SW variable, and contains all "clients" of THIS SW
            clients.matchAll().then( clis => {
                // we get the first client which is visible, normally the browser, in this case is the only client
                const client = clis.find(function(c) {
                    return c.visibilityState === 'visible';
                });
                // and here we navigate our PWA to the URL passed by the server
                if (client !== undefined) {
                    client.navigate(notification.data.url);
                    client.focus();
                } else {
                    clients.openWindow(notification.data.url);
                }
                notification.close();
            })
        );
    }

    notification.close();
});
// we can react to close without click above on notifications (swipe the notification out)
self.addEventListener('notificationclose', event => {
    console.log("Notification was closed!",event);
});

// this is the event which listen to PUSH NOTIFICATIONS
self.addEventListener('push', function(event) {
    console.log('Push Notification received', event);
    // receive data from server
    let data;
  
    if (event.data) {
      data = JSON.parse(event.data.text());
    }
  
    var options = {
      body: data.content,
      icon: '/src/images/icons/app-icon-96x96.png',
      badge: '/src/images/icons/app-icon-96x96.png',
      // here we send aditional data to our notification, see "notificationclick" event
      data: {
        url: data.openUrl
      }
    };
  
    event.waitUntil(
        // and here we show the notification
      self.registration.showNotification(data.title, options)
    );
  });