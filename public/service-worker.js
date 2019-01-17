importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");
importScripts('/src/js/idb.min.js');
importScripts('/src/js/dbUtility.min.js');

// that's how we create our caches by routes
workbox.routing.registerRoute(
  new RegExp('.*(?:googleapis|gstatic)\.com.*$'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
      maxEntries: 3, // max files to be cached
      maxAgeSeconds: 60 * 60 * 24 * 30 // a month
    }
  }), // our cache then network strategy
);

// caching specific CDN
workbox.routing.registerRoute( 'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'material-css',
  }), // our cache then network strategy
);

// caching firebase
workbox.routing.registerRoute(
  new RegExp('.*(?:firebasestorage\.googleapis)\.com.*$'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'post-images',
  }), // our cache then network strategy
);

// here we manage the indexed DB combined with workbox routes 
// if we handle the request manually, as we do here, we have to respond with a promise, with the URL response
workbox.routing.registerRoute('https://fancy-pwagram.firebaseio.com/posts.json', args => {
  return fetch(args.event.request)
    .then(res => {
      let clonedRes = res.clone();
      clearAll('posts')
      .then(() => {
        return clonedRes.json();
      })
      .then(data => {
        for (let key in data) {
          writeData('posts', data[key])
        }
      });
    return res;
  });
});

// offline fallback to an offline.html page
workbox.routing.registerRoute( routeData => {
  return (routeData.event.request.headers.get('accept').includes('text/html')); // only html pages requests (not CSS, images, etc)
}, args => {
  return caches.match(args.event.request)
    .then( response => {
      if (response) {
        return response;
      } else {
        return fetch(args.event.request)
          .then( res => {
            return caches.open('dynamic')
              .then( cache => {
                cache.put(args.event.request.url, res.clone());
                return res;
              })
          })
          .catch( err => {
            return caches.match('/offline.html')
              .then( res => {
                return res;
              });
          });
      }
    })
});

workbox.precaching.precacheAndRoute([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "418d46e7a79a81abfdfe7f3a7b03bfa3"
  },
  {
    "url": "manifest.json",
    "revision": "363fb96d59fb97a7bc70fe02dae3c503"
  },
  {
    "url": "offline.html",
    "revision": "02c54a46fe37185381b01b8a06791bb1"
  },
  {
    "url": "src/css/app.css",
    "revision": "fe57b08349f1df442238a09a69f20918"
  },
  {
    "url": "src/css/feed.css",
    "revision": "bced9ba6ba69f2bb782e7cc7fc5cef3b"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "3c2efc01408968735a1bd98dcf80f88d"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "fed16b290f9d329b29571199d40059ce"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "58a215ab2d1922c990cce03e6c56cb24"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "68dc24fdf2a8f30575ecabff8772317e"
  },
  {
    "url": "src/js/dbUtility.min.js",
    "revision": "0ace1ac156abb2453eac288a1f5510b6"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "7ca3fb6e7941aba4074590c073a72191"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "fe42b963014ef7b49642dc5e78031214"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "a9992e6703c604edb50bc82dfd9e189b"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "385e8f6ccf4db2216062e1653e51573d"
  },
  {
    "url": "src/js/idb.js",
    "revision": "a66942528a8af114e8a0ae4b517ab0be"
  },
  {
    "url": "src/js/dbUtility.js",
    "revision": "8968747058aeb289b80471974e3540bb"
  }
]);


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
                      postData.append('rawLocationLat', dt.rawLocation.lat);
                      postData.append('rawLocationLng', dt.rawLocation.lng);
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
                                  // and here clear the endpoint cache to re-save the cache
                                  caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                                      return cache.delete('/posts.json');
                                  });
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

  //console.log(notification);

  // tha's how we handle with multiple actions on notification
  if (action == 'confirm') {
      //console.log('Confirm was clicked!');
  } else {
      //console.log(action);
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
  //console.log('Push Notification received', event);
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