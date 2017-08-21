'use strict';

self.addEventListener('install', function(e) {
  e.waitUntil(
  // after the service worker is installed,
  // open a new cache
  caches.open('my-pwa-cache').then(function(cache) {
    return cache.addAll([
      '/',
      '/index.html',
      '/img/pepe.png',
      '/css/main.min.css',
      '/js/main.min.js',
    ]);
  })
 );
});
