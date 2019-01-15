importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

// that's how we create our caches by routes
workbox.routing.registerRoute(
  new RegExp('/.*(?:googleapis|gstatic)\.com.*$/'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
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
  new RegExp('/.*(?:firebase\.googleapis)\.com.*$/'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'post-images',
  }), // our cache then network strategy
);

workbox.precaching.precacheAndRoute([]);