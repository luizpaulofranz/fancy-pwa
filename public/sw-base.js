importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");
importScripts('/src/js/idb.js');
importScripts('/src/js/dbUtility.js');

// that's how we create our caches by routes
workbox.routing.registerRoute(
  new RegExp('/.*(?:googleapis|gstatic)\.com.*$/'),
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
  new RegExp('/.*(?:firebasestorage\.googleapis)\.com.*$/'),
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