const CACHE_NAME = 'life-progress-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'chrome-extension/icon64.png',
  'chrome-extension/icon128.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
