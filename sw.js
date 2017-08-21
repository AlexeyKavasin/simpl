self.addEventListener('install', e => {
  e.waitUntil(
  // after the service worker is installed,
  // open a new cache
  caches.open('my-pwa-cache').then(cache => {
  // add all URLs of resources we want to cache
    return cache.addAll([
      '.',
      'index.html',
      'img/pepe.png',
      'css/main.min.css',
      'js/main.min.js',
    ]);
   })
 );
});
