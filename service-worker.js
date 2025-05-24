const CACHE_NAME = 'biblia-pdm-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/lectura.html',
  '/audio.html',
  '/bookmarks.html',
  '/comments.html',
  '/diccionario.html',
  '/historias.html',
  '/memorizados.html',
  '/manifest.json',
  '/icons/pymicon.png',
  '/css/styles.css',
  '/js/script.js',
  'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install: cache assets and activate immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches and take control of clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
