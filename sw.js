self.addEventListener('install', e => {
  e.waitUntil(
  // after the service worker is installed,
  // open a new cache
  caches.open('simpl').then(cache => {
  // add all URLs of resources we want to cache
    return cache.addAll([
      'index.html',
      'css/main.min.css',
      'js/main.min.js'
    ]);
   })
 );
});

self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
