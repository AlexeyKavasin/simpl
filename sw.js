this.addEventListener('install', function(e) {
  e.waitUntil(
  // after the service worker is installed,
  // open a new cache
    caches.open('simpl').then(function(cache) {
    // add all URLs of resources we want to cache
      return cache.addAll([
        'index.html',
        'manifest.json',
        'css/main.min.css',
        'js/main.js',
        'js/main.transp.js',
        'js/main.min.js',
        'fonts/Inconsolata-Regular.woff',
        'fonts/Inconsolata-Regular.woff2',
        'fonts/Inconsolata-Bold.woff',
        'fonts/Inconsolata-Bold.woff2',
      ]);
    })
  );
});

this.addEventListener('fetch', function(event) {
  //console.log(event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
