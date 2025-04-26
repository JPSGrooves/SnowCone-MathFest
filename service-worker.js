const CACHE_NAME = 'snowcone-mathfest-v085';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './quikserveST- All.mp3',
  './correct.mp3',
  './incorrect.mp3',
  './QuikServe points25.mp3',
  './QuikServe points50.mp3',
  './QuikServe points75.mp3',
  './QuikServe points100.mp3',
  './cone.png',
  './SnowConeMathFestTitle.png'
  // Add any CSS or extra assets here if needed
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        return response || fetch(event.request);
      })
  );
});
