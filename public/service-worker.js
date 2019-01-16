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

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "6d4b50d602791d6a7a791d551c4d010c"
  },
  {
    "url": "manifest.json",
    "revision": "2fd5cd41fb94573af4b7936b717a7546"
  },
  {
    "url": "offline.html",
    "revision": "72ee1030313de4cad458dd730926967f"
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
    "url": "src/js/app.js",
    "revision": "116bfbea9bc09e99e8d56d0645d45453"
  },
  {
    "url": "src/js/dbUtility.js",
    "revision": "25fc8a0901d50825a7bec4a0dcd8b296"
  },
  {
    "url": "src/js/feed.js",
    "revision": "a2cb771631815406e377221f7569ce8f"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "a66942528a8af114e8a0ae4b517ab0be"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "sw-base.js",
    "revision": "b8cb6b476f2a62f12ae79f49a9e1f83b"
  },
  {
    "url": "sw.js",
    "revision": "bfa839a7980d845dff75bac200c5d270"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);