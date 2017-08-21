self.addEventListener('install', e => {
  e.waitUntil(
  // after the service worker is installed,
  // open a new cache
  caches.open('my-pwa-cache').then(cache => {
  // add all URLs of resources we want to cache
    return cache.addAll([
      'simpl/',
      'simpl/index.html',
      'simpl/img/pepe.png',
      'simpl/css/main.min.css',
      'simpl/js/main.min.js',
    ]);
   })
 );
});
