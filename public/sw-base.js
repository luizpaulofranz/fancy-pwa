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

workbox.precaching.precacheAndRoute([]);


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